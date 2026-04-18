'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle as _MC, X, Send, Loader2, Navigation, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: { label: string; dest: string };
}

// ── Venue knowledge base for local AI responses ───────────────────────────────
const VENUE_CONTEXT = {
  zones: [
    { name: 'North Stand',    density: 78, wait: 0  },
    { name: 'East Stand (B)', density: 91, wait: 0  },
    { name: 'South Stand',    density: 42, wait: 0  },
    { name: 'West Stand (A)', density: 55, wait: 0  },
    { name: 'Club House',     density: 85, wait: 0  },
    { name: 'Corporate Box',  density: 30, wait: 0  },
  ],
  queues: [
    { name: 'Pavilion Food Court',   wait: 18, density: 85 },
    { name: 'KSCA Refreshment Zone', wait: 12, density: 72 },
    { name: 'North Block Restrooms', wait: 8,  density: 61 },
    { name: 'Gate 5 (MG Road)',      wait: 6,  density: 55 },
    { name: 'Corporate Lounge Bar',  wait: 2,  density: 30 },
    { name: 'South Block Restrooms', wait: 0,  density: 10 },
  ],
};

// ── Local AI engine — no API key needed ───────────────────────────────────────
function getAIResponse(query: string): Message['action'] & { text: string } {
  const q = query.toLowerCase();

  // Restroom queries
  if (q.includes('restroom') || q.includes('toilet') || q.includes('bathroom') || q.includes('loo')) {
    const best = VENUE_CONTEXT.queues
      .filter(x => x.name.toLowerCase().includes('restroom'))
      .sort((a, b) => a.wait - b.wait)[0];
    if (best) {
      const waitText = best.wait === 0 ? 'no wait' : `~${best.wait} min wait`;
      return {
        text: `🚻 **${best.name}** is your best bet right now — ${waitText} and only ${best.density}% full. It's the least crowded option at Chinnaswamy.`,
        label: `Go to ${best.name}`,
        dest: best.name,
      };
    }
  }

  // Food queries
  if (q.includes('food') || q.includes('eat') || q.includes('hungry') || q.includes('snack') || q.includes('drink')) {
    const best = VENUE_CONTEXT.queues
      .filter(x => x.name.toLowerCase().includes('food') || x.name.toLowerCase().includes('lounge') || x.name.toLowerCase().includes('bar'))
      .sort((a, b) => a.wait - b.wait)[0];
    if (best) {
      const waitText = best.wait === 0 ? 'no wait' : `~${best.wait} min`;
      return {
        text: `🍛 Head to **${best.name}** — shortest wait right now at ${waitText}. ${best.density < 40 ? "It's barely busy." : 'Move quickly before the innings break rush!'}`,
        label: `Navigate to ${best.name}`,
        dest: best.name,
      };
    }
  }

  // Exit queries
  if (q.includes('exit') || q.includes('leave') || q.includes('gate') || q.includes('out') || q.includes('mg road')) {
    return {
      text: `🚪 **Gate 5 (MG Road side)** is your fastest exit right now — ~6 min wait and avoids the Club House End congestion. Head there before the innings break for the smoothest exit.`,
      label: 'Navigate to Gate 5',
      dest: 'Gate 5 (MG Road)',
    };
  }

  // Crowd / busy queries
  if (q.includes('crowd') || q.includes('busy') || q.includes('full') || q.includes('avoid') || q.includes('congestion')) {
    const hotZones = VENUE_CONTEXT.zones.filter(z => z.density >= 80).map(z => z.name);
    const safeZones = VENUE_CONTEXT.zones.filter(z => z.density < 50).map(z => z.name);
    return {
      text: `📊 Currently **${hotZones.join(' and ')}** ${hotZones.length === 1 ? 'is' : 'are'} critically full (80%+). ${safeZones.length > 0 ? `**${safeZones.join(' and ')}** ${safeZones.length === 1 ? 'is' : 'are'} clear and easy to move through.` : ''} I'd recommend avoiding the East Stand area entirely right now.`,
      label: 'View live map',
      dest: '',
    };
  }

  // First aid
  if (q.includes('first aid') || q.includes('medical') || q.includes('help') || q.includes('emergency')) {
    return {
      text: `🏥 The **First Aid Bay** is located near the West Stand entrance. It's staffed throughout the match. I'll navigate you there now.`,
      label: 'Navigate to First Aid Bay',
      dest: 'First Aid Bay',
    };
  }

  // Seat / location queries
  if (q.includes('seat') || q.includes('block') || q.includes('row') || q.includes('where am i')) {
    return {
      text: `📍 I can navigate you from your current location to any destination in the stadium. Just tell me where you want to go — food, restrooms, exits, or a specific stand.`,
      label: '',
      dest: '',
    };
  }

  // Innings break / timing
  if (q.includes('innings') || q.includes('break') || q.includes('interval') || q.includes('when')) {
    return {
      text: `⏱️ Innings break is expected in **~10 minutes**. I'd recommend hitting the restrooms or food stalls **now** — queues will spike by 3–4x during the break. South Block Restrooms are clear right now.`,
      label: 'Go to South Block Restrooms',
      dest: 'South Block Restrooms',
    };
  }

  // Parking / transport
  if (q.includes('park') || q.includes('car') || q.includes('uber') || q.includes('cab') || q.includes('metro')) {
    return {
      text: `🚇 Nearest metro is **Cubbon Park station** (~8 min walk via MG Road Gate 5). For cabs, Gate 5 on MG Road has the best pickup zone. Avoid the main entrance — it's congested post-match.`,
      label: 'Navigate to Gate 5',
      dest: 'Gate 5 (MG Road)',
    };
  }

  // Score / match
  if (q.includes('score') || q.includes('wicket') || q.includes('run') || q.includes('csk') || q.includes('rcb') || q.includes('match')) {
    return {
      text: `🏏 I'm focused on helping you navigate the stadium safely! For live scores, check the IPL app or the big screens around the ground. Want me to help you find a good viewing spot with less crowd?`,
      label: '',
      dest: '',
    };
  }

  // Default
  return {
    text: `I can help you find the **nearest restroom**, **shortest food queue**, **best exit route**, or navigate anywhere in M. Chinnaswamy Stadium. What do you need?`,
    label: '',
    dest: '',
  };
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Nearest restroom under 5 min?',
  'Where to eat quickly?',
  'Best exit before innings break?',
  'Which zones are least crowded?',
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AIChatButton() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: `Hey! I'm your VenueFlow AI assistant 🏏\n\nI know everything happening at **M. Chinnaswamy Stadium** right now — crowd levels, queue times, best routes. What do you need?`,
    },
  ]);
  const router     = useRouter();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate thinking delay
    setTimeout(() => {
      const { text: responseText, label, dest } = getAIResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        ...(label && dest ? { action: { label, dest } } : {}),
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 700 + Math.random() * 400);
  }, []);

  const handleNavigate = (dest: string) => {
    if (!dest) return;
    setOpen(false);
    router.push(`/navigate?to=${encodeURIComponent(dest)}`);
  };

  // Render message text with basic **bold** support
  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: '#F1F5F9', fontWeight: 700 }}>{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl"
            style={{
              bottom: 'calc(76px + env(safe-area-inset-bottom))',
              right: '16px',
              background: 'linear-gradient(135deg, #FDB913, #C8102E)',
              boxShadow: '0 8px 32px rgba(200,16,46,0.4), 0 0 0 1px rgba(253,185,19,0.3)',
            }}
            aria-label="Open AI assistant"
          >
            <Bot size={18} color="#fff" />
            <span className="text-[13px] font-bold text-white">Ask AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed z-50 flex flex-col rounded-3xl overflow-hidden"
            style={{
              bottom: 'calc(76px + env(safe-area-inset-bottom))',
              left: '12px',
              right: '12px',
              height: '72vh',
              maxHeight: '560px',
              background: '#0F1629',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(253,185,19,0.15)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ background: 'linear-gradient(90deg, rgba(253,185,19,0.12), rgba(200,16,46,0.12))', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FDB913, #C8102E)' }}>
                  <Bot size={15} color="#fff" />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: '#F1F5F9' }}>VenueFlow AI</p>
                  <p className="text-[10px]" style={{ color: '#475569' }}>M. Chinnaswamy · IPL 2026</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}
                aria-label="Close chat">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #FDB913, #C8102E)' }}>
                          <Bot size={9} color="#fff" />
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: '#475569' }}>VenueFlow AI</span>
                      </div>
                    )}
                    <div className="rounded-2xl px-3.5 py-2.5"
                      style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #FDB913, #C8102E)'
                          : 'rgba(255,255,255,0.06)',
                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      }}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-line"
                        style={{ color: msg.role === 'user' ? '#fff' : '#94A3B8' }}>
                        {renderText(msg.text)}
                      </p>
                    </div>
                    {msg.action && (
                      <motion.button
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        onClick={() => handleNavigate(msg.action!.dest)}
                        className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold active:scale-95 transition-transform"
                        style={{ background: 'linear-gradient(135deg, #FDB913, #C8102E)', color: '#fff', boxShadow: '0 4px 12px rgba(200,16,46,0.3)' }}>
                        <Navigation size={12} /> {msg.action.label}
                      </motion.button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Loader2 size={13} className="animate-spin" style={{ color: '#FDB913' }} />
                    <span className="text-[12px]" style={{ color: '#475569' }}>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap"
                    style={{ background: 'rgba(253,185,19,0.1)', border: '1px solid rgba(253,185,19,0.25)', color: '#FDB913' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Ask anything about the stadium…"
                  className="flex-1 bg-transparent text-[13px] outline-none"
                  style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
                  disabled={loading}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #FDB913, #C8102E)' }}
                  aria-label="Send">
                  <Send size={13} color="#fff" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
