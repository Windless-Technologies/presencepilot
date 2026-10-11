// Runs with Node's built-in test runner: node --test scripts/report-link-check.test.mjs
// Ported from engineering-standards, templates/ci/report-link-check.test.ts,
// with the types removed; the percent-encoded number cases at the end are
// added here. No network: the error tracker is a fake fetch.
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as reporter from "./report-link-check.mjs";
import { redactPersonalData as redactInCheck, redactUrls } from "../tests/support/links.ts";

const { buildEvent, envelope, main, parseDsn, readReport, redactPersonalData, send, stripQuery, stripQueriesInText, summary, MAX_LISTED, SEND_ATTEMPTS } = reporter;

// Built from parts, so no credential-shaped URL sits in the source.
const DSN = ["https:", "//", "publickey", "@", "errors.example.com", "/42"].join("");

const BROKEN = {
  target: "production",
  site: "https://product.example.com",
  pagesCrawled: 12,
  externalLinks: 3,
  problems: [
    { page: "https://product.example.com/", link: "https://product.example.com/demo", problem: "answers 404" },
    {
      page: "https://product.example.com/reset?token=secret-token",
      link: "https://product.example.com/confirm?email=person@example.com",
      problem: "answers 500",
    },
    {
      page: "https://product.example.com/",
      link: "https://product.example.com/verify",
      // Playwright's navigation errors quote the URL they failed on.
      problem: "did not load in a browser (page.goto: net::ERR_ABORTED at https://product.example.com/verify?token=leaked-token&email=other@example.com)",
    },
  ],
};

describe("stripQuery", () => {
  it("keeps origin and path only", () => {
    assert.equal(stripQuery("https://product.example.com/a/b?token=x#y"), "https://product.example.com/a/b");
    assert.equal(stripQuery("(sitemap)"), "(sitemap)");
    assert.equal(stripQuery("/relative?email=a@example.com"), "/relative");
  });

  it("replaces an email address or long number in the path, and drops a user name and password", () => {
    assert.equal(stripQuery("https://product.example.com/u/person@example.com/orders/48151623"), "https://product.example.com/u/[email]/orders/[number]");
    const withUser = ["https://", "someone", ":", "hunter2", "@", "product.example.com/a"].join("");
    assert.equal(stripQuery(withUser), "https://product.example.com/a");
  });
});

describe("stripQueriesInText", () => {
  it("cuts every URL in free text at its query string or fragment", () => {
    assert.equal(
      stripQueriesInText("failed at https://product.example.com/a?token=x and http://b.example.org/c#d"),
      "failed at https://product.example.com/a and http://b.example.org/c"
);
  });

  it("drops a user name and password before the host", () => {
    // Built from parts, so no credential-shaped URL sits in the source.
    const withUser = ["https://", "someone", ":", "hunter2", "@", "b.example.org/c"].join("");
    assert.equal(stripQueriesInText(`could not reach ${withUser}.`), "could not reach https://b.example.org/c.");
  });

  it("replaces email addresses and long numbers anywhere in the text", () => {
    assert.equal(
      stripQueriesInText("failed for person@example.com at https://product.example.com/u/other%40example.com/orders/48151623, call +1 555-010-0199"),
      "failed for [email] at https://product.example.com/u/[email]/orders/[number], call +[number]"
);
  });
});

describe("redactPersonalData", () => {
  it("replaces email addresses and runs of seven or more digits", () => {
    assert.equal(redactPersonalData("a.b+c@mail.example.co.uk, 4111 1111 1111 1111, 1234567"), "[email], [number], [number]");
  });

  it("keeps status codes, ports, page counts and IP addresses, which identify nobody", () => {
    const text = "answers 404 on http://127.0.0.1:3100/ after 500 pages and 999999";
    assert.equal(redactPersonalData(text), text);
  });
});

describe("redaction of encoded addresses and parenthesised paths", () => {
  it("cuts the query string after a path with parentheses, which are legal in a path", () => {
    const text = "failed at https://product.example.com/a(b)?token=secret, then (see https://product.example.com/x?y=1).";
    assert.equal(stripQueriesInText(text), "failed at https://product.example.com/a(b), then (see https://product.example.com/x).");
    assert.equal(stripQuery("https://product.example.com/a(b)?token=secret"), "https://product.example.com/a(b)");
  });

  it("redacts an email address however its characters are percent-encoded", () => {
    for (const path of ["person%40example%2Ecom", "%70erson%40example.com", "person%2540example.com", "first%2Blast%40example.com"]) {
      assert.equal(stripQuery(`https://product.example.com/u/${path}`), "https://product.example.com/u/[email]", path);
      assert.equal(stripQueriesInText(`answers 404 at https://product.example.com/u/${path}?x=1`), "answers 404 at https://product.example.com/u/[email]", path);
    }
  });

  it("redacts an internationalized email address, plain or percent-encoded", () => {
    // jos%C3%A9%40example.com decodes to josé@example.com.
    for (const path of ["jos%C3%A9%40example.com", "jos%25C3%25A9%2540example.com", "josé@example.com", "%E7%94%A8%E6%88%B7%40%E4%BE%8B%E5%AD%90.%E4%B8%AD%E5%9B%BD"]) {
      assert.equal(stripQuery(`https://product.example.com/u/${path}`), "https://product.example.com/u/[email]", path);
      assert.equal(stripQueriesInText(`answers 404 at https://product.example.com/u/${path}?x=1`), "answers 404 at https://product.example.com/u/[email]", path);
    }
    assert.equal(redactPersonalData("for josé@exämple.de, пользователь@пример.рф and name@example.xn--p1ai"), "for [email], [email] and [email]");
    let deep = "person@example.com";
    for (let i = 0; i < 8; i++) deep = encodeURIComponent(deep);
    assert.equal(stripQuery(`https://product.example.com/u/${deep}`), "https://product.example.com/u/[email]", "however many times it was encoded");
    // A symbol outside ASCII is valid in an internationalized local part, so
    // the whole address goes, not only the part after the symbol.
    assert.equal(redactPersonalData("for jo👍@example.com and jo👍hn@example.com, or jo%F0%9F%91%8D%40example.com"), "for [email] and [email], or [email]");
    const event = JSON.stringify(buildEvent({ ...BROKEN, problems: [{ page: "https://product.example.com/u/jos%C3%A9%40example.com", link: "https://product.example.com/u/josé@example.com", problem: "answers 404 for josé@example.com" }] }));
    assert.doesNotMatch(event, /jos(é|%C3%A9)/i);
    assert.doesNotMatch(summary({ ...BROKEN, problems: [{ page: "https://product.example.com/u/jos%C3%A9%40example.com", link: "https://product.example.com/x", problem: "answers 404 for josé@example.com" }] }), /jos(é|%C3%A9)/i);
  });

  it("keeps every other escape as written, so the summary gains no markup or line break", () => {
    assert.equal(redactPersonalData("a%20b%3Cscript%3E%0A%ZZ"), "a%20b%3Cscript%3E%0A%ZZ");
    assert.equal(redactPersonalData("%C2%A0%E2%80%8B%E2%80%AE%C0%80%A9"), "%C2%A0%E2%80%8B%E2%80%AE%C0%80%A9");
  });

  it("keeps a carriage return or line feed in a problem from breaking a summary row", () => {
    const table = summary({ ...BROKEN, problems: [{ page: "https://product.example.com/a%0D%0A", link: "https://product.example.com/b", problem: "answers 404\r\n::error::forged" }] });
    const row = table.split("\n").find((line) => line.includes("/a%0D%0A"));
    assert.ok(row, "the problem stays on one row");
    assert.match(row, /answers 404 {2}::error::forged/);
    assert.doesNotMatch(table, /\r/);
  });

  it("leaves text without an address exactly as written, encoded letters and digits included", () => {
    // A run of seven encoded digits is a long number, like seven plain ones,
    // and is replaced (see "percent-encoded long numbers" below); short ones stay.
    for (const text of ["plain %61 text", "/status/%31%32%33", "/caf%C3%A9/a%2Eb"]) {
      assert.equal(redactPersonalData(text), text, text);
      assert.equal(stripQueriesInText(text), text, text);
    }
  });

  it("agrees with the spec's own redaction, so the report and the summary carry the same text", () => {
    const cases = [
      "failed at https://product.example.com/a(b)?token=secret, then (see https://product.example.com/x?y=1).",
      "answers 404 at https://product.example.com/u/person%2540example%2Ecom/orders/48151623?x=1",
      "could not reach https://product.example.com/(c)/d#frag; person@example.com",
    ];
    for (const text of cases) assert.equal(stripQueriesInText(text), redactUrls(text), text);
  });
});

describe("parseDsn", () => {
  it("finds the envelope endpoint and public key", () => {
    assert.deepEqual(parseDsn(DSN), { endpoint: "https://errors.example.com/api/42/envelope/", publicKey: "publickey" });
  });

  it("keeps a path prefix for a self-hosted tracker", () => {
    const dsn = ["https:", "//", "k", "@", "errors.example.com", "/sentry/7"].join("");
    assert.equal(parseDsn(dsn)?.endpoint, "https://errors.example.com/sentry/api/7/envelope/");
  });

  it("reads the same endpoint when the DSN ends in a slash", () => {
    for (const [path, endpoint] of [["/42/", "https://errors.example.com/api/42/envelope/"], ["/sentry/7/", "https://errors.example.com/sentry/api/7/envelope/"]]) {
      const dsn = ["https:", "//", "k", "@", "errors.example.com", path].join("");
      assert.equal(parseDsn(dsn)?.endpoint, endpoint, path);
    }
  });

  it("treats blank, malformed and plain-http values as unset", () => {
    for (const value of [undefined, "", "   ", "not a dsn", "https://errors.example.com/42", ["http:", "//k@", "errors.example.com/42"].join("")]) {
      assert.equal(parseDsn(value), null, String(value));
    }
  });
});

describe("buildEvent", () => {
  it("sends nothing when every link resolved", () => {
    assert.equal(buildEvent({ ...BROKEN, problems: [] }), null);
  });

  it("reports a broken link at error level, with one fingerprint per target so it alerts once", () => {
    const event = buildEvent(BROKEN, { runUrl: "https://github.com/acme/app/actions/runs/1", eventId: "a".repeat(32), now: new Date(0) });
    assert.ok(event);
    assert.equal(event.level, "error");
    assert.equal(event.environment, "production");
    assert.deepEqual(event.fingerprint, ["link-check", "production"]);
    assert.match(event.message.formatted, /3 broken or forbidden link\(s\) on https:\/\/product\.example\.com/);
    assert.equal(event.extra.total, 3);
    assert.equal(event.timestamp, "1970-01-01T00:00:00.000Z");
  });

  it("never carries a query string, a token or an email address", () => {
    const text = JSON.stringify(buildEvent(BROKEN));
    assert.doesNotMatch(text, /secret-token|leaked-token|person@example\.com|other@example\.com|\?/);
    assert.match(text, /ERR_ABORTED at https:\/\/product\.example\.com\/verify\)/, "the problem keeps the URL's origin and path");
  });

  it("never carries an email address or a long number from a path or an error message", () => {
    const personal = {
      ...BROKEN,
      problems: [
        { page: "https://product.example.com/u/person@example.com", link: "https://product.example.com/orders/48151623", problem: "answers 404" },
        { page: "https://product.example.com/", link: "https://product.example.com/call", problem: "could not be reached (person@example.com, 555 010 0199)" },
      ],
    };
    const text = JSON.stringify(buildEvent(personal, { runUrl: "https://github.com/acme/app/actions/runs/1234567890" }));
    assert.doesNotMatch(text, /person@example\.com|48151623|555 010 0199/);
    assert.match(text, /\/u\/\[email\]/);
    assert.match(text, /\/orders\/\[number\]/);
    assert.match(text, /actions\/runs\/1234567890/, "the run link is GitHub's own, and its id is needed to open it");
    const table = summary(personal);
    assert.doesNotMatch(table, /person@example\.com|48151623|555 010 0199/);
  });

  it("reports a check that did not finish, so a crash is not mistaken for a pass", () => {
    const event = buildEvent(null);
    assert.ok(event);
    assert.match(event.message.formatted, /did not finish/);
    assert.equal(event.environment, "unknown");
  });

  it("tags an unfinished check with the job's target, so a production-only alert rule sees it", () => {
    const event = buildEvent(null, { target: "production" });
    assert.equal(event?.environment, "production");
    assert.deepEqual(event?.fingerprint, ["link-check", "production"]);
  });

  it("lists at most MAX_LISTED problems", () => {
    const many = { ...BROKEN, problems: Array.from({ length: MAX_LISTED + 7 }, (_, i) => ({ page: "/", link: `/p${i}`, problem: "answers 404" })) };
    const event = buildEvent(many);
    assert.equal(event?.extra.problems.length, MAX_LISTED);
    assert.equal(event?.extra.total, MAX_LISTED + 7);
  });
});

describe("envelope", () => {
  it("is a header line, an item header and the event", () => {
    const event = buildEvent(BROKEN, { eventId: "b".repeat(32) });
    assert.ok(event);
    const [header, item, body, extra] = envelope(event, DSN).split("\n");
    assert.equal(extra, undefined);
    assert.equal(JSON.parse(header ?? "").event_id, "b".repeat(32));
    assert.deepEqual(JSON.parse(item ?? ""), { type: "event" });
    assert.equal(JSON.parse(body ?? "").level, "error");
  });
});

describe("summary", () => {
  it("lists each broken link without its query string", () => {
    const text = summary(BROKEN);
    assert.match(text, /3 broken or forbidden link\(s\)/);
    assert.doesNotMatch(text, /leaked-token|other@example\.com/);
    assert.match(text, /\| https:\/\/product\.example\.com\/demo \| https:\/\/product\.example\.com\/ \| answers 404 \|/);
    assert.doesNotMatch(text, /secret-token|person@example\.com/);
  });

  it("says how many external links were left for the production run", () => {
    const text = summary({ ...BROKEN, target: "fresh", externalLinks: 0, externalLinksNotFetched: 4, problems: [] });
    assert.match(text, /4 external links met the rules but were not requested/);
    assert.doesNotMatch(summary(BROKEN), /not requested/);
  });

  it("says how many user-written links went to unlisted sites, only when there were some", () => {
    assert.match(summary({ ...BROKEN, userWrittenLinks: 6, problems: [] }), /6 links that users wrote on their own pages/);
    assert.doesNotMatch(summary(BROKEN), /users wrote/);
  });

  it("says so when every link resolved, and when the check did not finish", () => {
    assert.match(summary({ ...BROKEN, problems: [] }), /Every link resolved/);
    assert.match(summary(null), /did not finish/);
  });
});

describe("main", () => {
  let dir;
  let reportFile;
  let summaryFile;
  const lines = [];
  const log = { log: (line) => void lines.push(line) };
  const calls = [];
  const okFetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "report-link-check-"));
    reportFile = join(dir, "report.json");
    summaryFile = join(dir, "summary.md");
    writeFileSync(summaryFile, "");
    lines.length = 0;
    calls.length = 0;
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("sends one event and writes the summary when a link is broken", async () => {
    writeFileSync(reportFile, JSON.stringify(BROKEN));
    const result = await main({ argv: [reportFile], env: { SENTRY_DSN: DSN, GITHUB_STEP_SUMMARY: summaryFile }, fetchImpl: okFetch, log });
    assert.deepEqual(result, { sent: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "https://errors.example.com/api/42/envelope/");
    assert.equal(calls[0]?.init.method, "POST");
    assert.match(calls[0]?.init.headers["x-sentry-auth"] ?? "", /sentry_key=publickey/);
    assert.match(readFileSync(summaryFile, "utf8"), /answers 404/);
  });

  it("sends nothing when every link resolved", async () => {
    writeFileSync(reportFile, JSON.stringify({ ...BROKEN, problems: [] }));
    const result = await main({ argv: [reportFile], env: { SENTRY_DSN: DSN }, fetchImpl: okFetch, log });
    assert.deepEqual(result, { sent: false });
    assert.equal(calls.length, 0);
  });

  it("reports a missing report as a check that did not finish, in the job's environment", async () => {
    const result = await main({
      argv: [join(dir, "missing.json")],
      env: { SENTRY_DSN: DSN, LINK_CHECK_TARGET: "production" },
      fetchImpl: okFetch,
      log,
    });
    assert.deepEqual(result, { sent: true });
    assert.match(calls[0]?.init.body ?? "", /did not finish/);
    assert.match(calls[0]?.init.body ?? "", /"environment":"production"/);
  });

  it("warns and still writes the summary when SENTRY_DSN is blank", async () => {
    writeFileSync(reportFile, JSON.stringify(BROKEN));
    const result = await main({ argv: [reportFile], env: { SENTRY_DSN: "  ", GITHUB_STEP_SUMMARY: summaryFile }, fetchImpl: okFetch, log });
    assert.deepEqual(result, { sent: false });
    assert.equal(calls.length, 0);
    assert.match(lines.join("\n"), /::warning::SENTRY_DSN is not set/);
    assert.match(readFileSync(summaryFile, "utf8"), /answers 404/);
  });

  it("never throws when the error tracker is down, and never prints the DSN", async () => {
    writeFileSync(reportFile, JSON.stringify(BROKEN));
    const down = async () => {
      throw new TypeError(`fetch failed for ${DSN}`);
    };
    const result = await main({ argv: [reportFile], env: { SENTRY_DSN: DSN }, fetchImpl: down, log, retry: { delayMs: 0 } });
    assert.deepEqual(result, { sent: false });
    assert.doesNotMatch(lines.join("\n"), /publickey|errors\.example\.com/);
    const refused = await main({ argv: [reportFile], env: { SENTRY_DSN: DSN }, fetchImpl: async () => ({ ok: false, status: 429 }), log, retry: { delayMs: 0 } });
    assert.deepEqual(refused, { sent: false });
    assert.match(lines.join("\n"), /answered 429 after 3 attempt/);
  });

  it("sends once more when the first attempt fails, and still writes the summary first", async () => {
    writeFileSync(reportFile, JSON.stringify(BROKEN));
    let n = 0;
    const flaky = async (url, init) => {
      calls.push({ url, init });
      return ++n === 1 ? { ok: false, status: 503 } : { ok: true, status: 200 };
    };
    const result = await main({ argv: [reportFile], env: { SENTRY_DSN: DSN, GITHUB_STEP_SUMMARY: summaryFile }, fetchImpl: flaky, log, retry: { delayMs: 0 } });
    assert.deepEqual(result, { sent: true });
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.init.body, calls[1]?.init.body, "the same event, so Sentry keeps one copy");
    assert.match(lines.join("\n"), /after 2 attempts/);
    assert.match(readFileSync(summaryFile, "utf8"), /answers 404/);
  });

  it("reads a report written by the spec", () => {
    writeFileSync(reportFile, JSON.stringify(BROKEN));
    assert.deepEqual(readReport(reportFile), BROKEN);
    writeFileSync(reportFile, "{ not json");
    assert.equal(readReport(reportFile), null);
  });
});

describe("send", () => {
  const init = { method: "POST", headers: {}, body: "event" };
  const noWait = { delayMs: 0, sleep: async () => {} };

  it("retries a network error, a 429 and a 5xx, at most SEND_ATTEMPTS times", async () => {
    for (const fail of [async () => { throw new TypeError("fetch failed"); }, async () => ({ ok: false, status: 429 }), async () => ({ ok: false, status: 502 })]) {
      let tries = 0;
      const result = await send(async () => { tries++; return fail(); }, "https://errors.example.com/", init, noWait);
      assert.equal(result.ok, false);
      assert.equal(tries, SEND_ATTEMPTS);
      assert.equal(result.attempts, SEND_ATTEMPTS);
    }
  });

  it("does not retry a 4xx other than 429, which the same request would get again", async () => {
    let tries = 0;
    const result = await send(async () => { tries++; return { ok: false, status: 400 }; }, "https://errors.example.com/", init, noWait);
    assert.deepEqual({ ok: result.ok, tries }, { ok: false, tries: 1 });
    assert.match(result.reason ?? "", /answered 400/);
  });

  it("waits longer before each further attempt", async () => {
    const waits = [];
    await send(async () => ({ ok: false, status: 500 }), "https://errors.example.com/", init, { attempts: 4, delayMs: 100, sleep: async (ms) => void waits.push(ms) });
    assert.deepEqual(waits, [100, 200, 400]);
  });

  it("gives every attempt a time limit, so a tracker that never answers cannot hold the job", async () => {
    const hang = (_url, request) =>
      new Promise((_, reject) => request.signal?.addEventListener("abort", () => reject(request.signal?.reason)));
    const started = Date.now();
    const result = await send(hang, "https://errors.example.com/", init, { attempts: 2, attemptTimeoutMs: 20, delayMs: 0 });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 2);
    assert.match(result.reason ?? "", /Could not reach the error tracker \(TimeoutError\)/);
    assert.ok(Date.now() - started < 2_000);
  });

  it("stops when the overall time limit has passed, even with attempts left", async () => {
    let clock = 0;
    let tries = 0;
    const slow = async () => { tries++; clock += 600; return { ok: false, status: 503 }; };
    const result = await send(slow, "https://errors.example.com/", init, { attempts: 10, timeLimitMs: 1_000, delayMs: 100, sleep: async (ms) => void (clock += ms), now: () => clock });
    assert.equal(result.ok, false);
    assert.equal(tries, 2);
  });
});

describe("percent-encoded long numbers", () => {
  // URL paths keep their escapes, so an order or phone number written as
  // %34%38... read as plain digits nowhere and reached the summary and Sentry.
  const cases = [
    ["/orders/%34%38%31%35%31%36%32%33", "/orders/[number]"],
    ["/orders/%2534%2538%2531%2535%2531%2536%2532%2533", "/orders/[number]"],
    ["/call/555%20123%2D4567", "/call/[number]"],
    ["/call/555%20123-4567", "/call/[number]"],
  ];

  it("are replaced in the report script and in the link check alike", () => {
    for (const [text, expected] of cases) {
      assert.equal(redactPersonalData(text), expected, text);
      assert.equal(redactInCheck(text), expected, text);
    }
  });

  it("leave short numbers and other escapes as written", () => {
    for (const text of ["/a%20b", "/%31%32", "/page/%32%30%32%36", "/2026-10"]) {
      assert.equal(redactPersonalData(text), text);
      assert.equal(redactInCheck(text), text);
    }
  });

  it("never reach the job summary or the Sentry event", () => {
    const report = {
      target: "production",
      site: "https://product.example.com",
      pagesCrawled: 1,
      externalLinks: 0,
      problems: [{ page: "https://product.example.com/", link: "https://product.example.com/orders/%34%38%31%35%31%36%32%33", problem: "answers 404" }],
    };
    const event = buildEvent(report, { runUrl: "https://github.com/o/r/actions/runs/1", now: new Date(0), eventId: "0".repeat(32) });
    for (const text of [summary(report), JSON.stringify(event)]) {
      assert.doesNotMatch(text, /%34%38|48151623/);
      assert.match(text, /\/orders\/\[number\]/);
    }
  });
});

describe("a DSN with a malformed escape in its user name", () => {
  // It parses as a URL, but decoding its user name throws. The reporter
  // must treat it as unset and still write the summary, never crash.
  const malformed = ["https:", "//", "%ZZ", "@", "errors.example.com", "/42"].join("");

  it("is no DSN", () => {
    assert.equal(parseDsn(malformed), null);
  });

  it("leaves a failed run reported in the summary, with nothing sent", async () => {
    const dir = mkdtempSync(join(tmpdir(), "link-report-"));
    try {
      const reportFile = join(dir, "report.json");
      const summaryFile = join(dir, "summary.md");
      writeFileSync(reportFile, JSON.stringify(BROKEN));
      let calls = 0;
      const result = await main({
        argv: [reportFile],
        env: { SENTRY_DSN: malformed, GITHUB_STEP_SUMMARY: summaryFile },
        fetchImpl: async () => {
          calls++;
          return { ok: true, status: 200 };
        },
        log: { log: () => {} },
      });
      assert.equal(result.sent, false);
      assert.equal(calls, 0);
      assert.match(readFileSync(summaryFile, "utf8"), /answers 404/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
