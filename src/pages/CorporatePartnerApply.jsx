import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Briefcase, CheckCircle2, Clock, ShoppingBag, User } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { fetchMyApplications, submitApplication } from '../lib/corporatePartnerApplications';

const primaryLinkClasses = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-primary text-white text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors';
const ghostLinkClasses = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors';

const emptyForm = {
  businessName: '',
  registrationNumber: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  estimatedOrderVolume: '',
  deliveryRegion: '',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const CorporatePartnerApply = () => {
  const { user, loading, isAdmin, isCorporatePartner } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoadingApplications(false);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingApplications(true);

    fetchMyApplications()
      .then((rows) => {
        if (!isMounted) return;
        setApplications(rows);
        setForm((prev) => ({ ...prev, contactEmail: prev.contactEmail || user.email || '' }));
      })
      .catch((error) => {
        if (!isMounted) return;
        setApplicationsError(error.message || 'Could not load your application history.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingApplications(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.businessName.trim()) {
      setFormError('Please enter your business name.');
      return;
    }
    if (!form.registrationNumber.trim()) {
      setFormError('Please enter your business registration number.');
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
    if (!form.estimatedOrderVolume.trim()) {
      setFormError('Please enter your estimated order volume.');
      return;
    }
    if (!form.deliveryRegion.trim()) {
      setFormError('Please enter your delivery region.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitApplication(form);
      setApplications((prev) => [created, ...prev]);
      setJustSubmitted(true);
    } catch (error) {
      setFormError(error.message || 'Could not submit your application. Please try again.');
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

  if (!user) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)] text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
              <Briefcase size={32} className="text-primary" />
            </div>
            <Typography variant="label" className="mb-2 block">Business Account</Typography>
            <Typography variant="h3" className="mb-2 text-foreground">Apply for wholesale pricing</Typography>
            <Typography variant="small" className="block mb-6">
              Sign in or create an account first — we link every application to your profile so we
              know who to unlock wholesale pricing for once it's approved.
            </Typography>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link to="/signup" className={`${primaryLinkClasses} w-full sm:w-auto`}>
                <User size={16} />
                Create Account
              </Link>
              <Link to="/login" className={`${ghostLinkClasses} w-full sm:w-auto`}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
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
            <Typography variant="h3" className="mb-2 text-foreground">You already have business account access</Typography>
            <Typography variant="small" className="block mb-6">
              {isAdmin
                ? 'Your account has admin access, which already includes wholesale pricing.'
                : 'Your account is already approved as a Corporate Partner.'}
            </Typography>
            <Link to="/shop" className={`${primaryLinkClasses} inline-flex`}>
              <ShoppingBag size={16} />
              Go to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingApplication = applications.find((application) => application.status === 'pending');
  const latestApplication = applications[0];

  return (
    <div className="pt-28 sm:pt-30 md:pt-32 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Typography variant="label" className="mb-2 block">Business Account</Typography>
          <Typography variant="h2" className="text-foreground">Apply for Wholesale Pricing</Typography>
          <p className="mt-2 text-[0.9rem] text-muted-foreground leading-relaxed">
            Tell us about your business and we'll follow up once it's reviewed. Approved accounts
            unlock wholesale pricing and bulk ordering — no document upload needed, we'll reach out
            if we need anything else to verify your business.
          </p>
        </div>

        {isLoadingApplications ? (
          <Skeleton className="h-40 w-full" />
        ) : applicationsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {applicationsError}
          </div>
        ) : justSubmitted || pendingApplication ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)] text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-amber-100 border border-amber-200 inline-flex items-center justify-center">
              <Clock size={32} className="text-amber-700" />
            </div>
            <Typography variant="h3" className="mb-2 text-foreground">Application under review</Typography>
            <Typography variant="small" className="block mb-1">
              We received your application for <strong>{(pendingApplication || applications[0])?.business_name}</strong>.
            </Typography>
            <Typography variant="small" className="block mb-1 text-muted-foreground">
              Submitted {formatDate((pendingApplication || applications[0]).created_at)}.
            </Typography>
            <Typography variant="small" className="block mb-6 text-muted-foreground">
              A team member will review it and follow up by email — no action needed from you right now.
            </Typography>
            <Link to="/shop" className={`${ghostLinkClasses} inline-flex`}>
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            {latestApplication?.status === 'rejected' && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-[0.86rem] text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">Your previous application wasn't approved</p>
                  <p>{latestApplication.admin_notes || 'You are welcome to apply again with updated details.'}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)] space-y-3.5"
            >
              <Input
                id="business-name"
                label="Business Name"
                type="text"
                value={form.businessName}
                onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
              />
              <Input
                id="registration-number"
                label="Business Registration Number"
                type="text"
                value={form.registrationNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, registrationNumber: event.target.value }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  id="contact-person"
                  label="Contact Person"
                  type="text"
                  value={form.contactPerson}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
                />
                <Input
                  id="contact-phone"
                  label="Contact Phone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                />
              </div>

              <Input
                id="contact-email"
                label="Contact Email"
                type="email"
                value={form.contactEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
              />

              <Textarea
                id="estimated-order-volume"
                label="Estimated Order Volume"
                rows={2}
                placeholder="e.g. 500 units per month"
                value={form.estimatedOrderVolume}
                onChange={(event) => setForm((prev) => ({ ...prev, estimatedOrderVolume: event.target.value }))}
              />

              <Input
                id="delivery-region"
                label="Delivery Region"
                type="text"
                placeholder="e.g. Western Province, Sri Lanka"
                value={form.deliveryRegion}
                onChange={(event) => setForm((prev) => ({ ...prev, deliveryRegion: event.target.value }))}
              />

              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button type="submit" className="px-6 py-2.5 text-[0.76rem]" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CorporatePartnerApply;
