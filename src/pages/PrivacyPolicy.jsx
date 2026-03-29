import React from 'react';
import LegalLayout from '../components/LegalLayout';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    content: (
      <>
        <p>
          Miracle Natural ("we", "our", "us") is committed to protecting your personal information when you browse our website and purchase our products.
        </p>
      </>
    )
  },
  {
    id: 'collection',
    title: 'Information We Collect',
    content: (
      <>
        <ul>
          <li><strong>Contact details</strong> such as name, email, phone number, and delivery address.</li>
          <li><strong>Order and payment confirmations</strong> needed to process purchases.</li>
          <li><strong>Website usage data</strong> for analytics, security, and performance improvements.</li>
        </ul>
      </>
    )
  },
  {
    id: 'usage',
    title: 'How We Use Your Information',
    content: (
      <>
        <ul>
          <li>Process and deliver your orders.</li>
          <li>Provide customer support and order updates.</li>
          <li>Improve product quality and shopping experience.</li>
          <li>Send optional marketing messages only when you opt in.</li>
        </ul>
      </>
    )
  },
  {
    id: 'sharing',
    title: 'How We Share Information',
    content: (
      <>
        <p>We may share necessary information with:</p>
        <ul>
          <li>Payment and checkout service providers.</li>
          <li>Delivery and logistics partners.</li>
          <li>Trusted technical providers supporting hosting and analytics.</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </>
    )
  },
  {
    id: 'security',
    title: 'Security and Retention',
    content: (
      <>
        <ul>
          <li>We use industry-standard safeguards to protect your information.</li>
          <li>Data is retained only as long as needed for service delivery and legal obligations.</li>
        </ul>
      </>
    )
  },
  {
    id: 'rights',
    title: 'Your Rights',
    content: (
      <>
        <p>
          You may request access, correction, or deletion of your personal information by contacting <a href="mailto:dinisha@lanmic.com">dinisha@lanmic.com</a>.
        </p>
      </>
    )
  },
];

const PrivacyPolicy = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Learn how Miracle Natural collects, uses, and protects your information."
      overview="We are committed to privacy, transparency, and secure handling of customer data."
      date="March 29, 2026"
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
