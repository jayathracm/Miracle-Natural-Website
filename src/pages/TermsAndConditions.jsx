import React from 'react';
import LegalLayout from '../components/LegalLayout';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    content: (
      <>
        <p>
          These Terms and Conditions govern your use of the Miracle Natural website and purchases made through our platform.
        </p>
      </>
    )
  },
  {
    id: 'orders',
    title: 'Orders and Payments',
    content: (
      <>
        <p>
          Orders are confirmed only after successful payment. Prices and product availability may change without notice.
        </p>
      </>
    )
  },
  {
    id: 'shipping',
    title: 'Shipping and Delivery',
    content: (
      <>
        <p>
          Delivery timelines are estimates and may vary by location or courier conditions. We are not responsible for delays outside our control.
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
          Return and refund handling is subject to our Return Policy. Please review the policy before purchasing.
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
          <li>Use products only as directed on the packaging.</li>
          <li>Perform a patch test before first use, especially for sensitive skin.</li>
          <li>Discontinue use and seek professional advice if irritation occurs.</li>
        </ul>
      </>
    )
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: (
      <>
        <p>
          To the extent permitted by law, Miracle Natural is not liable for indirect or consequential losses arising from website use or product misuse.
        </p>
      </>
    )
  },
  {
    id: 'updates',
    title: 'Changes to Terms',
    content: (
      <>
        <p>
          We may update these terms from time to time. Continued use of our website indicates acceptance of the updated terms.
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
          For support, contact <a href="mailto:dinisha@lanmic.com" className="email-link">dinisha@lanmic.com</a>.
        </p>
      </>
    )
  }
];

const TermsAndConditions = () => {
  return (
    <LegalLayout
      title="Terms and Conditions"
      subtitle="Please read these terms before using the Miracle Natural website and placing orders."
      overview="By using this site, you agree to the terms below."
      date="March 29, 2026"
      sections={sections}
    />
  );
};

export default TermsAndConditions;
