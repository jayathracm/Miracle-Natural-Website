import { supabase } from './supabaseClient';

export const ACCOUNT_ROLES = ['customer', 'corporate_partner', 'admin', 'superadmin'];

/**
 * Superadmin-only account directory. Goes through the list_accounts_for_admin
 * RPC rather than selecting from `profiles` directly, since profiles has no
 * email column (email lives in auth.users, which the RPC joins against
 * server-side) and there is no client-facing "select all profiles" RLS
 * policy — the RPC checks private.is_superadmin() internally instead.
 *
 * search matches full name or email (case-insensitive, partial).
 * roleFilter is one of ACCOUNT_ROLES, or 'all'/null/undefined for everyone.
 */
export async function listAccounts({ search = '', roleFilter = 'all' } = {}) {
  const { data, error } = await supabase.rpc('list_accounts_for_admin', {
    p_search: search?.trim() ? search.trim() : null,
    p_role_filter: !roleFilter || roleFilter === 'all' ? null : roleFilter,
  });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Changes an account's role via the update_account_role RPC — the only
 * supported write path (profiles has no client-facing update policy for
 * anyone else's role). The RPC itself refuses to demote the last remaining
 * superadmin, so this can't accidentally lock everyone out.
 */
export async function updateAccountRole(userId, newRole) {
  const { data, error } = await supabase.rpc('update_account_role', {
    p_user_id: userId,
    p_new_role: newRole,
  });

  if (error) {
    throw error;
  }

  return data;
}
