/**
 * Validation checks for the lead pipeline input handling.
 * Run with: node scripts/check-lead-validation.js
 */
const assert = require("assert");
const { normalizeLead } = require("../api/_leadStore");

const good = normalizeLead({
  name: "  Ana   Cruz ",
  email: "ANA@Example.com",
  need: "AI chat assistant",
  timeline: "This month",
  source: "funnel-form",
});
assert.strictEqual(good.ok, true);
assert.strictEqual(good.lead.name, "Ana Cruz");
assert.strictEqual(good.lead.email, "ana@example.com");
assert.strictEqual(good.lead.status, "new");

const honeypot = normalizeLead({
  name: "Bot",
  email: "bot@example.com",
  website: "http://spam.example",
});
assert.strictEqual(honeypot.ok, false);
assert.strictEqual(honeypot.dropped, true);

const noName = normalizeLead({ email: "someone@example.com" });
assert.strictEqual(noName.ok, false);
assert.ok(!noName.dropped);

const badEmail = normalizeLead({ name: "Ana", email: "ana@localhost" });
assert.strictEqual(badEmail.ok, false);

const longMessage = normalizeLead({
  name: "Ana",
  email: "ana@example.com",
  message: "x".repeat(5000),
});
assert.strictEqual(longMessage.lead.message.length, 2000);

console.log("lead validation: all checks passed");
