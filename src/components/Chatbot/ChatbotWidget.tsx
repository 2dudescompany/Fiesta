import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, ShoppingCart, Package, HelpCircle, Search, Mic, MicOff, Bot } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  buttons?: Array<{ title: string; payload: string }>;
  image?: string;
  quickReplies?: string[];
  source?: 'faq' | 'scraped';
}

interface ChatbotWidgetProps {
  chatbotKey: string;
  businessName?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  isDark?: boolean;
}

/* ─── Static launcher icon (no external asset needed) ────────────────── */
const LauncherIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {/* Chat bubble body */}
    <rect x="6" y="8" width="44" height="30" rx="8" fill="white" fillOpacity="0.95" />
    {/* Bot eyes */}
    <circle cx="20" cy="23" r="4" fill={color} />
    <circle cx="36" cy="23" r="4" fill={color} />
    <circle cx="21" cy="22" r="1.5" fill="white" />
    <circle cx="37" cy="22" r="1.5" fill="white" />
    {/* Smile */}
    <path d="M20 29 Q28 34 36 29" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Tail */}
    <path d="M16 38 L10 48 L26 38Z" fill="white" fillOpacity="0.95" />
  </svg>
);

/* ─── Small bot avatar used in messages ─────────────────────────────── */
const MsgAvatar = ({ color }: { color: string }) => (
  <div
    className="flex items-center justify-center rounded-full shrink-0"
    style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${color}dd, ${color}99)`, border: '1px solid rgba(255,255,255,0.3)' }}
  >
    <Bot style={{ width: 15, height: 15, color: 'white' }} />
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────── */
const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  chatbotKey,
  businessName,
  position = 'bottom-right',
  primaryColor = '#6366f1',
  isDark = false,
}) => {
  const [isOpen, setIsOpen]         = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages]     = useState<Message[]>([{
    id: '1', sender: 'bot', timestamp: new Date(),
    text: `Hello! 👋 I'm ${businessName ? `${businessName}'s` : 'your'} assistant. Ask me anything about products, orders, or services.`,
    quickReplies: ['Products', 'Track Order', 'Help'],
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [isTyping, setIsTyping]     = useState(false);

  // Voice state
  const [listening, setListening]   = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  const positionClasses = { 'bottom-right': 'bottom-5 right-5', 'bottom-left': 'bottom-5 left-5' };
  const headerGrad = `linear-gradient(135deg, ${primaryColor}f2 0%, ${primaryColor}bb 100%)`;
  const assistantTitle = businessName ? `${businessName}'s Assistant` : 'AI Assistant';

  /* ── Send message ── */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { id: Date.now().toString(), text: text.trim(), sender: 'user', timestamp: new Date() }]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 380));
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/faq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ question: text.trim(), chatbot_key: chatbotKey }),
      });
      let data: any = {};
      try { data = JSON.parse(await res.text()); } catch { /**/ }
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(), sender: 'bot', timestamp: new Date(),
        source: data?.source,
        text: data?.answer ?? "I'm sorry, I couldn't find an answer for that. Please try rephrasing or contact support.",
        quickReplies: data?.answer ? undefined : ['Help', 'Browse Products'],
      }]);
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', timestamp: new Date(), text: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /* ── Groq voice recording ── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeWithGroq(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setListening(true);
    } catch {
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setListening(false);
  };

  const transcribeWithGroq = async (blob: Blob) => {
    setIsTyping(true);
    try {
      const form = new FormData();
      form.append('audio', blob, 'audio.webm');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
        method: 'POST',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: form,
      });
      const data = await res.json();
      if (data.transcript) {
        await sendMessage(data.transcript);
      }
    } catch {
      setMessages(p => [...p, { id: Date.now().toString(), sender: 'bot', timestamp: new Date(), text: 'Voice transcription failed. Please type instead.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMicClick = () => {
    if (listening) stopRecording();
    else startRecording();
  };

  const getIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('cart')) return <ShoppingCart className="w-3 h-3" />;
    if (t.includes('order') || t.includes('track')) return <Package className="w-3 h-3" />;
    if (t.includes('help')) return <HelpCircle className="w-3 h-3" />;
    if (t.includes('product') || t.includes('browse')) return <Search className="w-3 h-3" />;
    return null;
  };

  return (
    <>
      {/* ═══ LAUNCHER BUTTON — static SVG, only "jumps" on click via active: ═══ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} w-16 h-16 rounded-full z-50 focus:outline-none group transition-shadow duration-300`}
          style={{
            background: headerGrad,
            boxShadow: `0 8px 28px -4px ${primaryColor}70, 0 2px 8px rgba(0,0,0,0.15)`,
            padding: 10,
            // no animate-bounce; scale only on hover/active via CSS
          }}
          aria-label="Open chat"
        >
          <span className="block w-full h-full transition-transform duration-200 group-hover:scale-105 group-active:scale-90">
            <LauncherIcon color={primaryColor} />
          </span>
          {/* Online pulse dot */}
          <span className="absolute -bottom-0.5 -right-0.5 flex w-4 h-4">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="relative w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
          </span>
        </button>
      )}

      {/* ═══ CHAT WINDOW ═══ */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses[position]} w-[375px] rounded-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-[62px]' : 'h-[572px]'}`}
          style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.1)', background: '#fff' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: headerGrad }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', padding: 5, border: '2px solid rgba(255,255,255,0.3)' }}>
                <LauncherIcon color="white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{assistantTitle}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-75" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  </span>
                  <span className="text-white/75 text-[11px]">Online · Instant replies</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(v => !v)}
                className="p-2 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                aria-label={isMinimized ? 'Expand' : 'Minimise'}>
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                style={{ background: 'linear-gradient(180deg, #f6f8ff 0%, #ffffff 100%)' }}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-end gap-2 animate-fade-in ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.sender === 'bot' && <MsgAvatar color={primaryColor} />}
                    <div className="flex flex-col max-w-[78%]">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}
                        style={msg.sender === 'user' ? { background: headerGrad } : {}}
                      >
                        {msg.image && <img src={msg.image} alt="" className="rounded-lg mb-2 max-w-full" />}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.source === 'scraped' && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-indigo-400 font-medium">
                            <Bot className="w-2.5 h-2.5" /> From website
                          </span>
                        )}
                        <span className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.quickReplies && msg.sender === 'bot' && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.quickReplies.map((r, i) => (
                            <button key={i} onClick={() => sendMessage(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-white hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                              {getIcon(r)}{r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2 animate-fade-in">
                    <MsgAvatar color={primaryColor} />
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        {[0, 160, 320].map(d => (
                          <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: primaryColor, animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input bar ── */}
              <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
                {/* Listening banner */}
                {listening && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-xs font-medium text-white animate-pulse"
                    style={{ background: headerGrad }}>
                    <MicOff className="w-3.5 h-3.5" />
                    Listening… tap mic again to stop
                  </div>
                )}
                <form
                  onSubmit={e => { e.preventDefault(); sendMessage(inputValue); }}
                  className="flex gap-2"
                >
                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className="p-2.5 rounded-xl transition-all duration-200 shrink-0"
                    style={{
                      background: listening ? `${primaryColor}dd` : '#f1f5f9',
                      color: listening ? 'white' : '#64748b',
                      boxShadow: listening ? `0 2px 12px ${primaryColor}55` : 'none',
                    }}
                    aria-label={listening ? 'Stop recording' : 'Start recording'}
                    title="Voice input (Groq Whisper)"
                  >
                    {listening
                      ? <MicOff className="w-4 h-4" />
                      : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={listening ? 'Listening…' : 'Ask me anything…'}
                    disabled={isLoading || listening}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white transition-all"
                    onFocus={e => { e.target.style.borderColor = primaryColor; }}
                    onBlur={e => { e.target.style.borderColor = ''; }}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim() || listening}
                    className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
                    style={{ background: headerGrad, boxShadow: `0 4px 12px ${primaryColor}44` }}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-gray-300 text-center mt-2 tracking-wide">
                  Powered by HAVY · Secure &amp; Private
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.22s ease-out both; }
      `}</style>
    </>
  );
};

export default ChatbotWidget;
