import React, { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.button>, <motion.div>)
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { getChatSessionId, sendChatMessage } from '@/features/chat/chat';

const GREETING =
  "Hi! I'm the Leora Wellness assistant. Ask me about our products, ingredients, shipping, or returns.";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = getChatSessionId();
  }, []);

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
      )}

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
