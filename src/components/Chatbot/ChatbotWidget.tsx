import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, ShoppingCart, Package, HelpCircle, Mic, MicOff, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  quickReplies?: string[];
  source?: string;
}

interface ChatbotWidgetProps {
  chatbotKey: string;
  businessName?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  isDark?: boolean;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  chatbotKey,
  businessName,
  position = 'bottom-right',
  primaryColor = '#6366f1',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1', sender: 'bot', timestamp: new Date(),
    text: `Hello! 👋 I'm ${businessName ? `${businessName}'s` : 'your'} assistant. Ask me anything!`,
    quickReplies: ['Products', 'Track Order', 'Help'],
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const msgEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen && !isMinimized) inputRef.current?.focus(); }, [isOpen, isMinimized]);

  const pc = primaryColor;
  const grad = `linear-gradient(135deg,${pc}f0,${pc}99)`;

  // Positioning — pure inline styles, no Tailwind conflicts
  const btnPos: React.CSSProperties = position === 'bottom-right'
    ? { position: 'fixed', bottom: 20, right: 20 }
    : { position: 'fixed', bottom: 20, left: 20 };
  const winPos: React.CSSProperties = position === 'bottom-right'
    ? { position: 'fixed', bottom: 20, right: 20 }
    : { position: 'fixed', bottom: 20, left: 20 };

  const title = businessName ? `${businessName}'s Assistant` : 'AI Assistant';

  /* ── Send ─────────────────────────────────────────────────────────── */
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
      const raw = await res.text();
      let data: any = {};
      try { data = JSON.parse(raw); } catch { console.error('[FAQ] parse error:', raw); }
      console.log('[FAQ]', { chatbotKey: chatbotKey.slice(0, 12) || 'EMPTY', status: res.status, raw, data });

      if (!res.ok) {
        setMessages(p => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', timestamp: new Date(), text: `Error: ${data?.error || raw || 'Server Error'}` }]);
        return;
      }

      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(), sender: 'bot', timestamp: new Date(),
        source: data?.source,
        text: data?.answer ?? "Sorry, I couldn't find an answer. Please try rephrasing.",
        quickReplies: data?.answer ? undefined : ['Help', 'Browse Products'],
      }]);
    } catch (e: any) {
      console.error("[FAQ] Network Error:", e);
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', timestamp: new Date(), text: `Network Error: ${e.message}` }]);
    } finally { setIsLoading(false); setIsTyping(false); }
  };

  /* ── Voice (Groq) ─────────────────────────────────────────────────── */
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsTyping(true);
        try {
          const form = new FormData();
          form.append('audio', blob, 'audio.webm');
          form.append('chatbot_key', chatbotKey);
          const tr = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
            method: 'POST',
            headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: form,
          });
          const td = await tr.json();
          if (td.transcript) await sendMessage(td.transcript);
        } finally { setIsTyping(false); }
      };
      mr.start();
      mediaRef.current = mr;
      setListening(true);
    } catch { alert('Microphone access denied.'); }
  };

  const stopRec = () => { mediaRef.current?.stop(); mediaRef.current = null; setListening(false); };

  const getQRIcon = (t: string) => {
    const l = t.toLowerCase();
    if (l.includes('order') || l.includes('track')) return <Package className="w-3 h-3" />;
    if (l.includes('help')) return <HelpCircle className="w-3 h-3" />;
    if (l.includes('product')) return <ShoppingCart className="w-3 h-3" />;
    return null;
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── LAUNCHER BUTTON ─── fully inline styles, zero Tailwind ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          style={{
            ...btnPos,
            zIndex: 9999,
            width: 64, height: 64,
            borderRadius: '50%',
            border: '3px solid white',
            background: grad,
            boxShadow: `0 8px 28px -4px ${pc}66, 0 2px 8px rgba(0,0,0,0.2)`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, outline: 'none',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.07)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.07)')}
        >
          {/* Bot icon — white, always visible against colored background */}
          <Bot style={{ width: 30, height: 30, color: 'white', flexShrink: 0 }} />
          {/* Online dot */}
          <span style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 13, height: 13, borderRadius: '50%',
            background: '#34d399', border: '2px solid white', display: 'block'
          }} />
        </button>
      )}

      {/* ── CHAT WINDOW ─── */}
      {isOpen && (
        <div style={{
          ...winPos,
          zIndex: 9999,
          width: 375,
          height: isMinimized ? 60 : 570,
          borderRadius: 18,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px -12px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.1)',
          background: '#ffffff',
          transition: 'height 0.3s ease',
        }}>

          {/* Header */}
          <div style={{ background: grad, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.35)', flexShrink: 0 }}>
                <Bot style={{ width: 20, height: 20, color: 'white' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, margin: 0 }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Online · Instant replies</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setIsMinimized(v => !v)} title={isMinimized ? 'Expand' : 'Minimize'}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '5px 7px', borderRadius: 7, opacity: 0.85 }}>
                {isMinimized ? <Maximize2 style={{ width: 16, height: 16 }} /> : <Minimize2 style={{ width: 16, height: 16 }} />}
              </button>
              <button onClick={() => setIsOpen(false)} title="Close"
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '5px 7px', borderRadius: 7, opacity: 0.85 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(180deg,#f5f7ff,#fff 60%)' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 7, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                    {msg.sender === 'bot' && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                        <Bot style={{ width: 14, height: 14, color: 'white' }} />
                      </div>
                    )}
                    <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{
                        padding: '9px 13px', borderRadius: 16, fontSize: 13.5, lineHeight: 1.5,
                        ...(msg.sender === 'user'
                          ? { background: grad, color: 'white', borderBottomRightRadius: 3 }
                          : { background: 'white', color: '#1e293b', border: '1px solid #e8ecf4', borderBottomLeftRadius: 3 }),
                      }}>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        {msg.source === 'scraped' && <span style={{ fontSize: 10, color: '#818cf8', display: 'block', marginTop: 3 }}>⚡ From website</span>}
                        <span style={{ fontSize: 10, opacity: 0.5, display: 'block', marginTop: 3 }}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.quickReplies && msg.sender === 'bot' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                          {msg.quickReplies.map((r, i) => (
                            <button key={i} onClick={() => sendMessage(r)}
                              style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {getQRIcon(r)}{r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing dots */}
                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                      <Bot style={{ width: 14, height: 14, color: 'white' }} />
                    </div>
                    <div style={{ padding: '10px 14px', background: 'white', border: '1px solid #e8ecf4', borderRadius: 16, borderBottomLeftRadius: 3, display: 'flex', gap: 4 }}>
                      {[0, 160, 320].map(d => (
                        <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: pc, animation: `hvbounce 1.2s ${d}ms infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={msgEnd} />
              </div>

              {/* Input bar */}
              <div style={{ borderTop: '1px solid #f0f2f8', background: 'white', padding: '9px 12px', flexShrink: 0 }}>
                {listening && (
                  <div style={{ marginBottom: 7, padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#ef444488,#dc262688)', color: 'white', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {[0, 100, 200].map(d => (
                        <div key={d} style={{ width: 3, borderRadius: 2, background: 'white', animation: `waveBar 0.8s ${d}ms ease-in-out infinite` }} />
                      ))}
                    </div>
                    Recording… tap mic to stop &amp; send
                  </div>
                )}
                <form onSubmit={e => { e.preventDefault(); sendMessage(inputValue); }} style={{ display: 'flex', gap: 7 }}>
                  <button type="button" onClick={listening ? stopRec : startRec}
                    aria-label={listening ? 'Stop' : 'Record'}
                    style={{
                      position: 'relative',
                      padding: '9px 11px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: listening ? '#ef4444' : '#f1f5f9',
                      color: listening ? 'white' : '#64748b',
                      flexShrink: 0, display: 'flex', alignItems: 'center',
                      boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none',
                      animation: listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                    }}>
                    {listening ? <MicOff style={{ width: 15, height: 15 }} /> : <Mic style={{ width: 15, height: 15 }} />}
                  </button>
                  <input ref={inputRef} type="text" value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={listening ? 'Listening…' : 'Ask me anything…'}
                    disabled={isLoading || listening}
                    style={{ flex: 1, padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13.5, outline: 'none', background: '#f8faff', color: '#1e293b' }}
                    onFocus={e => (e.target.style.borderColor = pc)}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  />
                  <button type="submit" disabled={isLoading || !inputValue.trim() || listening}
                    style={{ padding: '9px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: grad, boxShadow: `0 2px 8px ${pc}44`, flexShrink: 0, display: 'flex', alignItems: 'center', opacity: (isLoading || !inputValue.trim() || listening) ? 0.45 : 1 }}>
                    <Send style={{ width: 15, height: 15, color: 'white' }} />
                  </button>
                </form>
                <p style={{ textAlign: 'center', fontSize: 10, color: '#cbd5e1', marginTop: 5 }}>Powered by HAVY · Secure &amp; Private</p>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes hvbounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(68, 173, 221, 0.79)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes waveBar {
          0%,100% { height: 4px; }
          50%      { height: 14px; }
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;
