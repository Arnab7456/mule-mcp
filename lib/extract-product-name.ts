/**
 * Guess product name from a casual sentence without an LLM.
 * e.g. "check inventory for Smart Sensor" → "Smart Sensor"
 */
export function extractProductName(message: string): string {
  const m = message.trim();
  if (!m) return m;

  const quoted = m.match(/["']([^"']+)["']/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const patterns = [
    /\b(?:for|about)\s+(?:the\s+)?["']?([^"'\n?.!]+?)(?:\s*[.?!]|$)/i,
    /\b(?:lookup|look\s+up|find|check)\s+(?:inventory|stock|product)?\s*(?:for|on)?\s*["']?([^"'\n?.!]+?)(?:\s*[.?!]|$)/i,
    /\b(?:inventory|stock)\s+(?:for|of|on)\s+["']?([^"'\n?.!]+?)(?:\s*[.?!]|$)/i,
  ];

  for (const re of patterns) {
    const hit = m.match(re);
    if (hit?.[1]) {
      const name = hit[1].replace(/\s+/g, " ").trim();
      if (name.length >= 2) return name;
    }
  }

  return m;
}
