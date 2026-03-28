const PROTOCOL_VERSION = "2024-11-05";

type McpJsonRpc = {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function jsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
}

export async function mcpCallTool(
  mcpUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ text: string; isError: boolean }> {
  const initRes = await fetch(mcpUrl, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "dev-mcp-arnab", version: "0.1.0" },
      },
    } satisfies McpJsonRpc),
  });

  const sessionId = initRes.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error("MCP server did not return mcp-session-id");
  }

  await initRes.text();

  const sessionHeaders: HeadersInit = {
    ...jsonHeaders(),
    "mcp-session-id": sessionId,
  };

  await fetch(mcpUrl, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    } satisfies McpJsonRpc),
  });

  const callRes = await fetch(mcpUrl, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    } satisfies McpJsonRpc),
  });

  const payload = (await callRes.json()) as McpJsonRpc & {
    result?: {
      content?: Array<{ type: string; text?: string }>;
      isError?: boolean;
    };
  };

  if (payload.error) {
    return { text: payload.error.message, isError: true };
  }

  const result = payload.result;
  if (!result?.content?.length) {
    return { text: "No content returned from MCP tool.", isError: true };
  }

  const text = result.content
    .filter((c) => c.type === "text" && c.text != null)
    .map((c) => c.text as string)
    .join("\n");

  return {
    text: text || "(empty response)",
    isError: Boolean(result.isError),
  };
}
