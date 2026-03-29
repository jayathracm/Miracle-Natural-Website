import React from 'react';
import LegalLayout from '../components/LegalLayout';

const sections = [
  {
    id: 'intro',
    title: 'Overview',
    content: (
      <>
        <p>
          We aim to keep returns simple and fair. If something is not right with your order, contact us and we will help.
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
          <li>Returns must be requested within <strong>7 days</strong> of delivery.</li>
          <li>Items must be unopened, unused, and in original packaging.</li>
          <li>Opened personal-care items are non-returnable for hygiene reasons unless faulty.</li>
        </ul>
      </>
    )
  },
  {
    id: 'damaged',
    title: 'Damaged or Incorrect Items',
    content: (
      <>
        <p>
          If your order arrives damaged or incorrect, please contact us within 48 hours with photos. We will arrange a replacement or refund.
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
          <li>Approved refunds are sent to the original payment method.</li>
          <li>Processing time is typically <strong>3 to 7 business days</strong>, depending on your bank or payment provider.</li>
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
          For return support, email <a href="mailto:dinisha@lanmic.com">dinisha@lanmic.com</a> with your order number.
        </p>
      </>
    )
  }
];

const ReturnPolicy = () => {
  return (
    <LegalLayout
      title="Return & Refund Policy"
      subtitle="Our return policy for Miracle Natural product purchases."
      overview="We aim to handle all return requests quickly and fairly."
      date="March 29, 2026"
      sections={sections}
    />
  );
};

export default ReturnPolicy;
