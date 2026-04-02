'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWealthData } from '@/hooks/useWealthData';
import { WealthData } from '@/types/wealth';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Extends the base message with a `hidden` flag.
// Hidden messages are sent to the API (to keep conversation turn order valid)
// but are never rendered in the UI.
interface InternalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hidden?: boolean;
}

// The seed prompt that fires automatically when the sidebar first opens.
// Stored as a hidden user turn so the AI's response is the first visible
// message — a proactive portfolio brief before the user types anything.
const BRIEFING_PROMPT =
  'Review the complete wealth snapshot you have been provided and give me a ' +
  'concise portfolio health check with exactly 4 bullets:\n' +
  '1. **Retirement** — current balance vs. the 4% rule target, track status, and years-to-goal at 7% growth\n' +
  '2. **Liquidity** — emergency fund months covered vs. target, and HYSA dry-powder status\n' +
  '3. **Education** — 529 pace for each child with specific dollar gap and monthly contribution needed\n' +
  '4. **Top Priority** — your single most urgent proactive recommendation right now\n\n' +
  'Use the exact dollar figures from the snapshot. End with a one-sentence Bottom Line.';

export function ChatSidebar({ isOpen, onToggle }: ChatSidebarProps) {
  const { data } = useWealthData();

  // Always keep a ref to the latest data so async callbacks never close over
  // a stale null value — the primary reason the AI was receiving no context.
  const dataRef = useRef<WealthData | null>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prevents the auto-briefing from firing more than once per page session.
  const hasBriefedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Core streaming helper ─────────────────────────────────────────────────
  // Used by both the auto-briefing and every user-initiated message.
  const streamChat = async (
    apiMessages: { role: 'user' | 'assistant'; content: string }[],
    assistantId: string,
  ) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          // dataRef.current is always the latest loaded WealthData — never a
          // stale null captured in an old render closure.
          wealthContext: dataRef.current ?? undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (isFirstChunk) {
          isFirstChunk = false;
          setIsLoading(false);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content: chunk, timestamp: new Date() },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        }
      }
    } catch {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: 'Unable to complete the request. Please try again.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  // ── Auto-briefing: fires once when the sidebar opens with data ready ──────
  // The seed user message is marked hidden=true: included in the conversation
  // history sent to the API (required for valid turn order) but never rendered.
  // The user only sees the AI's streaming response.
  useEffect(() => {
    if (!isOpen || !data || hasBriefedRef.current) return;
    hasBriefedRef.current = true;

    const seedId = `seed-${Date.now()}`;
    const briefingId = `briefing-${Date.now() + 1}`;

    setMessages([
      {
        id: seedId,
        role: 'user',
        content: BRIEFING_PROMPT,
        timestamp: new Date(),
        hidden: true,
      },
    ]);
    setIsLoading(true);
    streamChat([{ role: 'user', content: BRIEFING_PROMPT }], briefingId);
  }, [isOpen, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── User-initiated message handler ───────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: InternalMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Include all messages in history (including the hidden seed turn) so the
    // API always receives a valid user→assistant→user→… turn sequence.
    const historyForApi = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await streamChat(historyForApi, (Date.now() + 1).toString());
  };

  // Only render messages that are not marked hidden.
  const visibleMessages = messages.filter((m) => !m.hidden);

  const suggestedQuestions = [
    'Am I on track to retire at 60?',
    'How can I optimize my tax efficiency?',
    'Should I pay off my mortgage early?',
    'How should I rebalance my portfolio?',
    'Is my 529 on pace for both kids?',
    'How much dry powder should I hold?',
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-forest-600 hover:bg-forest-700 text-white p-3 rounded-l-lg shadow-lg transition-colors z-50"
      >
        <ChevronLeft className="w-5 h-5" />
        <MessageSquare className="w-5 h-5 mt-1" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-navy-950 border-l border-slate-700 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-forest-600/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-forest-500" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Family Fiduciary AI</h2>
            <p className="text-xs text-slate-400">Full Portfolio Awareness</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 && !isLoading ? (
          // Shown before data loads or before the briefing fires
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm mb-4">
              {data ? 'Generating your portfolio briefing…' : 'Loading portfolio data…'}
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="block w-full text-left text-sm p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 inline mr-2 text-forest-500" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-forest-600' : 'bg-slate-700'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-forest-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-300" />
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your wealth strategy…"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">
          AI responses are for informational purposes only.
        </p>
      </div>
    </div>
  );
}
