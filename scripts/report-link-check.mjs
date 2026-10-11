#!/usr/bin/env node
// Reports a link check run (tests/links/links.spec.ts) where a person will see
// it. Copy it verbatim to scripts/report-link-check.mjs; the link check
// workflow (templates/workflows/link-check.yml) runs it after the check,
// whether the check passed or not.
//
// It always writes the GitHub job summary. When the check found a broken link,
// or did not finish, and SENTRY_DSN is set, it also sends one error event to
// the product's Sentry project, so the alert rules that already page someone
// for production errors page them for a broken live link too
// (STANDARDS.md, section 13: alerts reach a person). The event carries the
// link paths and the problem only: no query strings, which can hold a token
// or an email address, no user names or passwords before a host, no email
// address or long number anywhere (a path such as /u/person@example.com, an
// order or phone number in an error message), and no response bodies. The
// job summary gets the same cleaned text (STANDARDS.md, section 10).
//
// The send is retried a bounded number of times (SEND_ATTEMPTS) on a network
// error, a timeout, a 429 or a 5xx, and gives up when SEND_TIME_LIMIT_MS has
// passed, so a slow error tracker cannot hold the job open.
//
// It never fails the job itself: the check step already did, and a reporting
// outage must not hide the broken link behind a different error.
//
// No dependencies. Node 20 or later (global fetch and crypto).
//
// Usage: node scripts/report-link-check.mjs [test-results/links/report.json]
// Environment:
//   SENTRY_DSN           the product's DSN; blank means unset (summary only)
//   LINK_CHECK_TARGET    where the check ran, used when it crashed before writing a report
//   GITHUB_STEP_SUMMARY  set by GitHub Actions
//   GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID  for the run link

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** The most problems one event or summary lists; the run log has the rest. */
export const MAX_LISTED = 50;

/** How many times the event is sent before giving up. */
export const SEND_ATTEMPTS = 3;
/** The most one attempt may take. */
export const ATTEMPT_TIMEOUT_MS = 10_000;
/** The most every attempt and wait together may take. */
export const SEND_TIME_LIMIT_MS = 30_000;
/** The wait before the second attempt; it doubles after each further one. */
export const RETRY_DELAY_MS = 1_000;

/** Reads the report the spec writes. A missing or unreadable file means the check did not finish. */
export function readReport(file) {
  if (!existsSync(file)) return null;
  try {
    const report = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(report?.problems) ? report : null;
  } catch {
    return null;
  }
}

// An email address. Percent-encoded ones are decoded first (redactEmails).
// Any character outside ASCII counts except a space or a control, format or
// unassigned character, as in an internationalized (SMTPUTF8) address, so
// josé@example.com or jo👍@example.com is caught whole. A top-level domain
// is letters or punycode (xn--).
const EMAIL = /(?:[a-z0-9._%+-]|[^\p{ASCII}\p{Z}\p{C}])+(?:@|%40)(?:[a-z0-9-]|[^\p{ASCII}\p{Z}\p{C}])+(?:\.(?:[a-z0-9-]|[^\p{ASCII}\p{Z}\p{C}])+)*\.(?:xn--[a-z0-9-]+|[\p{L}\p{M}]{2,})/giu;
// One percent escape of an ASCII byte, or the escapes of one UTF-8 encoded
// character (a lead byte and its continuation bytes).
const ESCAPED_CHAR = /%(?:[0-7][0-9a-f]|[cd][0-9a-f]%[89ab][0-9a-f]|e[0-9a-f](?:%[89ab][0-9a-f]){2}|f[0-7](?:%[89ab][0-9a-f]){3})/gi;
// A character an email address can be written with.
const ADDRESS_CHAR = /^[\p{L}\p{M}\p{N}@._%+-]$/u;
// Seven or more digits, optionally grouped by single spaces or hyphens: a
// phone, card, account or order number. Status codes, ports and page counts
// are shorter, and dots are not separators, so an IP address is kept.
const LONG_NUMBER = /\d(?:[ -]?\d){6,}/g;

// Percent escapes of a digit, a space or a hyphen, the characters a long
// number is written with, however many times the % itself was encoded
// (%34, %2534). URL paths keep their escapes, so /orders/%34%38%31%35%31%36%32
// would otherwise reach a report with the number readable.
const NUMBER_ESCAPE = /%(?:25)*(?:3[0-9]|20|2d)/gi;
const NUMBER_RUN = /(?:[0-9 -]|%(?:25)*(?:3[0-9]|20|2d))+/gi;

/**
 * Every long number replaced, plain or percent-encoded. Each run of digits,
 * spaces, hyphens and their escapes is decoded on its own, and only a run
 * whose decoded form holds a long number changes, so an encoded path such as
 * /a%20b or /%31%32 reads as it did.
 */
function redactNumbers(text) {
  return text.replace(NUMBER_RUN, (run) => {
    const decoded = run.replace(NUMBER_ESCAPE, (escape) => decodeURIComponent(escape.replace(/^%(?:25)*/, "%")));
    const redacted = decoded.replace(LONG_NUMBER, "[number]");
    return redacted === decoded ? run : redacted;
  });
}

/** Email addresses and long numbers replaced, so nothing that identifies a person leaves the run. */
export function redactPersonalData(value) {
  return redactNumbers(redactEmails(String(value ?? "")));
}

/**
 * Every email address replaced, plain or percent-encoded. Each run of the
 * characters an address can be written with is decoded on its own, and only
 * a run whose decoded form holds an address changes, so an encoded path
 * such as /a%20b or /%31%32 reads as it did.
 */
function redactEmails(text) {
  return text.replace(/(?:[a-z0-9._%+@-]|[^\p{ASCII}\p{Z}\p{C}])+/giu, (run) => {
    const decoded = decodeEmailEscapes(run);
    const redacted = decoded.replace(EMAIL, "[email]");
    return redacted === decoded ? run : redacted;
  });
}

/**
 * Percent escapes of the characters an email address is written with
 * (letters, marks and digits from any script, @ . _ % + -) decoded, so
 * person%40example%2Ecom, a double-encoded person%2540example.com or
 * jos%C3%A9%40example.com (josé@example.com) is seen as the address it is. Any
 * other escape is left as written, so decoding cannot add markup, spaces or
 * line breaks to the summary, and an invalid one such as %ZZ is kept.
 */
export function decodeEmailEscapes(value) {
  let current = String(value ?? "");
  // Each pass undoes one layer of encoding and shortens the text, so this
  // ends; it stops when nothing changes, however many layers there were.
  for (;;) {
    const next = current.replace(ESCAPED_CHAR, (escape) => {
      let char;
      try {
        char = decodeURIComponent(escape);
      } catch {
        return escape; // an overlong or surrogate encoding
      }
      return ADDRESS_CHAR.test(char) ? char : escape;
    });
    if (next === current) break;
    current = next;
  }
  return current;
}

/**
 * Scheme, host and path only, with email addresses and long numbers
 * replaced. Query strings, fragments, user names and passwords never leave
 * the run.
 */
export function stripQuery(value) {
  const text = String(value ?? "");
  try {
    const url = new URL(text);
    return redactPersonalData(`${url.protocol}${url.host ? `//${url.host}` : ""}${url.pathname}`);
  } catch {
    return redactPersonalData(text.split(/[?#]/)[0] ?? "");
  }
}

/**
 * Every URL inside free text cut at its query string or fragment, without a
 * user name or password, and every email address or long number in the text
 * replaced. Error messages quote the URL they failed on, so the problem text
 * is cleaned here as well as in the spec.
 */
export function stripQueriesInText(value) {
  const cut = String(value ?? "").replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi, (match) => {
    const { url, trail } = splitTrailing(match);
    const end = url.search(/[?#]/);
    const bare = end === -1 ? url : url.slice(0, end);
    return bare.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/]*@/i, "$1") + trail;
  });
  return redactPersonalData(cut);
}

/**
 * A URL found in free text, without what belongs to the sentence after it.
 * Parentheses are legal in a path (/a(b)?token=x), so the URL keeps them and
 * is cut at its query string afterwards; only a closing parenthesis with no
 * opening one in the URL, as in "(see https://x.example/y)", and punctuation
 * after the URL are the sentence's.
 */
export function splitTrailing(match) {
  const count = (text, char) => text.split(char).length - 1;
  let url = match;
  let trail = "";
  for (;;) {
    const last = url.slice(-1);
    const unbalanced = last === ")" && count(url, ")") > count(url, "(");
    if (last === "" || !(/[.,;:!]/.test(last) || unbalanced)) break;
    trail = last + trail;
    url = url.slice(0, -1);
  }
  return { url, trail };
}

/** Splits a DSN into the envelope endpoint and the public key. Null when it is not a DSN. */
export function parseDsn(dsn) {
  const text = String(dsn ?? "").trim();
  if (!text) return null;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  // The project id and any path before it come from the same segments, so a
  // trailing slash (/42/) cannot leave the id in the prefix as well.
  const segments = url.pathname.split("/").filter(Boolean);
  const projectId = segments.pop();
  if (url.protocol !== "https:" || !url.username || !projectId || !/^\d+$/.test(projectId)) return null;
  const prefix = segments.map((segment) => `/${segment}`).join("");
  // A URL can parse with a malformed escape in its user name (%ZZ); that is
  // an invalid DSN, treated as unset, never a crash of the reporter.
  let publicKey;
  try {
    publicKey = decodeURIComponent(url.username);
  } catch {
    return null;
  }
  return {
    endpoint: `${url.origin}${prefix}/api/${projectId}/envelope/`,
    publicKey,
  };
}

/** The event for a failed or unfinished check, or null when every link resolved. */
export function buildEvent(
  report,
  { runUrl = "", now = new Date(), eventId = randomUUID().replace(/-/g, ""), target = "" } = {}
) {
  if (report && report.problems.length === 0) return null;
  // Without a report (the check crashed), the job's LINK_CHECK_TARGET still
  // says where it ran, so a production-only alert rule sees the event.
  const where = String(report?.target ?? (String(target).trim() || "unknown"));
  const problems = (report?.problems ?? []).slice(0, MAX_LISTED).map((p) => ({
    page: stripQuery(p.page),
    link: stripQuery(p.link),
    problem: stripQueriesInText(p.problem).slice(0, 300),
  }));
  const site = stripQuery(report?.site ?? "");
  const message = report
    ? `Link check found ${report.problems.length} broken or forbidden link(s) on ${site}`
    : "Link check did not finish, so no link was verified";
  return {
    event_id: eventId,
    timestamp: now.toISOString(),
    level: "error",
    platform: "other",
    logger: "link-check",
    environment: where,
    message: { formatted: message },
    // One issue for the check, not one per run, so a broken link alerts once
    // and further runs add events to it until it is fixed.
    fingerprint: ["link-check", where],
    tags: { check: "links", target: where },
    // The run link is built from GitHub's own variables (main), and its run
    // id is a long number the link needs, so it is not redacted.
    extra: { run: String(runUrl).split(/[?#]/)[0] ?? "", problems, total: report?.problems.length ?? null },
  };
}

/** Sentry's envelope format: a header line, an item header line, then the event. */
export function envelope(event, dsn) {
  return [
    JSON.stringify({ event_id: event.event_id, sent_at: event.timestamp, dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

/** Markdown for the job summary. */
export function summary(report, runUrl = "") {
  if (!report) return "## Link check\n\nThe check did not finish, so no link was verified. See the run log.\n";
  const skipped = report.externalLinksNotFetched
    ? ` ${report.externalLinksNotFetched} external links met the rules but were not requested (LINK_CHECK_EXTERNAL is false; the production run requests them).`
    : "";
  const userWritten = report.userWrittenLinks
    ? ` ${report.userWrittenLinks} links that users wrote on their own pages went to sites the product does not list; they were checked by every other rule but not requested (userContent in tests/links/links.config.ts).`
    : "";
  const head = `## Link check (${cell(redactPersonalData(report.target))})\n\n${report.pagesCrawled ?? 0} pages crawled on ${stripQuery(report.site)}, ${report.externalLinks ?? 0} external links requested.${skipped}${userWritten}\n`;
  if (report.problems.length === 0) return `${head}\nEvery link resolved.\n`;
  const rows = report.problems
    .slice(0, MAX_LISTED)
    .map((p) => `| ${cell(stripQuery(p.link))} | ${cell(stripQuery(p.page))} | ${cell(stripQueriesInText(p.problem))} |`);
  const more = report.problems.length > MAX_LISTED ? `\n${report.problems.length - MAX_LISTED} more in the run log${runUrl ? ` (${runUrl})` : ""}.\n` : "";
  return `${head}\n**${report.problems.length} broken or forbidden link(s).**\n\n| Link | Found on | Problem |\n| --- | --- | --- |\n${rows.join("\n")}\n${more}`;
}

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/[\r\n]/g, " ");

export async function main({ argv = process.argv.slice(2), env = process.env, fetchImpl = globalThis.fetch, log = console, retry = {} } = {}) {
  const file = argv[0] ?? "test-results/links/report.json";
  const report = readReport(file);
  const runUrl =
    env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : "";

  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, summary(report, runUrl));

  const event = buildEvent(report, { runUrl, target: env.LINK_CHECK_TARGET ?? "" });
  if (!event) {
    log.log("Every link resolved. Nothing to report.");
    return { sent: false };
  }
  const dsn = parseDsn(env.SENTRY_DSN);
  if (!dsn) {
    // Without a DSN the failed job is the alert: GitHub notifies on a failed
    // scheduled run, and the summary lists the links.
    log.log(`::warning::SENTRY_DSN is not set, so the broken links were not sent to the error tracker.`);
    return { sent: false };
  }
  const result = await send(fetchImpl, dsn.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-sentry-envelope",
      "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=link-check/1.0`,
    },
    body: envelope(event, String(env.SENTRY_DSN).trim()),
  }, retry);
  if (result.ok) {
    log.log(`Reported to the error tracker as event ${event.event_id}${result.attempts > 1 ? ` after ${result.attempts} attempts` : ""}.`);
    return { sent: true };
  }
  log.log(`::warning::${result.reason} after ${result.attempts} attempt(s); the broken links are in the job summary.`);
  return { sent: false };
}

/**
 * Sends the request, retrying a network error, a timeout, a 429 or a 5xx
 * until `attempts` is used up or `timeLimitMs` has passed. A 4xx other than
 * 429 is final: the request itself is wrong, and sending it again cannot help.
 * Never throws, and never puts the endpoint or DSN in its reason.
 */
export async function send(
  fetchImpl,
  url,
  init,
  {
    attempts = SEND_ATTEMPTS,
    attemptTimeoutMs = ATTEMPT_TIMEOUT_MS,
    timeLimitMs = SEND_TIME_LIMIT_MS,
    delayMs = RETRY_DELAY_MS,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
    now = () => Date.now(),
  } = {}
) {
  const deadline = now() + timeLimitMs;
  let reason = "Could not reach the error tracker";
  let attempt = 0;
  let wait = delayMs;
  while (attempt < attempts) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    attempt++;
    // A timer of its own, cleared after each attempt, rather than
    // AbortSignal.timeout, whose timer does not keep the process waiting.
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException("The attempt timed out", "TimeoutError")),
      Math.min(attemptTimeoutMs, remaining)
    );
    try {
      const response = await fetchImpl(url, { ...init, signal: controller.signal });
      if (response.ok) return { ok: true, attempts: attempt };
      reason = `The error tracker answered ${response.status}`;
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      reason = `Could not reach the error tracker (${error instanceof Error ? error.name : "error"})`;
    } finally {
      clearTimeout(timer);
    }
    if (attempt >= attempts || deadline - now() <= wait) break;
    await sleep(wait);
    wait *= 2;
  }
  return { ok: false, attempts: attempt, reason };
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) await main();
