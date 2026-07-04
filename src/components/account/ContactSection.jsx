import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { fetchMyMessages, sendMessage } from '../../lib/messages';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || import.meta.env.VITE_ORDER_EMAIL || 'dinisha@lanmic.com';

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClasses = "mb-1.5 block text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary";

const STATUS_STYLES = {
  new: 'border-amber-300 bg-amber-50 text-amber-800',
  read: 'border-sky-300 bg-sky-50 text-sky-800',
  replied: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const ContactSection = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const loadMessages = () => {
    setIsLoadingMessages(true);
    return fetchMyMessages()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setIsLoadingMessages(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormStatus(null);

    if (!subject.trim() || !message.trim()) {
      setFormStatus({ type: 'error', text: 'Please fill in both the subject and your message.' });
      return;
    }

    setIsSending(true);

    // Save to the database first (source of truth, visible to admins) —
    // the notification email below is best-effort on top, same pattern as
    // checkout in Shop.jsx.
    try {
      await sendMessage({
        userId: user.id,
        customerName: user.user_metadata?.full_name || user.email,
        customerEmail: user.email,
        subject,
        message,
      });
    } catch {
      setFormStatus({ type: 'error', text: 'Could not send your message. Please try again.' });
      setIsSending(false);
      return;
    }

    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Website message: ${subject}`,
          _captcha: 'false',
          from_customer: user.email,
          subject,
          message,
        }),
      });
    } catch {
      // Non-fatal — the message is already saved and will show up for admins.
    }

    setFormStatus({ type: 'success', text: 'Your message has been sent. Our team will get back to you by email.' });
    setSubject('');
    setMessage('');
    setIsSending(false);
    loadMessages();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)]">
        <Typography variant="h4" className="text-foreground mb-1.5">Send a Message</Typography>
        <p className="text-[0.8rem] text-muted-foreground mb-4">
          Questions about an order, a product, or anything else — we'll reply to {user?.email}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className={labelClasses} htmlFor="contact-subject">Subject</label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className={`${inputClasses} resize-none`}
            />
          </div>
          {formStatus && (
            <p className={`text-[0.82rem] ${formStatus.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
              {formStatus.text}
            </p>
          )}
          <Button type="submit" className="px-5 py-2.5 text-[0.74rem]" icon={Send} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </div>

      {!isLoadingMessages && messages.length > 0 && (
        <div>
          <Typography variant="h4" className="text-foreground mb-3 text-[1rem]">Previous Messages</Typography>
          <div className="space-y-2.5">
            {messages.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4 shadow-[0_8px_20px_rgba(31,44,35,0.05)]"
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-[0.86rem] font-semibold text-foreground">{item.subject}</p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[item.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-[0.82rem] text-muted-foreground mb-1.5">{item.message}</p>
                <p className="text-[0.72rem] text-text-tertiary">{formatDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSection;
