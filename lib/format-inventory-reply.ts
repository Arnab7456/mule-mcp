/**
 * Turns Mule MCP `get_product_inventory` text (often pipe-separated) into a readable summary.
 */

type ParsedFields = {
  product?: string;
  code?: string;
  description?: string;
};

function parsePipeDelimited(text: string): ParsedFields | null {
  const parts = text.split(/\s*\|\s*/).map((p) => p.trim());
  const out: ParsedFields = {};
  for (const part of parts) {
    const m = part.match(/^Product:\s*(.+)$/i);
    if (m) out.product = m[1].trim();
    const c = part.match(/^Code:\s*(.+)$/i);
    if (c) out.code = c[1].trim();
    const d = part.match(/^Description:\s*(.+)$/i);
    if (d) out.description = d[1].trim();
  }
  return out.product || out.code || out.description ? out : null;
}

function parseJsonRecord(text: string): ParsedFields | null {
  try {
    const j = JSON.parse(text) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as Record<string, unknown>;
    const product =
      (typeof o.productName === "string" && o.productName) ||
      (typeof o.name === "string" && o.name) ||
      (typeof o.ProductName === "string" && o.ProductName) ||
      undefined;
    const code =
      (typeof o.productCode === "string" && o.productCode) ||
      (typeof o.code === "string" && o.code) ||
      (typeof o.ProductCode === "string" && o.ProductCode) ||
      undefined;
    const description =
      (typeof o.description === "string" && o.description) ||
      (typeof o.Description === "string" && o.Description) ||
      undefined;
    return product || code || description ? { product, code, description } : null;
  } catch {
    return null;
  }
}

function buildSummary(fields: ParsedFields, query: string): string {
  const displayName = fields.product ?? query;
  const lines: string[] = [
    `Here's what came back for ${query}:`,
    "",
    `Product Name: ${displayName}`,
  ];
  if (fields.code) lines.push(`Product Code: ${fields.code}`);
  if (fields.description) lines.push(`Description: ${fields.description}`);
  lines.push(
    "",
    "The record was found in Salesforce. Stock or quantity is not part of this MCP response—open Salesforce for detailed inventory, or look up another product here."
  );
  return lines.join("\n");
}

export function formatInventoryReply(raw: string, productQuery: string): string {
  const t = raw.trim();
  if (!t) return raw;

  const lower = t.toLowerCase();
  if (lower.includes("not found") || lower.includes("no product")) {
    return `${t}\n\nTry another product name or spelling.`;
  }

  const fromJson = parseJsonRecord(t);
  if (fromJson) return buildSummary(fromJson, productQuery);

  const fromPipe = parsePipeDelimited(t);
  if (fromPipe) return buildSummary(fromPipe, productQuery);

  return t;
}
