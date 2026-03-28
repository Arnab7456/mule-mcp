"use client";

import { useCallback, useRef, useState } from "react";

type Role = "user" | "assistant";

type Msg = { id: string; role: Role; text: string; isError?: boolean; note?: string };

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function McpChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask in your own words — e.g.just type a product name.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || pending) return;

    setInput("");
    setPending(true);
    setMessages((m) => [...m, { id: id(), role: "user", text }]);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as {
        reply?: string;
        isError?: boolean;
        error?: string;
        lookedUpAs?: string;
      };

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: id(),
            role: "assistant",
            text: data.error ?? `Request failed (${res.status})`,
            isError: true,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: id(),
            role: "assistant",
            text: data.reply ?? "",
            isError: data.isError,
            note: data.lookedUpAs
              ? `Used product name for MCP: “${data.lookedUpAs}”`
              : undefined,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: id(),
          role: "assistant",
          text: "Network error — try again.",
          isError: true,
        },
      ]);
    } finally {
      setPending(false);
      scrollToBottom();
    }
  }, [input, pending, scrollToBottom]);

  return (
    <div className="mx-auto flex h-[min(100dvh,720px)] w-full max-w-2xl flex-col rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <header className="shrink-0 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Mule MCP assistant
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          MuleSoft MCP · Salesforce · <code className="font-mono text-[11px]">get_product_inventory</code>
        </p>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-900"
                  : m.isError
                    ? "border border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                    : "border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
              } ${m.role !== "user" ? "whitespace-pre-line" : ""}`}
            >
              {m.note && (
                <p className="mb-2 border-b border-neutral-200 pb-2 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  {m.note}
                </p>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
              Calling Mule MCP…
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Product or question…"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-neutral-400/30 placeholder:text-neutral-400 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
            disabled={pending}
            aria-label="Message"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={pending || !input.trim()}
            className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-200 dark:text-neutral-900"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
