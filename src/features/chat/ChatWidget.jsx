import React, { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.button>, <motion.div>)
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router';
import { AlertCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { getChatSessionId, hasSeenChatNudge, markChatNudgeSeen, sendChatMessage } from '@/features/chat/chat';

const GREETING =
  "Hi! I'm the Leora Wellness assistant. Ask me about our products, ingredients, shipping, or returns.";

// Matches shop routes, where ShopCart's cart FAB also sits at bottom-24.
const SHOP_ROUTE_PATTERN = /^\/[^/]+\/shop(\/|$)/;

// Wait a beat before showing the nudge, then auto-dismiss if ignored.
const NUDGE_SHOW_DELAY_MS = 1800;
const NUDGE_AUTO_HIDE_MS = 9000;

const ChatWidget = () => {
  const location = useLocation();
  const isShopRoute = SHOP_ROUTE_PATTERN.test(location.pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const sessionIdRef = useRef(null);
  const nudgeShowTimeoutRef = useRef(null);
  const nudgeHideTimeoutRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = getChatSessionId();
  }, []);

  // Shown once per browser — see chat.js.
  useEffect(() => {
    if (hasSeenChatNudge()) return undefined;

    nudgeShowTimeoutRef.current = setTimeout(() => {
      setShowNudge(true);
      markChatNudgeSeen();
      nudgeHideTimeoutRef.current = setTimeout(() => setShowNudge(false), NUDGE_AUTO_HIDE_MS);
    }, NUDGE_SHOW_DELAY_MS);

    return () => {
      clearTimeout(nudgeShowTimeoutRef.current);
      clearTimeout(nudgeHideTimeoutRef.current);
    };
  }, []);

  // Opening the chat always retires the nudge.
  useEffect(() => {
    if (isOpen) {
      setShowNudge(false);
      clearTimeout(nudgeShowTimeoutRef.current);
      clearTimeout(nudgeHideTimeoutRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending, isOpen]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const reply = await sendChatMessage(sessionIdRef.current, trimmed);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err?.message || 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <>
          {showNudge && (
            <span
              aria-hidden="true"
              className="fixed z-30 bottom-24 right-4 lg:bottom-6 lg:right-6 h-14 w-14 rounded-full bg-primary opacity-60 animate-ping pointer-events-none"
            />
          )}

          <motion.button
            type="button"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setIsOpen(true)}
            aria-label="Open chat"
            className="fixed z-40 bottom-24 right-4 lg:bottom-6 lg:right-6 h-14 w-14 rounded-full bg-primary text-white inline-flex items-center justify-center shadow-[0_14px_32px_rgba(31,44,35,0.32)] hover:bg-forest-800 transition-colors"
          >
            <MessageCircle size={22} />
          </motion.button>
        </>
      )}

      <AnimatePresence>
        {showNudge && !isOpen && (
          <motion.div
            key="chat-nudge"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed z-40 bottom-44 right-4 ${isShopRoute ? 'lg:bottom-44' : 'lg:bottom-24'} lg:right-6 w-[min(80vw,17.5rem)]`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative w-full text-left rounded-2xl bg-white border border-[var(--color-border-light)] shadow-[0_18px_40px_rgba(8,14,10,0.22)] pl-4 pr-8 py-3.5 hover:shadow-[0_20px_46px_rgba(8,14,10,0.28)] transition-shadow"
              >
                <span className="flex items-start gap-2.5">
                  <span className="h-8 w-8 rounded-full bg-primary/12 border border-primary/25 inline-flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-primary" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[0.82rem] font-semibold text-foreground leading-snug">
                      Have a question?
                    </span>
                    <span className="block mt-0.5 text-[0.76rem] text-muted-foreground leading-snug">
                      Ask our assistant about products, shipping, or returns — instant answers.
                    </span>
                  </span>
                </span>
                {/* Pointer toward the chat bubble; shifts up on Shop routes to clear the cart FAB. */}
                <span className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 bg-white border-b border-r border-[var(--color-border-light)]" />
              </button>

              <button
                type="button"
                onClick={() => setShowNudge(false)}
                aria-label="Dismiss"
                className="absolute top-2 right-2 h-5 w-5 rounded-full inline-flex items-center justify-center text-text-tertiary hover:bg-[var(--color-hover-overlay)] hover:text-foreground transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Chat with Leora Wellness"
            className="fixed z-[95] bottom-24 left-4 right-4 lg:left-auto lg:right-6 lg:bottom-6 lg:w-[380px] h-[65vh] max-h-[520px] lg:h-[560px] lg:max-h-[75vh] rounded-2xl bg-white shadow-[0_24px_60px_rgba(8,14,10,0.28)] border border-[var(--color-border-light)] flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b border-[var(--color-border-light)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))]">
              <span className="h-8 w-8 rounded-full bg-primary/12 border border-primary/25 inline-flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-primary" />
              </span>
              <div className="flex-1 min-w-0">
                <Typography variant="h4" className="text-foreground text-[0.92rem] leading-tight">
                  Leora Wellness Assistant
                </Typography>
                <p className="text-[0.7rem] text-muted-foreground">Products · Shipping · Returns</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="h-7 w-7 rounded-full inline-flex items-center justify-center hover:bg-[var(--color-hover-overlay)] transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.86rem] leading-relaxed whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-[rgba(247,241,227,0.6)] border border-[var(--color-border-light)] text-foreground rounded-bl-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-[var(--color-border-light)] bg-[rgba(247,241,227,0.6)] px-3.5 py-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.8rem] text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-[var(--color-border-light)]">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question..."
                maxLength={1000}
                disabled={isSending}
                className="flex-1 rounded-full border border-[var(--color-border-medium)] bg-white px-4 py-2.5 text-[0.86rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label="Send message"
                className="h-9 w-9 shrink-0 rounded-full bg-primary text-white inline-flex items-center justify-center disabled:opacity-40 hover:bg-forest-800 transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
