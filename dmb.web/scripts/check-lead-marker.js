/**
 * Quick check for the chat lead-marker stream filter: the marker must never
 * leak to the client, even when split across chunk boundaries.
 * Run with: node scripts/check-lead-marker.js
 */
const assert = require("assert");
const { createLeadFilter } = require("../api/_leadMarker");

function run(chunks) {
  const filter = createLeadFilter();
  let visible = "";
  for (const chunk of chunks) {
    visible += filter.feed(chunk);
  }
  visible += filter.end();
  return { visible, lead: filter.lead() };
}

const whole = run([
  "Thanks Ana. ",
  "I will email you shortly.",
  '\n<<<LEAD {"name":"Ana","email":"ana@example.com","need":"chatbot","timeline":"asap","notes":""}>>>',
]);
assert.strictEqual(whole.visible.includes("LEAD"), false, "marker leaked");
assert.strictEqual(whole.lead.email, "ana@example.com");

const split = run(["Hi there. <<", "<LE", 'AD {"name":"Bo","email":"bo@example.com"}>>>']);
assert.strictEqual(split.visible, "Hi there. ");
assert.strictEqual(split.lead.name, "Bo");

const noMarker = run(["No marker here, just <<< angle brackets."]);
assert.strictEqual(noMarker.visible, "No marker here, just <<< angle brackets.");
assert.strictEqual(noMarker.lead, null);

const truncated = run(["Reply ended mid marker <<<LEA"]);
assert.strictEqual(truncated.visible, "Reply ended mid marker <<<LEA");
assert.strictEqual(truncated.lead, null);

const malformed = run(["Done. <<<LEAD not json at all>>>"]);
assert.strictEqual(malformed.visible, "Done. ");
assert.strictEqual(malformed.lead, null);

console.log("lead marker filter: all checks passed");
