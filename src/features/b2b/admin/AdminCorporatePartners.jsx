import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Check, ChevronDown, ChevronUp, MessageSquare, RefreshCw, RotateCcw, X } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { RowSkeletonList } from '@/shared/ui/Skeleton';
import { fetchAllApplications, reviewApplication } from '@/features/b2b/corporatePartnerApplications';
import { fetchAllGuestQuoteRequests, updateGuestQuoteRequestStatus } from '@/features/b2b/guestQuoteRequests';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];
const GUEST_STATUS_OPTIONS = ['new', 'contacted', 'closed'];

const STATUS_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-700',
  new: 'border-amber-300 bg-amber-50 text-amber-800',
  contacted: 'border-sky-300 bg-sky-50 text-sky-800',
  closed: 'border-gray-300 bg-gray-50 text-gray-700',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const AdminCorporatePartners = () => {
  const [activeTab, setActiveTab] = useState('applications');

  // Account applications (corporate_partner_applications) — approve/reject flips the role.
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [decidingId, setDecidingId] = useState(null);
  const [decisionError, setDecisionError] = useState(null);

  // Guest quote requests (guest_quote_requests) — no account, no role to grant.
  const [guestRequests, setGuestRequests] = useState([]);
  const [isLoadingGuest, setIsLoadingGuest] = useState(true);
  const [guestError, setGuestError] = useState(null);
  const [guestStatusFilter, setGuestStatusFilter] = useState('new');
  const [expandedGuestId, setExpandedGuestId] = useState(null);
  const [guestNoteDraft, setGuestNoteDraft] = useState('');
  const [updatingGuestId, setUpdatingGuestId] = useState(null);
  const [guestUpdateError, setGuestUpdateError] = useState(null);

  const loadApplications = () => {
    setIsLoading(true);
    setError(null);

    return fetchAllApplications()
      .then(setApplications)
      .catch((fetchError) => setError(fetchError.message || 'Could not load applications.'))
      .finally(() => setIsLoading(false));
  };

  const loadGuestRequests = () => {
    setIsLoadingGuest(true);
    setGuestError(null);

    return fetchAllGuestQuoteRequests()
      .then(setGuestRequests)
      .catch((fetchError) => setGuestError(fetchError.message || 'Could not load quote requests.'))
      .finally(() => setIsLoadingGuest(false));
  };

  useEffect(() => {
    loadApplications();
    loadGuestRequests();
  }, []);

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter((application) => application.status === statusFilter);
  }, [applications, statusFilter]);

  const statusCounts = useMemo(() => {
    return applications.reduce(
      (acc, application) => {
        acc[application.status] = (acc[application.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [applications]);

  const filteredGuestRequests = useMemo(() => {
    if (guestStatusFilter === 'all') return guestRequests;
    return guestRequests.filter((request) => request.status === guestStatusFilter);
  }, [guestRequests, guestStatusFilter]);

  const guestStatusCounts = useMemo(() => {
    return guestRequests.reduce(
      (acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      },
      { new: 0, contacted: 0, closed: 0 }
    );
  }, [guestRequests]);

  const handleExpand = (application) => {
    const isExpanded = expandedId === application.id;
    setExpandedId(isExpanded ? null : application.id);
    setNoteDraft(isExpanded ? '' : application.admin_notes || '');
    setDecisionError(null);
  };

  const handleDecision = async (application, decision) => {
    setDecidingId(application.id);
    setDecisionError(null);
    try {
      const updated = await reviewApplication(application.id, decision, noteDraft.trim() || null);
      setApplications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setExpandedId(null);
      setNoteDraft('');
    } catch (decisionErrorCaught) {
      setDecisionError(decisionErrorCaught.message || 'Could not save this decision. Please try again.');
    } finally {
      setDecidingId(null);
    }
  };

  const handleExpandGuest = (request) => {
    const isExpanded = expandedGuestId === request.id;
    setExpandedGuestId(isExpanded ? null : request.id);
    setGuestNoteDraft(isExpanded ? '' : request.admin_notes || '');
    setGuestUpdateError(null);
  };

  const handleGuestStatusChange = async (request, status) => {
    setUpdatingGuestId(request.id);
    setGuestUpdateError(null);
    try {
      const updated = await updateGuestQuoteRequestStatus(request.id, status, guestNoteDraft.trim() || null);
      setGuestRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (updateErrorCaught) {
      setGuestUpdateError(updateErrorCaught.message || 'Could not save this change. Please try again.');
    } finally {
      setUpdatingGuestId(null);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <Typography variant="h2" className="text-foreground text-balance mb-4">
            B2B: Corporate Partners
          </Typography>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`rounded-lg border px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] transition-colors ${activeTab === 'applications' ? 'border-primary bg-primary text-white' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              Account Applications ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guests')}
              className={`rounded-lg border px-4 py-2 text-[0.76rem] font-semibold tracking-[0.04em] transition-colors ${activeTab === 'guests' ? 'border-primary bg-primary text-white' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              Guest Quote Requests ({guestRequests.length})
            </button>
          </div>

          {activeTab === 'applications' ? (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                All ({applications.length})
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
              <Button variant="ghost" className="px-3 py-2 text-[0.72rem] ml-auto" onClick={loadApplications} icon={RefreshCw}>
                Refresh
              </Button>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setGuestStatusFilter('all')}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${guestStatusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                All ({guestRequests.length})
              </button>
              {GUEST_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setGuestStatusFilter(status)}
                  className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${guestStatusFilter === status ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
                >
                  {status} ({guestStatusCounts[status] || 0})
                </button>
              ))}
              <Button variant="ghost" className="px-3 py-2 text-[0.72rem] ml-auto" onClick={loadGuestRequests} icon={RefreshCw}>
                Refresh
              </Button>
            </div>
          )}
        </div>

        {activeTab === 'applications' ? (
          error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
              {error}
            </div>
          ) : isLoading ? (
            <RowSkeletonList count={4} />
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Briefcase size={28} className="text-text-tertiary" />
              <Typography variant="small">No applications match this filter yet.</Typography>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((application) => {
                const isExpanded = expandedId === application.id;
                const isDeciding = decidingId === application.id;

                return (
                  <div
                    key={application.id}
                    className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleExpand(application)}
                      className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
                    >
                      <div className="flex-1 min-w-[220px]">
                        <p className="text-[0.9rem] font-semibold text-foreground">{application.business_name}</p>
                        <p className="text-[0.76rem] text-muted-foreground">
                          {application.contact_person} · {application.contact_email}
                        </p>
                        <p className="text-[0.72rem] text-text-tertiary mt-0.5">{formatDate(application.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[application.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                          {application.status}
                        </span>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Business</p>
                            <p className="text-[0.84rem] text-foreground">Registration #: {application.registration_number}</p>
                            <p className="text-[0.84rem] text-foreground">Est. Volume: {application.estimated_order_volume}</p>
                            <p className="text-[0.84rem] text-foreground">Delivery Region: {application.delivery_region}</p>
                          </div>

                          <div>
                            <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Contact</p>
                            <p className="text-[0.84rem] text-foreground">{application.contact_person}</p>
                            <p className="text-[0.84rem] text-foreground">{application.contact_phone}</p>
                            <p className="text-[0.84rem] text-foreground">{application.contact_email}</p>
                          </div>
                        </div>

                        {application.reviewed_at && (
                          <p className="text-[0.76rem] text-muted-foreground mb-3">
                            Reviewed {formatDate(application.reviewed_at)}
                          </p>
                        )}

                        {application.status === 'pending' ? (
                          <>
                            <Textarea
                              id={`admin-notes-${application.id}`}
                              label="Admin Notes (optional — shown to the applicant if declined)"
                              rows={2}
                              value={noteDraft}
                              onChange={(event) => setNoteDraft(event.target.value)}
                            />

                            {decisionError && (
                              <p className="mt-2 text-[0.8rem] text-red-600">{decisionError}</p>
                            )}

                            <div className="mt-3 flex items-center gap-2.5">
                              <Button
                                icon={Check}
                                className="px-4 py-2 text-[0.72rem]"
                                disabled={isDeciding}
                                onClick={() => handleDecision(application, 'approved')}
                              >
                                {isDeciding ? 'Saving...' : 'Approve'}
                              </Button>
                              <button
                                type="button"
                                disabled={isDeciding}
                                onClick={() => handleDecision(application, 'rejected')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                              >
                                <X size={14} />
                                Reject
                              </button>
                            </div>
                          </>
                        ) : (
                          application.admin_notes && (
                            <div>
                              <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Admin Notes</p>
                              <p className="text-[0.84rem] text-foreground whitespace-pre-wrap">{application.admin_notes}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : guestError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {guestError}
          </div>
        ) : isLoadingGuest ? (
          <RowSkeletonList count={4} />
        ) : filteredGuestRequests.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <MessageSquare size={28} className="text-text-tertiary" />
            <Typography variant="small">No quote requests match this filter yet.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGuestRequests.map((request) => {
              const isExpanded = expandedGuestId === request.id;
              const isUpdating = updatingGuestId === request.id;

              return (
                <div
                  key={request.id}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleExpandGuest(request)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-[0.9rem] font-semibold text-foreground">{request.business_name}</p>
                      <p className="text-[0.76rem] text-muted-foreground">
                        {request.contact_person} · {request.contact_email}
                      </p>
                      <p className="text-[0.72rem] text-text-tertiary mt-0.5">{formatDate(request.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[request.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                        {request.status}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Contact</p>
                          <p className="text-[0.84rem] text-foreground">{request.contact_person}</p>
                          <p className="text-[0.84rem] text-foreground">{request.contact_phone}</p>
                          <p className="text-[0.84rem] text-foreground">{request.contact_email}</p>
                          <p className="text-[0.84rem] text-foreground">Delivery Region: {request.delivery_region}</p>
                        </div>

                        <div>
                          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">What they want quoted</p>
                          <p className="text-[0.84rem] text-foreground whitespace-pre-wrap">{request.request_details}</p>
                        </div>
                      </div>

                      <Textarea
                        id={`guest-notes-${request.id}`}
                        label="Admin Notes (internal — not shown to the requester)"
                        rows={2}
                        value={guestNoteDraft}
                        onChange={(event) => setGuestNoteDraft(event.target.value)}
                      />

                      {guestUpdateError && (
                        <p className="mt-2 text-[0.8rem] text-red-600">{guestUpdateError}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        {request.status !== 'contacted' && (
                          <Button
                            icon={Check}
                            className="px-4 py-2 text-[0.72rem]"
                            disabled={isUpdating}
                            onClick={() => handleGuestStatusChange(request, 'contacted')}
                          >
                            {isUpdating ? 'Saving...' : 'Mark Contacted'}
                          </Button>
                        )}
                        {request.status !== 'closed' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleGuestStatusChange(request, 'closed')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-4 py-2 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors disabled:opacity-60"
                          >
                            <X size={14} />
                            Close
                          </button>
                        )}
                        {request.status !== 'new' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleGuestStatusChange(request, 'new')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-4 py-2 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors disabled:opacity-60"
                          >
                            <RotateCcw size={14} />
                            Reopen
                          </button>
                        )}
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

export default AdminCorporatePartners;
