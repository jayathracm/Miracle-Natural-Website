import { describe, it, expect } from 'vitest';
import { deriveRoleFlags } from './authRoles';

describe('deriveRoleFlags', () => {
  it('defaults to customer when the role is undefined (no profile loaded yet)', () => {
    expect(deriveRoleFlags(undefined)).toEqual({
      role: 'customer',
      isAdmin: false,
      isSuperAdmin: false,
      isCorporatePartner: false,
    });
  });

  it('defaults to customer when the role is null (profile row with no role set)', () => {
    expect(deriveRoleFlags(null)).toEqual({
      role: 'customer',
      isAdmin: false,
      isSuperAdmin: false,
      isCorporatePartner: false,
    });
  });

  it('treats an explicit "customer" role the same as the default', () => {
    expect(deriveRoleFlags('customer')).toEqual({
      role: 'customer',
      isAdmin: false,
      isSuperAdmin: false,
      isCorporatePartner: false,
    });
  });

  it('marks admin as isAdmin but not isSuperAdmin', () => {
    expect(deriveRoleFlags('admin')).toEqual({
      role: 'admin',
      isAdmin: true,
      isSuperAdmin: false,
      isCorporatePartner: false,
    });
  });

  it('marks superadmin as both isAdmin and isSuperAdmin (superadmin counts as admin)', () => {
    expect(deriveRoleFlags('superadmin')).toEqual({
      role: 'superadmin',
      isAdmin: true,
      isSuperAdmin: true,
      isCorporatePartner: false,
    });
  });

  it('marks corporate_partner as isCorporatePartner only, not isAdmin', () => {
    expect(deriveRoleFlags('corporate_partner')).toEqual({
      role: 'corporate_partner',
      isAdmin: false,
      isSuperAdmin: false,
      isCorporatePartner: true,
    });
  });

  it('treats an unrecognized role string as itself, with every flag false', () => {
    expect(deriveRoleFlags('some_future_role')).toEqual({
      role: 'some_future_role',
      isAdmin: false,
      isSuperAdmin: false,
      isCorporatePartner: false,
    });
  });

  it('never marks more than one of isAdmin/isCorporatePartner\'s underlying role true at once for any known role', () => {
    const knownRoles = ['customer', 'admin', 'superadmin', 'corporate_partner'];
    knownRoles.forEach((role) => {
      const flags = deriveRoleFlags(role);
      const trueFlagCount = [flags.isAdmin, flags.isCorporatePartner].filter(Boolean).length;
      // isAdmin and isCorporatePartner are mutually exclusive — no role is both.
      expect(trueFlagCount).toBeLessThanOrEqual(1);
    });
  });
});
