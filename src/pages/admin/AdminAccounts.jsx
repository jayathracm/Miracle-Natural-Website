import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RowSkeletonList } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { listAccounts, updateAccountRole, ACCOUNT_ROLES } from '../../lib/accounts';

const ROLE_LABELS = {
  customer: 'Customer',
  corporate_partner: 'Corporate Partner',
  admin: 'Admin',
  superadmin: 'Superadmin',
};

const ROLE_STYLES = {
  customer: 'border-gray-300 bg-gray-50 text-gray-700',
  corporate_partner: 'border-amber-300 bg-amber-50 text-amber-800',
  admin: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  superadmin: 'border-primary/40 bg-primary/10 text-primary',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-LK', { dateStyle: 'medium' });

const AdminAccounts = () => {
  const { user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pendingRoleByAccount, setPendingRoleByAccount] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const loadAccounts = () => {
    setIsLoading(true);
    setError(null);

    return listAccounts()
      .then(setAccounts)
      .catch((fetchError) => setError(fetchError.message || 'Could not load accounts.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const roleCounts = useMemo(() => {
    return accounts.reduce(
      (acc, account) => {
        acc[account.role] = (acc[account.role] || 0) + 1;
        return acc;
      },
      { customer: 0, corporate_partner: 0, admin: 0, superadmin: 0 }
    );
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return accounts.filter((account) => {
      if (roleFilter !== 'all' && account.role !== roleFilter) return false;
      if (!term) return true;
      return (
        (account.full_name || '').toLowerCase().includes(term) ||
        (account.email || '').toLowerCase().includes(term)
      );
    });
  }, [accounts, searchTerm, roleFilter]);

  const handleRoleSelect = (accountId, newRole) => {
    setPendingRoleByAccount((prev) => ({ ...prev, [accountId]: newRole }));
    setSaveError(null);
  };

  const handleCancelPending = (accountId) => {
    setPendingRoleByAccount((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
  };

  const handleSaveRole = async (account) => {
    const newRole = pendingRoleByAccount[account.id];
    if (!newRole || newRole === account.role) return;

    setSavingId(account.id);
    setSaveError(null);
    try {
      const updated = await updateAccountRole(account.id, newRole);
      setAccounts((prev) =>
        prev.map((item) => (item.id === account.id ? { ...item, role: updated.role } : item))
      );
      handleCancelPending(account.id);
    } catch (saveErrorCaught) {
      setSaveError(saveErrorCaught.message || 'Could not update this account\'s role.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Superadmin</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Account Management
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadAccounts} icon={RefreshCw}>
              Refresh
            </Button>
          </div>

          <div className="mt-5">
            <Input
              id="account-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email..."
              wrapperClassName="max-w-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${roleFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              All ({accounts.length})
            </button>
            {ACCOUNT_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${roleFilter === role ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                {ROLE_LABELS[role]} ({roleCounts[role] || 0})
              </button>
            ))}
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.82rem] text-red-700">
            {saveError}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <RowSkeletonList count={4} />
        ) : filteredAccounts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Search size={28} className="text-text-tertiary" />
            <Typography variant="small">No accounts match this search or filter.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAccounts.map((account) => {
              const pendingRole = pendingRoleByAccount[account.id];
              const hasPendingChange = Boolean(pendingRole) && pendingRole !== account.role;
              const isSaving = savingId === account.id;
              const isSelf = account.id === currentUser?.id;

              return (
                <div
                  key={account.id}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden px-4 py-3.5 sm:px-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-[0.9rem] font-semibold text-foreground">
                        {account.full_name || 'Unnamed account'}
                        {isSelf && <span className="ml-1.5 text-[0.68rem] font-normal text-text-tertiary">(you)</span>}
                      </p>
                      <p className="text-[0.76rem] text-muted-foreground">{account.email}</p>
                      <p className="text-[0.72rem] text-text-tertiary mt-0.5">
                        {account.phone ? `${account.phone} · ` : ''}Joined {formatDate(account.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${ROLE_STYLES[account.role] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                        {ROLE_LABELS[account.role] || account.role}
                      </span>

                      <select
                        value={pendingRole || account.role}
                        onChange={(event) => handleRoleSelect(account.id, event.target.value)}
                        disabled={isSaving}
                        className="rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-2.5 py-1.5 text-[0.76rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                      >
                        {ACCOUNT_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>

                      {hasPendingChange && (
                        <>
                          <Button
                            icon={ShieldCheck}
                            className="px-3 py-1.5 text-[0.68rem]"
                            disabled={isSaving}
                            onClick={() => handleSaveRole(account)}
                          >
                            {isSaving ? 'Saving...' : 'Apply'}
                          </Button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleCancelPending(account.id)}
                            className="text-[0.68rem] font-semibold text-text-secondary hover:text-foreground transition-colors disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccounts;
