"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import type { Lang } from "@/lib/i18n";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS: Record<Lang, string[]> = {
  es: [
    "¿Quién tuvo la mejor tasa de cierre esta semana?",
    "¿A qué campaña debería asignar más agentes?",
    "¿Quién está bajando y necesita coaching?",
    "¿En qué debería enfocarme hoy?",
  ],
  en: [
    "Who had the best close rate this week?",
    "Which campaign should I put more agents on?",
    "Who is trending down and needs coaching?",
    "What should I focus on today?",
  ],
};

const UI = {
  es: {
    title: "Chat IA",
    subtitle: "Pregunta lo que quieras sobre tus datos",
    placeholder: "Pregunta sobre agentes, campañas, leads...",
    clear: "Limpiar chat",
    thinking: "Analizando datos...",
    starterLabel: "Preguntas frecuentes",
    errorMsg: "Error al conectar. Intenta de nuevo.",
  },
  en: {
    title: "AI Chat",
    subtitle: "Ask anything about your data",
    placeholder: "Ask about agents, campaigns, leads...",
    clear: "Clear chat",
    thinking: "Analysing data...",
    starterLabel: "Suggested questions",
    errorMsg: "Connection error. Please try again.",
  },
};

export default function ChatTab({ lang }: { lang: Lang }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ui = UI[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          lang,
          history: next.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.answer ?? data.error ?? ui.errorMsg },
      ]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: ui.errorMsg }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[780px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{ui.title}</div>
            <div className="text-[11px] text-zinc-500">{ui.subtitle}</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            {ui.clear}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="pt-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center mb-5">{ui.starterLabel}</p>
            <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {STARTERS[lang].map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-zinc-900 dark:hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-sm shadow-emerald-500/20">
                <Sparkles className="h-3 w-3 text-white" strokeWidth={2.5} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-bl-sm border border-zinc-200 dark:border-zinc-700/60"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <Sparkles className="h-3 w-3 text-white" strokeWidth={2.5} />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin" strokeWidth={2} />
              <span className="text-sm text-zinc-500">{ui.thinking}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.placeholder}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm shadow-emerald-500/20"
          >
            {loading
              ? <Loader2 className="h-4 w-4 text-white animate-spin" strokeWidth={2} />
              : <Send className="h-4 w-4 text-white" strokeWidth={2} />
            }
          </button>
        </form>
      </div>
    </div>
  );
}
