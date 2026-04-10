"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/context/LocaleContext";
import { useShoppingList } from "@/context/ShoppingListContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are the best grocery deals this week?",
  "Compare milk prices across stores near me",
  "Where should I buy chicken breast for the best price?",
  "Help me plan a budget grocery trip under $50",
  "Which store has the cheapest eggs?",
  "Best deals on rice and pasta right now",
];

export default function AIDealsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locale = useLocale();
  const { items: shoppingListItems } = useShoppingList();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function sendMessage(prompt?: string) {
    const text = prompt || input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          ...(locale.city && { city: locale.city }),
          shoppingList: shoppingListItems.map((i) => i.productName),
          searchHistory: (() => {
            try {
              const raw = localStorage.getItem("price-compare-search-history");
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Sorry, something went wrong: ${err.error || "Unknown error"}`,
          };
          return updated;
        });
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + parsed.text,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      console.error("AI deals error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't connect to the AI service. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px-72px)] md:h-[calc(100dvh-64px)] max-w-3xl mx-auto">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              AI Deals Advisor
            </h1>
            <p className="text-gray-500 max-w-md mb-4">
              Powered by AI with real-time store prices
              {locale.label && (
                <span className="block mt-1 text-sm">
                  📍 Shopping in {locale.city ? `${locale.city}, ${locale.label}` : locale.label}
                </span>
              )}
            </p>

            {/* Value prop */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 max-w-md mb-8 text-left text-sm text-gray-600">
              <p className="font-semibold text-blue-700 mb-1">Unlike a regular chatbot:</p>
              <ul className="space-y-0.5">
                <li>📊 Fetches <strong>live prices</strong> from stores near you</li>
                <li>📍 Knows your <strong>local stores</strong> — not just generic advice</li>
                <li>💰 Cites <strong>real prices</strong>, not guesses</li>
              </ul>
            </div>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <span className="text-blue-500 mr-2">✨</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none">
                    <MarkdownContent content={msg.content} />
                    {loading && i === messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about grocery deals, prices, or shopping tips..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-2">
          AI analyzes real store prices in your area. Results may vary.
        </p>
      </div>
    </div>
  );
}

/** Simple markdown renderer for AI responses */
function MarkdownContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-bold text-base mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-bold text-lg mt-3 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-bold text-xl mt-3 mb-1">
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // Bullet points
    else if (line.match(/^[-*•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 my-0.5">
          <span className="text-blue-500 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="text-blue-600 font-semibold shrink-0">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    }
    // Horizontal rule
    else if (line.match(/^[-—]{3,}$/)) {
      elements.push(<hr key={i} className="my-3 border-gray-200" />);
    }
    // Empty line
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} className="my-0.5">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

/** Render inline markdown (bold, italic, code, links) */
function renderInline(text: string): React.ReactNode {
  // Split on [text](url) (handling nested parens in URLs), **bold**, *italic*, and `code`
  const parts = text.split(/(\[[^\]]+\]\([^)]*(?:\([^)]*\))*[^)]*\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    // Markdown link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\((.+)\)$/);
    if (linkMatch && linkMatch[2].startsWith("http")) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {linkMatch[1]}
        </a>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
