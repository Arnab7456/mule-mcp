import { NextResponse } from "next/server";
import { extractProductName } from "@/lib/extract-product-name";
import { formatInventoryReply } from "@/lib/format-inventory-reply";
import { mcpCallTool } from "@/lib/mcp-session";

function getMcpUrl(): string | undefined {
  return (
    process.env.mule_mcp?.trim() ||
    process.env.MULE_MCP?.trim() ||
    process.env.MULE_MCP_URL?.trim()
  );
}

export async function POST(req: Request) {
  const mcpUrl = getMcpUrl();
  if (!mcpUrl) {
    return NextResponse.json(
      {
        error:
          "Missing env: set mule_mcp (or MULE_MCP / MULE_MCP_URL) to your MCP endpoint URL.",
      },
      { status: 500 }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawMessage = typeof body.message === "string" ? body.message.trim() : "";
  if (!rawMessage) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const productName = extractProductName(rawMessage);

  try {
    const { text, isError } = await mcpCallTool(mcpUrl, "get_product_inventory", {
      productName,
    });
    const reply = isError ? text : formatInventoryReply(text, productName);
    return NextResponse.json({
      reply,
      isError,
      lookedUpAs: productName !== rawMessage ? productName : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "MCP request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
