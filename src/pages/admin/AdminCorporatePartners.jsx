import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Check, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { RowSkeletonList } from '../../components/ui/Skeleton';
import { fetchAllApplications, reviewApplication } from '../../lib/corporatePartnerApplications';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

const STATUS_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-700',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const AdminCorporatePartners = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [decidingId, setDecidingId] = useState(null);
  const [decisionError, setDecisionError] = useState(null);

  const loadApplications = () => {
    setIsLoading(true);
    setError(null);

    return fetchAllApplications()
      .then(setApplications)
      .catch((fetchError) => setError(fetchError.message || 'Could not load applications.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadApplications();
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

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Corporate Partner Applications
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadApplications} icon={RefreshCw}>
              Refresh
            </Button>
          </div>

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
          </div>
        </div>

        {error ? (
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
        )}
      </div>
    </div>
  );
};

export default AdminCorporatePartners;
