// Runs with Node's built-in test runner: node --test scripts/link-check-rules.test.mjs
// Regression tests for gaps found in review after the link check
// (tests/support/links.ts and tests/links/links.spec.ts) was copied from the
// engineering standards' templates. The template's own suite covers the rest.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyLink, isRedirectStatus, RedirectGraph, reportable } from "../tests/support/links.ts";

const POLICY = {
  siteUrl: "https://product.example.com",
  ownedHosts: [],
  thirdPartyHosts: ["listed.example"],
  uncheckable: [],
  userContent: [],
  githubOwner: null,
  publicRepos: [],
};
const FRESH = { baseUrl: "http://localhost:3100", pageUrl: "http://localhost:3100/", target: "fresh" };

describe("a link to another host written with backslashes", () => {
  // The URL parser reads a backslash as a slash, so each of these names
  // evil.example. Read as relative, they were classified as internal and
  // requested even with external checks off.
  const forms = ["\\\\evil.example/path", "/\\evil.example/path", "\\/evil.example/path", "/\t/evil.example/path", "\n//evil.example/path"];

  it("is judged as the outside link it is", () => {
    for (const href of forms) {
      assert.equal(new URL(href, FRESH.pageUrl).hostname, "evil.example", JSON.stringify(href));
      const verdict = classifyLink(href, POLICY, FRESH);
      assert.equal(verdict.kind, "forbidden", JSON.stringify(href));
      assert.match(verdict.problem, /evil\.example/);
    }
  });

  it("to a listed domain is external, never internal", () => {
    assert.deepEqual(classifyLink("\\\\listed.example/a", POLICY, FRESH), {
      kind: "external",
      url: "http://listed.example/a", // the page's scheme, as for any network-path link
      checkStatus: true,
    });
  });

  it("leaves ordinary relative links internal", () => {
    for (const href of ["/a", "a/b", "./c", "?q=1", "/a\\b"]) {
      assert.equal(classifyLink(href, POLICY, FRESH).kind, "internal", href);
    }
  });
});

describe("a long number written with percent escapes", () => {
  it("is replaced in a reported path, however many times it was encoded", () => {
    assert.equal(reportable("https://product.example.com/orders/%34%38%31%35%31%36%32%33"), "https://product.example.com/orders/[number]");
    assert.equal(reportable("https://product.example.com/orders/%2534%2538%2531%2535%2531%2536%2532"), "https://product.example.com/orders/[number]");
    assert.equal(reportable("https://product.example.com/call/555%20123%2D4567"), "https://product.example.com/call/[number]");
  });

  it("leaves short numbers and other escapes as written", () => {
    for (const path of ["/a%20b", "/%31%32", "/page/%32%30%32%36"]) {
      assert.equal(reportable(`https://product.example.com${path}`), `https://product.example.com${path}`);
    }
  });
});

describe("a redirect chain's length", () => {
  // The external crawl measures chains on the shared RedirectGraph. It used
  // a count carried with each queued URL, which restarted at a URL in the
  // middle of a chain that was also linked directly and requested first.
  const MAX = 5;
  const hop = (i) => `https://listed.example/${i}`;

  it("counts the whole chain when its middle was followed first", () => {
    const graph = new RedirectGraph();
    // /1 -> /2 -> ... -> /6 was followed first, as a link of its own.
    for (let i = 1; i < 6; i++) graph.add(hop(i), hop(i + 1));
    // Then /0 -> /1: six redirects in a row from /0.
    graph.add(hop(0), hop(1));
    assert.ok(graph.longestChain(hop(1)) > MAX, "the chain from /0 is over the limit");
  });

  it("allows a chain at the limit", () => {
    const graph = new RedirectGraph();
    for (let i = 0; i < MAX; i++) graph.add(hop(i), hop(i + 1));
    for (let i = 1; i <= MAX; i++) assert.ok(graph.longestChain(hop(i)) <= MAX);
  });
});

describe("an external link that redirects back to the site", () => {
  // The spec imports @playwright/test, so it is read as text, as the
  // standards' own template tests do. Its external loop only requested such
  // a page for its status and never crawled it, so links on a page reached
  // only that way went unchecked.
  // Quotes and semicolons are normalized first, so a formatter's style
  // (Prettier, say) does not change what these checks read.
  const spec = readFileSync(new URL("../tests/links/links.spec.ts", import.meta.url), "utf8")
    .replace(/'/g, '"')
    .replace(/;$/gm, "");
  const start = spec.indexOf("while (external.length)");
  const externalLoop = spec.slice(start, spec.indexOf("await crawl()", start));

  it("sends the site's own page to the crawl, which reads its links", () => {
    assert.match(externalLoop, /verdict\.kind === "internal"\) \{\n\s+consider\(verdict, url\)/);
    assert.doesNotMatch(externalLoop, /verdict\.kind === "internal" \|\|/);
  });

  it("crawls again after every round of external checks", () => {
    assert.match(spec, /const crawl = async \(\) => \{/);
    assert.match(spec, /for \(;;\) \{\n\s+if \(!FETCH_EXTERNAL \|\| stopped\) break\n[\s\S]*?await crawl\(\)\n  \}/);
  });
});

describe("a link to a private repository written with percent escapes", () => {
  // github.com decodes the path, so an escaped owner or repository names the
  // same repository; the check compared the escaped text and let it through.
  const policy = { ...POLICY, githubOwner: "Example-Owner", publicRepos: ["public-repo"] };

  it("is still a link to that repository", () => {
    for (const href of [
      "https://github.com/%45xample-Owner/private-repo",
      "https://github.com/Example-Owner/%70rivate-repo",
      "https://github.com/%2545xample-Owner/private-repo",
    ]) {
      const verdict = classifyLink(href, { ...policy, thirdPartyHosts: ["github.com"] }, FRESH);
      assert.equal(verdict.kind, "forbidden", href);
      assert.match(verdict.problem, /Example-Owner\/private-repo/, href);
    }
  });

  it("leaves a listed public repository allowed, escaped or not", () => {
    for (const href of ["https://github.com/Example-Owner/public-repo", "https://github.com/%45xample-Owner/%70ublic-repo"]) {
      assert.equal(classifyLink(href, { ...policy, thirdPartyHosts: ["github.com"] }, FRESH).kind, "external", href);
    }
  });
});

describe("a 3xx answer", () => {
  // Every 3xx resolves, but only these redirect. A 300 or 304 may leave out
  // Location, and was reported as broken for doing so.
  it("needs a Location only when it redirects", () => {
    for (const status of [301, 302, 303, 307, 308]) assert.equal(isRedirectStatus(status), true, String(status));
    for (const status of [200, 300, 304, 305, 306, 399, 404]) assert.equal(isRedirectStatus(status), false, String(status));
  });

  it("is judged that way by the crawl and the sitemap reader", () => {
    const spec = readFileSync(new URL("../tests/links/links.spec.ts", import.meta.url), "utf8").replace(/'/g, '"');
    assert.match(spec, /const redirect = isRedirectStatus\(status\)/);
    assert.match(spec, /if \(!isRedirectStatus\(status\)\) break/);
    assert.doesNotMatch(spec, /status >= 300 && status < 400|status < 300 \|\| status >= 400/);
  });
});

describe("a nested sitemap", () => {
  // It was classified through the page callback, which also queued it as a
  // page: fetched twice, and counted against the crawl's page limit.
  const spec = readFileSync(new URL("../tests/links/links.spec.ts", import.meta.url), "utf8").replace(/'/g, '"');

  it("is classified without being queued as a page", () => {
    assert.match(spec, /nestedSitemap\(onSitemap\(nested\), depth\)/);
    assert.doesNotMatch(spec, /nestedSitemap\(onLoc\(/);
  });
});
