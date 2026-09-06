/**
 * The chat assistant appends a machine-readable block once it has qualified a
 * visitor. That block must never reach the browser, so replies are streamed
 * through this filter: it emits everything before the marker, swallows
 * everything after it, and holds back any tail that could be a partial marker
 * split across two chunks.
 */

const MARKER_START = "<<<LEAD";
const MARKER_END = ">>>";

/** Longest suffix of `text` that is also a prefix of `needle`. */
function partialSuffixLength(text, needle) {
  const max = Math.min(text.length, needle.length - 1);
  for (let size = max; size > 0; size -= 1) {
    if (text.endsWith(needle.slice(0, size))) {
      return size;
    }
  }
  return 0;
}

function parseCaptured(captured) {
  const endIndex = captured.indexOf(MARKER_END);
  const body = endIndex === -1 ? captured : captured.slice(0, endIndex);
  const open = body.indexOf("{");
  const close = body.lastIndexOf("}");
  if (open === -1 || close <= open) return null;

  try {
    const parsed = JSON.parse(body.slice(open, close + 1));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function createLeadFilter() {
  let holding = "";
  let captured = "";
  let inMarker = false;

  return {
    feed(chunk) {
      const text = String(chunk || "");
      if (!text) return "";

      if (inMarker) {
        captured += text;
        return "";
      }

      holding += text;

      const start = holding.indexOf(MARKER_START);
      if (start !== -1) {
        const safe = holding.slice(0, start);
        captured = holding.slice(start + MARKER_START.length);
        holding = "";
        inMarker = true;
        return safe;
      }

      const keep = partialSuffixLength(holding, MARKER_START);
      const safe = holding.slice(0, holding.length - keep);
      holding = keep ? holding.slice(holding.length - keep) : "";
      return safe;
    },

    end() {
      if (inMarker) return "";
      const safe = holding;
      holding = "";
      return safe;
    },

    lead() {
      return inMarker ? parseCaptured(captured) : null;
    },
  };
}

module.exports = { createLeadFilter, MARKER_START, MARKER_END };
