"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Minimize2, Send } from "lucide-react";
import { cn } from "../lib/utils";
import type { PageId } from "./Sidebar";

// Quick suggestions per page. Private context (property + documents) vs public (market) is
// applied when sending to AI: dashboard/portfolio use private; market-analysis/ai-analyst support both.
const QUICK_SUGGESTIONS: Record<PageId, [string, string, string]> = {
  dashboard: [
    "What is my portfolio value?",
    "Show monthly cashflow",
    "Any alerts?",
  ],
  portfolio: [
    "When does my tenancy end?",
    "Summarise my properties",
    "Average rent for Liverpool",
  ],
  "market-analysis": [
    "What is market trend?",
    "Compare areas",
    "Investment recommendations",
  ],
  "ai-analyst": [
    "Analyse my portfolio",
    "Identify document anomalies",
    "Market report",
  ],
};

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface FloatingAIAssistantProps {
  currentPage: PageId;
  /** Optional: pass property/document context for private answers */
  privateContextHint?: string;
}

export default function FloatingAIAssistant({
  currentPage,
  privateContextHint,
}: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = QUICK_SUGGESTIONS[currentPage];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: t },
    ]);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "This is a demo response. AI integration with private context (properties & documents) and public context (market) will be enabled later.",
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div
      className="fixed z-[60] flex flex-col items-start font-sans"
      style={{
        left: "max(1rem, env(safe-area-inset-left))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      dir="ltr"
      aria-label="Floating AI assistant"
    >
      {isOpen && (
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-white/20 shadow-xl overflow-hidden",
            "bg-slate-900/75 backdrop-blur-xl",
            "w-[min(100vw-2rem,360px)] sm:w-[360px]",
            "max-h-[min(70vh,480px)] sm:max-h-[420px]",
            "mb-3",
          )}
          role="dialog"
          aria-label="AI Chat window"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal-300" aria-hidden />
              </div>
              <span className="text-sm font-semibold text-slate-100">
                InvestIntel Assistant
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Minimise"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[120px] p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 mb-4">
                  Ask about your properties (e.g. tenancy end date) or market
                  data (e.g. average rent by area).
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Quick suggestions:
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="text-left text-sm px-3 py-2 rounded-xl bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {privateContextHint && (
                  <p className="text-xs text-slate-500 mt-3">
                    Answers based on your properties and documents.
                  </p>
                )}
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "text-sm max-w-[90%] rounded-xl px-3 py-2",
                  m.role === "user"
                    ? "ml-0 mr-auto bg-teal-500/30 text-slate-100"
                    : "mr-0 ml-auto bg-white/10 text-slate-200 border border-white/10",
                )}
              >
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-white/10 shrink-0"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 min-w-0 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                aria-label="Chat message"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white shrink-0 transition-colors"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all",
          "bg-slate-900/90 backdrop-blur-md border border-white/10",
          "hover:bg-slate-800/90 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-50",
        )}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-300" aria-hidden />
        ) : (
          <Bot className="w-6 h-6 text-teal-400" aria-hidden />
        )}
      </button>
    </div>
  );
}
