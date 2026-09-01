import React from 'react';
import { Link } from 'react-router';
import LegalLayout from '@/features/legal/LegalLayout';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    content: (
      <>
        <p>
          These Terms and Conditions govern your use of the Leora Wellness website and your
          purchase of products from our brands, Miracle Natural and Laira. By accessing this
          website or placing an order, you agree to these terms. Please read them carefully before
          making a purchase.
        </p>
      </>
    )
  },
  {
    id: 'eligibility',
    title: 'Use of the Website',
    content: (
      <>
        <ul>
          <li>You must be at least 18 years old, or have a parent/guardian's consent, to place an order on our website.</li>
          <li>If you create an account, you are responsible for keeping your login details confidential and for all activity under your account.</li>
          <li>You agree to provide accurate, current, and complete information during registration and checkout.</li>
          <li>You agree not to use our website for any unlawful purpose or in a way that could damage, disable, or impair the site or interfere with anyone else's use of it.</li>
        </ul>
      </>
    )
  },
  {
    id: 'product-info',
    title: 'Product Information and Pricing',
    content: (
      <>
        <p>
          We make every effort to display accurate product descriptions, images, ingredients, and
          pricing, but we do not guarantee that all information is complete or error-free. Prices
          are listed in Sri Lankan Rupees (LKR) and may change without notice. Promotions and
          wholesale/corporate discount tiers are subject to their own terms and may be withdrawn
          or amended at any time.
        </p>
      </>
    )
  },
  {
    id: 'orders',
    title: 'Orders and Payments',
    content: (
      <>
        <ul>
          <li>Placing an order is an offer to purchase; an order is confirmed once we accept it, which for online payments occurs after successful payment.</li>
          <li>We reserve the right to refuse or cancel any order — for example, due to stock unavailability, a pricing or listing error, or suspected fraudulent activity — and will notify you if this happens.</li>
          <li>We currently accept <strong>Cash on Delivery</strong>. Where online payment is available, payments are processed securely through <strong>PayHere</strong>, a licensed Sri Lankan payment gateway; we do not store your full card details.</li>
          <li>Corporate Partner (wholesale/bulk) orders are subject to minimum order quantities and discount tiers set out at checkout, and to approval of your Corporate Partner account.</li>
        </ul>
      </>
    )
  },
  {
    id: 'shipping',
    title: 'Shipping and Delivery',
    content: (
      <>
        <p>
          We currently deliver within Sri Lanka. Standard delivery charges are LKR 300 for
          Colombo 1–15 and LKR 350 for other areas island-wide, shown at checkout before you
          confirm your order. Delivery timelines are estimates and may vary due to your location,
          courier conditions, or circumstances outside our control; we are not liable for delays
          caused by such circumstances.
        </p>
      </>
    )
  },
  {
    id: 'returns',
    title: 'Returns and Refunds',
    content: (
      <>
        <p>
          Returns, replacements, and refunds are handled in accordance with our{' '}
          <Link to="/return-policy">Return & Refund Policy</Link>, which forms part of these
          Terms. Please review it before purchasing.
        </p>
      </>
    )
  },
  {
    id: 'usage',
    title: 'Product Use',
    content: (
      <>
        <ul>
          <li>Use our products only as directed on the packaging or product page.</li>
          <li>Perform a patch test before first use, particularly if you have sensitive skin or known allergies.</li>
          <li>Discontinue use and seek professional medical advice if irritation or an adverse reaction occurs.</li>
          <li>Our products and any information on this website are not intended to diagnose, treat, cure, or prevent any medical condition, and are not a substitute for professional medical advice.</li>
        </ul>
      </>
    )
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    content: (
      <>
        <p>
          All content on this website — including text, product images, logos, brand names, and
          graphics — is owned by Leora Wellness (Pvt) Ltd or its licensors and is protected by
          applicable intellectual property laws. You may not copy, reproduce, distribute, or use
          this content for commercial purposes without our prior written consent.
        </p>
      </>
    )
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: (
      <>
        <p>
          To the fullest extent permitted by law, Leora Wellness (Pvt) Ltd and its directors,
          employees, and affiliates are not liable for any indirect, incidental, or consequential
          loss arising from your use of this website or our products, including loss caused by
          misuse of a product or failure to follow usage instructions. Nothing in these Terms
          excludes or limits liability that cannot be excluded or limited under Sri Lankan law.
        </p>
      </>
    )
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: (
      <>
        <p>
          These Terms and Conditions are governed by the laws of the Democratic Socialist
          Republic of Sri Lanka. Any disputes arising from these Terms or your use of this website
          will be subject to the exclusive jurisdiction of the courts of Sri Lanka.
        </p>
      </>
    )
  },
  {
    id: 'updates',
    title: 'Changes to These Terms',
    content: (
      <>
        <p>
          We may update these Terms and Conditions from time to time, and any changes will be
          posted on this page with a revised "Current as of" date above. Your continued use of our
          website after changes are posted means you accept the updated terms.
        </p>
      </>
    )
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          For questions about these Terms, contact us at{' '}
          <a href="mailto:dinisha@lanmic.com" className="email-link">dinisha@lanmic.com</a> or
          call/WhatsApp <a href="tel:+94112636832">+94 11 2636 832</a>.
        </p>
      </>
    )
  }
];

const TermsAndConditions = () => {
  return (
    <LegalLayout
      title="Terms and Conditions"
      subtitle="Please read these terms before using the Leora Wellness website and placing orders with Miracle Natural or Laira."
      overview="By using this site, you agree to the terms below."
      date="August 5, 2026"
      sections={sections}
    />
  );
};

export default TermsAndConditions;
