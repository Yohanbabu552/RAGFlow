/**
 * AI Chat — Unified chat interface matching EMAMI reference design.
 *
 * Features:
 * - Session list on the left panel
 * - Chat messages in the center
 * - Message input with send button
 * - Welcome state with suggested prompts
 *
 * Connects to:
 * - /v1/dialog/list (fetch dialogs/chat sessions)
 * - /v1/conversation/list (fetch conversations)
 * - Navigates to /chat/:id for full chat experience
 */

import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import {
  Bot,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

// ── Types ──────────────────────────────────────────────────
interface ChatSession {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  citations?: { title: string; page: string }[];
}

// ── Suggested prompts ──────────────────────────────────────
const SUGGESTED_PROMPTS = [
  {
    icon: FileText,
    title: 'Product Specifications',
    prompt: 'What are the key ingredients in Navratna Oil?',
    color: 'text-[#0078D4]',
    bg: 'bg-[#0078D4]/10',
  },
  {
    icon: Search,
    title: 'Document Search',
    prompt: 'Find all documents related to rice product certifications',
    color: 'text-[#28A745]',
    bg: 'bg-[#28A745]/10',
  },
  {
    icon: MessageSquare,
    title: 'Policy Query',
    prompt: 'Summarize the leave policy for permanent employees',
    color: 'text-[#6F42C1]',
    bg: 'bg-[#6F42C1]/10',
  },
  {
    icon: Sparkles,
    title: 'Data Analysis',
    prompt: 'Compare Q3 and Q4 product sales from the master data',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
  },
];

// ── Mock sessions (fetched from API in production) ─────────
const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    name: 'Product Catalog Queries',
    lastMessage: 'What certifications does Sona Masoori have?',
    time: '10 min ago',
    unread: true,
  },
  {
    id: 'session-2',
    name: 'HR Policy Assistant',
    lastMessage: 'Summarize maternity leave policy',
    time: '2 hours ago',
    unread: false,
  },
  {
    id: 'session-3',
    name: 'R&D Research Analysis',
    lastMessage: 'Compare emulsion stability results',
    time: 'yesterday',
    unread: false,
  },
];

const MOCK_CONVERSATION: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What certifications does Sona Masoori rice have?',
    time: '10:30 AM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      'Based on the uploaded product documents, Sona Masoori rice from Emami has the following certifications:\n\n1. **FSSAI Certification** - Food Safety and Standards Authority of India license number 10015021000789\n2. **ISO 22000:2018** - Food Safety Management System certification\n3. **Organic India Certification** - For the organic variant line\n4. **AGMARK Grade** - Grade A classification for quality standards\n\nThese certifications are documented in the product specification sheets uploaded to the Rice Products knowledge base.',
    time: '10:30 AM',
    citations: [
      { title: 'Sona_Masoori_Rice_Brochure_2026.pdf', page: 'Page 3' },
      { title: 'FSSAI_Certification_Doc.pdf', page: 'Page 1' },
    ],
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'What is the shelf life mentioned in the documents?',
    time: '10:32 AM',
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content:
      'According to the product specification document, the shelf life details for Sona Masoori rice are:\n\n- **Standard packaging**: 12 months from date of manufacturing\n- **Vacuum-sealed packaging**: 18 months from date of manufacturing\n- **Storage conditions**: Cool, dry place below 25\u00B0C with humidity under 65%\n\nThe document also notes that the best-before date should be clearly printed on all retail packaging.',
    time: '10:32 AM',
    citations: [
      { title: 'Sona_Masoori_Rice_Brochure_2026.pdf', page: 'Page 7' },
    ],
  },
];

export default function AIChatPage() {
  const { data: userInfo } = useFetchUserInfo();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const nickname = userInfo?.nickname || 'User';

  // Load conversation when session is selected
  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSession(sessionId);
    // In production, fetch from /v1/conversation/list?dialog_id=...
    if (sessionId === 'session-1') {
      setMessages(MOCK_CONVERSATION);
    } else {
      setMessages([]);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // If no active session, create one
    if (!activeSession) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        name: inputValue.trim().slice(0, 40),
        lastMessage: inputValue.trim(),
        time: 'just now',
        unread: false,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession.id);
    }

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content:
          'I\'m processing your query against the uploaded knowledge base documents. In the production environment, this connects to the RAGFlow AI engine for intelligent document retrieval and response generation.\n\nTo use the full chat experience with document retrieval, please navigate to the **Chats** section and create a new dialog with an associated knowledge base.',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  }, [inputValue, activeSession]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Show welcome state or conversation
  const showWelcome = !activeSession && messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* ── Left Panel: Session List ─────────────────── */}
      <div className="w-[280px] shrink-0 border-r border-[#E2E8F0] flex flex-col bg-[#FAFBFC]">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1A202C]">
              Chat Sessions
            </h3>
            <button
              onClick={() => {
                setActiveSession(null);
                setMessages([]);
              }}
              className="p-1.5 rounded-lg bg-[#0078D4] text-white hover:bg-[#0078D4]/90 transition-colors"
              title="New Chat"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 rounded-lg border border-[#E2E8F0] bg-white pl-8 pr-3 text-xs text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20"
            />
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-white transition-colors ${
                activeSession === session.id
                  ? 'bg-white border-l-2 border-l-[#0078D4]'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[13px] font-semibold truncate ${
                    activeSession === session.id
                      ? 'text-[#0078D4]'
                      : 'text-[#1A202C]'
                  }`}
                >
                  {session.name}
                </span>
                {session.unread && (
                  <span className="w-2 h-2 rounded-full bg-[#0078D4] shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-[#94A3B8] truncate">
                {session.lastMessage}
              </p>
              <p className="text-[10px] text-[#CBD5E1] mt-1">{session.time}</p>
            </button>
          ))}
          {filteredSessions.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-[#94A3B8]">
              No chat sessions found.
            </div>
          )}
        </div>
      </div>

      {/* ── Center Panel: Chat Area ──────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {showWelcome ? (
          /* ── Welcome State ─────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1F3864] to-[#0078D4] flex items-center justify-center mb-6">
              <Bot className="size-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#1A202C] mb-2">
              Welcome to AI Chat, {nickname}
            </h2>
            <p className="text-sm text-[#64748B] mb-8 text-center max-w-md">
              Ask questions about your uploaded documents. Our AI will search
              through your knowledge bases and provide accurate answers with
              citations.
            </p>

            {/* Suggested prompts grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mb-8">
              {SUGGESTED_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    setInputValue(item.prompt);
                    inputRef.current?.focus();
                  }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0078D4]/30 hover:shadow-sm transition-all text-left"
                >
                  <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>
                    <item.icon className={`size-4 ${item.color}`} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#1A202C]">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2">
                      {item.prompt}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Input area (welcome state) */}
            <div className="w-full max-w-xl">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your documents..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4] resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#0078D4] text-white hover:bg-[#0078D4]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Conversation View ─────────────── */
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-[#0078D4]/10">
                <MessageSquare className="size-4 text-[#0078D4]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A202C]">
                  {sessions.find((s) => s.id === activeSession)?.name ||
                    'New Chat'}
                </h3>
                <p className="text-[11px] text-[#94A3B8]">
                  AI-powered document Q&A
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] ${
                      msg.role === 'user'
                        ? 'bg-[#0078D4] text-white rounded-2xl rounded-tr-md px-4 py-3'
                        : 'bg-[#F4F6F9] text-[#1A202C] rounded-2xl rounded-tl-md px-4 py-3'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-black/10 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                          Sources
                        </p>
                        {msg.citations.map((cite, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-[11px] opacity-80"
                          >
                            <FileText className="size-3 shrink-0" />
                            <span className="truncate">{cite.title}</span>
                            <span className="shrink-0 opacity-60">
                              {cite.page}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className={`text-[10px] mt-1.5 ${
                        msg.role === 'user' ? 'text-white/60' : 'text-[#94A3B8]'
                      }`}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#F4F6F9] rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <Loader2 className="size-4 animate-spin" />
                      AI is thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-5 py-3 border-t border-[#E2E8F0]">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:border-[#0078D4] resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#0078D4] text-white hover:bg-[#0078D4]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="size-4" />
                </button>
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1.5 text-center">
                AI responses are generated from your uploaded knowledge base
                documents
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
