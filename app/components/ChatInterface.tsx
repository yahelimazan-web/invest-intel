"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// Chat Interface Component
// =============================================================================

export default function ChatInterface({
  isOpen,
  onClose,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send message to chat API
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user?.id) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history (last 10 messages for context)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call our API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.id,
          history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `שגיאת שרת: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.response || "לא התקבלה תשובה מה-AI",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat Error:", err);
      setError(err instanceof Error ? err.message : "שגיאה בתקשורת עם ה-AI");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Suggested questions
  const suggestedQuestions = [
    "כמה שכירות חודשית אני אוסף?",
    "מה סה״כ ההון שלי מושקע?",
    "איזה נכסים יש לי בקפריסין?",
    "מה התשואה הממוצעת שלי?",
  ];

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300",
      isExpanded
        ? "inset-4"
        : "bottom-4 left-4 w-96 h-[500px]"
    )} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">עוזר השקעות AI</h3>
            <p className="text-xs text-slate-500">
              שאל אותי על תיק ההשקעות שלך
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            style={{ pointerEvents: 'auto' }}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={clearChat}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="נקה שיחה"
            style={{ pointerEvents: 'auto' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">שאל אותי כל שאלה על תיק ההשקעות שלך</p>
            
            {/* Suggested Questions */}
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputValue(q);
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-right text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                  style={{ pointerEvents: 'auto' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === "user" ? "bg-emerald-500/20" : "bg-purple-500/20"
            )}>
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-emerald-400" />
              ) : (
                <Bot className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <div className={cn(
              "flex-1 max-w-[80%] rounded-2xl px-4 py-2",
              msg.role === "user"
                ? "bg-emerald-500/20 text-white"
                : "bg-slate-800 text-slate-200"
            )}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-slate-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-slate-400">מנתח...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="שאל על תיק ההשקעות שלך..."
            disabled={isLoading || !user?.id}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
            style={{ color: 'white' }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim() || !user?.id}
            className={cn(
              "p-3 rounded-xl transition-all",
              isLoading || !inputValue.trim() || !user?.id
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20"
            )}
            style={{ pointerEvents: isLoading || !inputValue.trim() || !user?.id ? 'none' : 'auto' }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {!user?.id && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            התחבר כדי להשתמש בצ'אט
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Chat Toggle Button
// =============================================================================

interface ChatToggleButtonProps {
  onClick: () => void;
  hasNewMessage?: boolean;
}

export function ChatToggleButton({ onClick, hasNewMessage }: ChatToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 left-4 z-40 p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
      style={{ pointerEvents: 'auto' }}
      title="פתח צ'אט AI"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      {hasNewMessage && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
