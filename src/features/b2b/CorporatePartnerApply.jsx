import React, { useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Briefcase, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { useAuth } from '@/features/auth/AuthContext';
import { submitGuestQuoteRequest } from '@/features/b2b/guestQuoteRequests';
import { shopPathForBrand } from '@/shared/lib/brands';

const primaryLinkClasses = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-primary text-white text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors';

const emptyForm = {
  businessName: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  deliveryRegion: '',
  requestDetails: '',
};

// Public lead form — no sign-in required. Anyone can ask for wholesale
// pricing on whatever they need; staff follow up by phone/email. Signed-in
// visitors who are already an admin/corporate partner get pointed at the
// shop instead, since they already have wholesale pricing.
const CorporatePartnerApply = () => {
  const { user, loading, isAdmin, isCorporatePartner } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.businessName.trim()) {
      setFormError('Please enter your business name.');
      return;
    }
    if (!form.contactPerson.trim()) {
      setFormError('Please enter a contact person.');
      return;
    }
    if (!form.contactPhone.trim()) {
      setFormError('Please enter a contact phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      setFormError('Please enter a valid contact email address.');
      return;
    }
    if (!form.deliveryRegion.trim()) {
      setFormError('Please enter your delivery region.');
      return;
    }
    if (!form.requestDetails.trim()) {
      setFormError('Please tell us what you would like a quote for.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGuestQuoteRequest(form);
      setJustSubmitted(true);
    } catch (error) {
      setFormError(error.message || 'Could not send your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <Typography variant="small">Loading...</Typography>
      </div>
    );
  }

  if (isAdmin || isCorporatePartner) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)] text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <Typography variant="h3" className="mb-2 text-foreground">You already have wholesale access</Typography>
            <Typography variant="small" className="block mb-6">
              {isAdmin
                ? 'Your account has admin access, which already includes wholesale pricing.'
                : 'Your account is already approved as a Corporate Partner.'}
            </Typography>
            <Link to={shopPathForBrand('miracle_natural')} className={`${primaryLinkClasses} inline-flex`}>
              <ShoppingBag size={16} />
              Go to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 sm:pt-30 md:pt-32 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Typography variant="label" className="mb-2 block">Business Account</Typography>
          <Typography variant="h2" className="text-foreground">Request a Wholesale Quote</Typography>
          <p className="mt-2 text-[0.9rem] text-muted-foreground leading-relaxed">
            Tell us what you're after and we'll follow up by phone or email — no account needed to
            ask for a quote.
          </p>
        </div>

        {justSubmitted ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)] text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
              <Briefcase size={32} className="text-primary" />
            </div>
            <Typography variant="h3" className="mb-2 text-foreground">Request sent</Typography>
            <Typography variant="small" className="block mb-6 text-muted-foreground">
              Thanks — a team member will follow up by phone or email with pricing. No action needed
              from you right now.
            </Typography>
            <Link to={shopPathForBrand('miracle_natural')} className={`${primaryLinkClasses} inline-flex`}>
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)] space-y-3.5"
          >
            <Input
              id="business-name"
              label="Business Name"
              type="text"
              value={form.businessName}
              onChange={setField('businessName')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="contact-person"
                label="Contact Person"
                type="text"
                value={form.contactPerson}
                onChange={setField('contactPerson')}
              />
              <Input
                id="contact-phone"
                label="Contact Phone"
                type="tel"
                value={form.contactPhone}
                onChange={setField('contactPhone')}
              />
            </div>

            <Input
              id="contact-email"
              label="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={setField('contactEmail')}
            />

            <Input
              id="delivery-region"
              label="Delivery Region"
              type="text"
              placeholder="e.g. Western Province, Sri Lanka"
              value={form.deliveryRegion}
              onChange={setField('deliveryRegion')}
            />

            <Textarea
              id="request-details"
              label="What would you like quoted?"
              rows={3}
              placeholder="e.g. products and quantities you're interested in, and how often you'd order"
              value={form.requestDetails}
              onChange={setField('requestDetails')}
            />

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button type="submit" className="px-6 py-2.5 text-[0.76rem]" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>

            {!user && (
              <p className="text-[0.76rem] text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary underline underline-offset-2">Sign in</Link> to see your order history alongside this request.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default CorporatePartnerApply;
