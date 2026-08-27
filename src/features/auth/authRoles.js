// Pure role-derivation logic, pulled out of AuthContext.jsx so the
// isAdmin/isSuperAdmin/isCorporatePartner rules can be unit tested without
// a Supabase session or React in the loop.

// A missing/null role (no profile loaded yet, or a row with no role set)
// defaults to 'customer'. Superadmin counts as admin everywhere isAdmin is
// checked — it's a rank above admin, not a separate track.
export function deriveRoleFlags(profileRole) {
  const role = profileRole ?? 'customer';
  return {
    role,
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    isCorporatePartner: role === 'corporate_partner',
  };
}
