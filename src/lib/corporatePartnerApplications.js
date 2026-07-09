import { supabase } from './supabaseClient';

/**
 * Submits a new corporate partner (wholesale account) application for the
 * signed-in user. `user_id` is left out of the payload — the column
 * defaults to auth.uid() and RLS requires it match anyway, so there's
 * nothing for the caller to get wrong here.
 */
export async function submitApplication({
  businessName,
  registrationNumber,
  contactPerson,
  contactPhone,
  contactEmail,
  estimatedOrderVolume,
  deliveryRegion,
}) {
  const { data, error } = await supabase
    .from('corporate_partner_applications')
    .insert({
      business_name: businessName.trim(),
      registration_number: registrationNumber.trim(),
      contact_person: contactPerson.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      estimated_order_volume: estimatedOrderVolume.trim(),
      delivery_region: deliveryRegion.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * The signed-in user's own application history, newest first — enough to
 * show "your application is pending/approved/rejected" without a separate
 * admin-only endpoint.
 */
export async function fetchMyApplications() {
  const { data, error } = await supabase
    .from('corporate_partner_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Admin-only in practice: the "Admins can view all applications" RLS policy
 * means an admin's session sees every applicant's row, not just their own.
 */
export async function fetchAllApplications() {
  const { data, error } = await supabase
    .from('corporate_partner_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Approves or rejects an application via the review_corporate_partner_application
 * RPC — the only supported write path (the table itself has no client-facing
 * update policy). Approving atomically flips the applicant's profiles.role
 * to 'corporate_partner' server-side.
 */
export async function reviewApplication(applicationId, decision, adminNotes = null) {
  const { data, error } = await supabase.rpc('review_corporate_partner_application', {
    p_application_id: applicationId,
    p_decision: decision,
    p_admin_notes: adminNotes,
  });

  if (error) {
    throw error;
  }

  return data;
}
