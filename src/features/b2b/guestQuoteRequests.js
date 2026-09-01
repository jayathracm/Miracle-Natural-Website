import { supabase } from '@/shared/lib/supabaseClient';

// Public lead form at /corporate-partner — no account needed. Anyone (the
// anon role included) can insert here per the "Anyone can submit a guest
// quote request" RLS policy; only admins can read the list back.
export async function submitGuestQuoteRequest({
  businessName,
  contactPerson,
  contactPhone,
  contactEmail,
  deliveryRegion,
  requestDetails,
}) {
  const { data, error } = await supabase
    .from('guest_quote_requests')
    .insert({
      business_name: businessName.trim(),
      contact_person: contactPerson.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      delivery_region: deliveryRegion.trim(),
      request_details: requestDetails.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Admin-only in practice: the "Admins can view guest quote requests" policy
// is the only select policy on this table.
export async function fetchAllGuestQuoteRequests() {
  const { data, error } = await supabase
    .from('guest_quote_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// Marks a request contacted/closed (or reopens it back to new), optionally
// leaving a note for whoever follows up next. No role is granted here —
// unlike corporate_partner_applications, there's no account to flip a role
// on. If a guest lead turns into a real account, an admin grants
// corporate_partner separately via /admin/accounts.
export async function updateGuestQuoteRequestStatus(id, status, adminNotes = null) {
  const payload = { status, updated_at: new Date().toISOString() };
  if (adminNotes !== null) {
    payload.admin_notes = adminNotes.trim() || null;
  }

  const { data, error } = await supabase
    .from('guest_quote_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
