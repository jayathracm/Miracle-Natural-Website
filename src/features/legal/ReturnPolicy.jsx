import React from 'react';
import LegalLayout from '@/features/legal/LegalLayout';

const sections = [
  {
    id: 'intro',
    title: 'Overview',
    content: (
      <>
        <p>
          Thank you for shopping with Leora Wellness (Pvt) Ltd, trading online as Miracle Natural
          and Laira. We want you to be genuinely happy with your purchase. If something isn't
          right with your order, this policy explains what qualifies for a return, how refunds are
          issued, and how to reach us — we aim to handle every request quickly and fairly.
        </p>
      </>
    )
  },
  {
    id: 'eligibility',
    title: 'Return Eligibility',
    content: (
      <>
        <ul>
          <li>Returns must be requested within <strong>7 days</strong> of the delivery date.</li>
          <li>Items must be unused, unopened, and in their original packaging with all seals intact.</li>
          <li>Proof of purchase (your order number or confirmation email) is required for every return.</li>
          <li>Opened or used personal-care items are non-returnable for hygiene and safety reasons, unless the item is faulty or was not what you ordered.</li>
        </ul>
      </>
    )
  },
  {
    id: 'non-returnable',
    title: 'Non-Returnable Items',
    content: (
      <>
        <p>Certain items cannot be returned or refunded once delivered, including:</p>
        <ul>
          <li>Opened, used, or seal-broken personal-care and cosmetic products (for hygiene reasons).</li>
          <li>Items marked as final sale or clearance.</li>
          <li>Products damaged, misused, or altered after delivery through no fault of ours.</li>
        </ul>
        <p>
          This does not affect your right to a replacement or refund for items that arrive
          damaged, defective, or incorrect — see below.
        </p>
      </>
    )
  },
  {
    id: 'damaged',
    title: 'Damaged, Defective, or Incorrect Items',
    content: (
      <>
        <p>
          If your order arrives damaged, defective, or different from what you ordered, please
          contact us within <strong>48 hours of delivery</strong> with your order number and clear
          photos of the item and its packaging. Once verified, we will arrange a free replacement
          or a full refund, whichever you prefer, subject to product availability.
        </p>
      </>
    )
  },
  {
    id: 'replacements',
    title: 'Replacements',
    content: (
      <>
        <p>
          If you'd prefer a different size or product instead of a refund, contact our support
          team within the 7-day return window. We'll do our best to arrange a replacement,
          subject to stock availability — where a direct swap isn't possible, we'll process a
          refund instead.
        </p>
      </>
    )
  },
  {
    id: 'return-shipping',
    title: 'Return Shipping',
    content: (
      <>
        <p>
          If a return is due to our error — a wrong, damaged, or defective item — we cover the
          return shipping cost. For all other approved returns (such as a change of mind, where
          eligible), the cost of returning the item to us is the customer's responsibility.
        </p>
      </>
    )
  },
  {
    id: 'refunds',
    title: 'Refund Process',
    content: (
      <>
        <ul>
          <li>Once we receive and inspect a returned item, we'll notify you by email or phone of the outcome.</li>
          <li>For orders paid by <strong>Cash on Delivery</strong>, approved refunds are issued via bank transfer to an account you provide, or as store credit if you prefer.</li>
          <li>For orders paid <strong>online through PayHere</strong>, approved refunds are returned to the original card or payment method used at checkout.</li>
          <li>Approved refunds are processed within <strong>3 to 7 business days</strong> of approval; it may take a few additional days for the funds to reflect in your account, depending on your bank.</li>
          <li>Refunds cover the price of the returned item(s). Original delivery charges are non-refundable unless the return is due to our error.</li>
        </ul>
      </>
    )
  },
  {
    id: 'contact',
    title: 'Need Help?',
    content: (
      <>
        <p>
          For return, replacement, or refund support, email{' '}
          <a href="mailto:dinisha@lanmic.com">dinisha@lanmic.com</a> or call/WhatsApp{' '}
          <a href="tel:+94112636832">+94 11 2636 832</a> with your order number. Our team is here
          to make this as easy as possible.
        </p>
      </>
    )
  }
];

const ReturnPolicy = () => {
  return (
    <LegalLayout
      title="Return & Refund Policy"
      subtitle="Our return, replacement, and refund policy for orders placed with Leora Wellness (Pvt) Ltd, covering Miracle Natural and Laira purchases."
      overview="We aim to handle all return requests quickly and fairly."
      date="August 5, 2026"
      sections={sections}
    />
  );
};

export default ReturnPolicy;
