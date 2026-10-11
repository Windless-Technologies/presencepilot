// Runs with Node's built-in test runner: node --test scripts/link-check-workflow.test.mjs
// Reads .github/workflows/link-check.yml as text (no YAML dependency) and
// fails when a property the engineering standards rely on is lost. Ported
// from the standards' templates/workflows/link-check.test.ts; the constants
// below are this product's.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The branch production ships from. Only its code may run with SENTRY_DSN.
const DEFAULT_BRANCH = "main";
// The step that creates the schema on the empty database: the product's own
// migration or schema command, never its seed.
const SCHEMA_COMMAND = null;

const here = dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(join(here, "..", ".github", "workflows", "link-check.yml"), "utf8");
// Comments explain the rules in prose (and name the seed to forbid it), so
// the checks below read the YAML without them.
const code = workflow
  .split("\n")
  .map((line) => line.replace(/(^|\s)#.*$/, ""))
  .filter((line) => line.trim() !== "")
  .join("\n");

/** The text of one job, from its key to the next job or the end. */
function job(name) {
  const start = code.indexOf(`\n  ${name}:\n`);
  assert.notEqual(start, -1, `job ${name} exists`);
  const rest = code.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][a-z0-9_-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/** The `run:` commands of a job, single-line and block. */
function runs(text) {
  const commands = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(?:- )?run: ?(.*)$/.exec(lines[i]);
    if (!match) continue;
    const indent = match[1].length;
    const body = [match[2]];
    while (i + 1 < lines.length && lines[i + 1].search(/\S/) > indent) body.push(lines[++i]);
    commands.push(body.join("\n"));
  }
  return commands;
}

/** A job's `if:` expression, its folded lines joined with single spaces. */
function condition(text) {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => /^ {4}if: /.test(line));
  assert.notEqual(at, -1, "the job has an if");
  const parts = [lines[at].replace(/^ {4}if: (>-)?/, "")];
  for (let i = at + 1; i < lines.length && /^ {6}/.test(lines[i]); i++) parts.push(lines[i]);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** The parts of an expression joined by `||` outside any parentheses. */
function alternatives(expression) {
  const found = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;
    else if (depth === 0 && expression.startsWith("||", i)) {
      found.push(expression.slice(start, i).trim());
      start = i + 2;
      i++;
    }
  }
  found.push(expression.slice(start).trim());
  return found;
}

describe("link check workflow", () => {
  it("pins every action to a full commit SHA", () => {
    const uses = [...code.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
    assert.ok(uses.length > 0);
    for (const ref of uses) assert.match(ref, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, ref);
  });

  it("only reads the repository, and never runs pull request code with secrets", () => {
    assert.match(code, /^permissions:\n {2}contents: read$/m);
    assert.equal(code.match(/permissions:/g)?.length, 1, "no job widens the permissions");
    assert.doesNotMatch(code, /pull_request_target|write-all|: write/);
  });

  it("runs on pull requests, daily, after a deployment and on demand", () => {
    for (const trigger of ["pull_request:", "schedule:", "deployment_status:", "workflow_dispatch:"]) {
      assert.match(code, new RegExp(`^ {2}${trigger}`, "m"), trigger);
    }
    assert.match(code, /- cron: "\d+ \d+ \* \* \*"/, "a daily schedule");
    assert.match(code, new RegExp(`^ {2}push:\\n {4}branches: \\[${DEFAULT_BRANCH}\\]$`, "m"), "pushes to the default branch");
  });

  it("checks production only after a successful Production deployment, a schedule, or by hand", () => {
    const production = job("production");
    assert.match(production, /github\.event\.deployment_status\.state == 'success'/);
    assert.match(production, /github\.event\.deployment\.environment == 'Production'/);
    assert.match(production, /github\.event_name == 'schedule'/);
    assert.match(production, /LINK_CHECK_TARGET: production/);
    assert.match(production, /PLAYWRIGHT_BASE_URL: \$\{\{ vars\.SITE_URL( \|\| '[^']+')? \}\}/);
  });

  it(`runs a manual production check only from ${DEFAULT_BRANCH}, because the job holds SENTRY_DSN`, () => {
    // A dispatch runs the workflow and scripts of the branch the person picks,
    // so an unguarded dispatch hands the secret to unreviewed branch code.
    const dispatches = alternatives(condition(job("production"))).filter((part) =>
      part.includes("'workflow_dispatch'"),
    );
    assert.equal(dispatches.length, 1, "one way in by hand");
    assert.equal(
      dispatches[0],
      `(github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/${DEFAULT_BRANCH}')`,
    );
  });

  it(`checks out ${DEFAULT_BRANCH} in the production job, whatever ref the deployment came from`, () => {
    // A deployment_status run checks out the deployment's ref by default, and
    // a Production deployment can come from another branch; the report step
    // would then run that branch's script with SENTRY_DSN.
    const production = job("production");
    const checkout = production.slice(production.indexOf("actions/checkout@")).split(/\n\s+- /)[0];
    assert.match(checkout, new RegExp(`\\n\\s+ref: ${DEFAULT_BRANCH}\\n`));
  });

  it("refuses a blank or non-https SITE_URL instead of checking some other address", () => {
    const production = job("production");
    assert.match(production, /-z "\$\{SITE_URL\/\/ \/\}"/);
    assert.match(production, /https:\/\/\*\)/);
    assert.doesNotMatch(production, /environment_url|target_url/, "never the deployment's own hosting address");
  });

  it("gives the error tracker's DSN to the report step only, never to the crawl", () => {
    const production = job("production");
    assert.equal(code.match(/secrets\./g)?.length, 1, "one secret in the whole workflow");
    const reportStep = production.slice(production.indexOf("- name: Report"));
    assert.match(reportStep.split("- name:")[1] ?? "", /SENTRY_DSN: \$\{\{ secrets\.SENTRY_DSN \}\}/);
    assert.match(reportStep, /if: always\(\)/);
    assert.match(production, /node scripts\/report-link-check\.mjs test-results\/links\/report\.json/);
  });

  it("checks links on a database with the schema and no seed data", () => {
    const fresh = job("fresh");
    assert.match(fresh, /LINK_CHECK_TARGET: fresh/);
    if (SCHEMA_COMMAND) {
      assert.match(fresh, /services:\n\s+postgres:/);
      assert.ok(runs(fresh).some((command) => SCHEMA_COMMAND.test(command)), "a step creates the schema");
    }
    for (const command of runs(fresh)) {
      assert.doesNotMatch(command, /seed|fixture|demo|sample.?data|db:reset/i, `the fresh job must not load data: ${command}`);
    }
    assert.doesNotMatch(fresh, /POSTGRES_PASSWORD|:\/\/[^\s$]+:[^\s@]+@/, "no password or credential-shaped URL");
  });

  it("requests external sites only in the production job, set explicitly in both", () => {
    assert.match(job("fresh"), /LINK_CHECK_EXTERNAL: "false"/);
    assert.match(job("production"), /LINK_CHECK_EXTERNAL: "true"/);
    assert.equal(code.match(/LINK_CHECK_EXTERNAL:/g)?.length, 2);
  });

  it("runs only the link check spec in both jobs", () => {
    for (const name of ["fresh", "production"]) {
      assert.ok(runs(job(name)).includes("npx playwright test tests/links"), name);
    }
  });

  it("keeps a Preview or demo deployment's run from cancelling the production crawl", () => {
    const group = /^concurrency:\n {2}group: (.+)$/m.exec(code)?.[1] ?? "";
    assert.match(group, /\$\{\{ github\.event_name \}\}/);
    assert.match(group, /\$\{\{ github\.ref \}\}/);
    assert.match(group, /\$\{\{ github\.event\.deployment\.environment \}\}/, "the deployment's environment is part of the group");
  });

  it("checks out every job's code before any other step, so the report step always has its script", () => {
    for (const name of ["fresh", "production"]) {
      const steps = job(name).slice(job(name).indexOf("steps:"));
      const first = /\n\s+- (uses|name|run): ?(.*)/.exec(steps);
      assert.equal(first?.[1], "uses", `${name}: the first step is checkout`);
      assert.match(first?.[2] ?? "", /^actions\/checkout@/, name);
    }
    const production = job("production");
    assert.ok(production.indexOf("actions/checkout@") < production.indexOf("SITE_URL is set"));
  });

  it("never interpolates event data into a run block", () => {
    for (const command of runs(code)) assert.doesNotMatch(command, /\$\{\{/, command);
  });
});
