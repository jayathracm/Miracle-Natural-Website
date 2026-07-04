import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Inbox, RefreshCw } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { fetchAllMessages, updateMessageStatus } from '../../lib/messages';

const STATUS_OPTIONS = ['new', 'read', 'replied'];

const STATUS_STYLES = {
  new: 'border-amber-300 bg-amber-50 text-amber-800',
  read: 'border-sky-300 bg-sky-50 text-sky-800',
  replied: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadMessages = () => {
    setIsLoading(true);
    setError(null);

    return fetchAllMessages()
      .then(setMessages)
      .catch((fetchError) => setError(fetchError.message || 'Could not load messages.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    if (statusFilter === 'all') return messages;
    return messages.filter((message) => message.status === statusFilter);
  }, [messages, statusFilter]);

  const statusCounts = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        acc[message.status] = (acc[message.status] || 0) + 1;
        return acc;
      },
      { new: 0, read: 0, replied: 0 }
    );
  }, [messages]);

  const applyStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await updateMessageStatus(id, nextStatus);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m)));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExpand = (message) => {
    const isExpanded = expandedId === message.id;
    setExpandedId(isExpanded ? null : message.id);

    // Reading a "new" message is effectively acknowledging it — mark it
    // read automatically rather than making the admin do a second click.
    if (!isExpanded && message.status === 'new') {
      applyStatusChange(message.id, 'read');
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Customer Messages
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadMessages} icon={RefreshCw}>
              Refresh
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              All ({messages.length})
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === status ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                {status} ({statusCounts[status] || 0})
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-[0.95rem] text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Inbox size={28} className="text-text-tertiary" />
            <Typography variant="small">No messages match this filter yet.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => {
              const isExpanded = expandedId === message.id;

              return (
                <div
                  key={message.id}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleExpand(message)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-[0.9rem] font-semibold text-foreground">{message.subject}</p>
                      <p className="text-[0.76rem] text-muted-foreground">
                        {message.customer_name} · {message.customer_email}
                      </p>
                      <p className="text-[0.72rem] text-text-tertiary mt-0.5">{formatDate(message.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[message.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                        {message.status}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                      <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Message</p>
                      <p className="text-[0.88rem] text-foreground leading-relaxed whitespace-pre-wrap mb-4">{message.message}</p>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.76rem] font-semibold text-text-secondary">Update status:</span>
                        <select
                          value={message.status}
                          disabled={updatingId === message.id}
                          onChange={(event) => applyStatusChange(message.id, event.target.value)}
                          className="rounded-lg border border-[var(--color-border-medium)] bg-white/90 px-3 py-1.5 text-[0.82rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
