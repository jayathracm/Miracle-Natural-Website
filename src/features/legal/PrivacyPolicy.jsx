import React from 'react';
import LegalLayout from '@/features/legal/LegalLayout';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    content: (
      <>
        <p>
          Leora Wellness (Pvt) Ltd ("we", "our", "us") is the personal-care company behind
          Miracle Natural and Laira. We are committed to protecting the privacy and security of
          your personal information when you visit our website or purchase our products. This
          Privacy Policy explains what information we collect, how we use it, and the choices you
          have. By using our website, you consent to the practices described here.
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
          <li><strong>Contact and account details</strong> such as your name, email address, phone number, and delivery address, provided when you register, place an order, or contact us.</li>
          <li><strong>Order and transaction information</strong> needed to process and deliver your purchases, including order history and delivery preferences.</li>
          <li><strong>Payment information</strong> necessary to complete your order. Card and online payment details are collected and processed directly by our payment partner, PayHere (a licensed payment gateway in Sri Lanka) — we do not receive or store your full card number or CVV.</li>
          <li><strong>Business account details</strong> such as company name and registration information, if you register as a Corporate Partner for wholesale or bulk ordering.</li>
          <li><strong>Browsing and device information</strong>, such as your IP address, browser type, and pages visited, collected automatically to keep the site secure and working correctly.</li>
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
          <li>Process, fulfil, and deliver your orders, and keep you updated on their status.</li>
          <li>Provide customer support and respond to inquiries, including through our website chat assistant.</li>
          <li>Manage your account, order history, saved addresses, and wishlist.</li>
          <li>Review and manage Corporate Partner applications and wholesale pricing eligibility.</li>
          <li>Improve our products, website, and shopping experience based on usage patterns and feedback.</li>
          <li>Detect, investigate, and prevent fraud, abuse, or unauthorized activity on our website.</li>
          <li>Send you optional marketing or promotional messages, only where you have opted in — you can opt out at any time.</li>
        </ul>
      </>
    )
  },
  {
    id: 'cookies',
    title: 'Cookies and Local Storage',
    content: (
      <>
        <p>
          We use cookies and similar browser technologies (such as local storage) to keep you
          signed in, remember items in your cart, maintain continuity with our chat assistant
          between visits, and understand how our website is used so we can improve it. You can
          disable cookies through your browser settings, but some features of the site — such as
          staying signed in or keeping items in your cart — may not work correctly without them.
        </p>
      </>
    )
  },
  {
    id: 'sharing',
    title: 'How We Share Information',
    content: (
      <>
        <p>We do not sell or rent your personal information. We share only what's necessary with:</p>
        <ul>
          <li><strong>Payment processors</strong> — PayHere, to securely process online payments.</li>
          <li><strong>Delivery and logistics partners</strong>, to fulfil and deliver your order.</li>
          <li><strong>Hosting and infrastructure providers</strong>, who store and run our website and database securely on our behalf, under confidentiality obligations.</li>
          <li><strong>Legal and regulatory authorities</strong>, where required to comply with the law or to protect our rights, customers, or the public.</li>
        </ul>
      </>
    )
  },
  {
    id: 'security',
    title: 'Data Security and Retention',
    content: (
      <>
        <ul>
          <li>We use industry-standard technical and organizational safeguards — including encrypted connections and access-controlled databases — to protect your information from unauthorized access, alteration, or loss.</li>
          <li>No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security, but we work to keep your data safe and to respond quickly to any issue.</li>
          <li>We retain personal information only as long as needed to fulfil the purposes described in this policy, or as required by applicable law (for example, financial and order records).</li>
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
          You may request access to, correction of, or deletion of your personal information, or
          ask us how it is being used, by contacting{' '}
          <a href="mailto:dinisha@lanmic.com">dinisha@lanmic.com</a>. We handle data in line with
          the principles of Sri Lanka's Personal Data Protection Act, No. 9 of 2022, and will
          continue to align our practices as its provisions come fully into force.
        </p>
      </>
    )
  },
  {
    id: 'children',
    title: "Children's Privacy",
    content: (
      <>
        <p>
          Our website and products are intended for adults. We do not knowingly collect personal
          information from children. If you believe a child has provided us with personal
          information, please contact us and we will remove it promptly.
        </p>
      </>
    )
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices
          or for legal reasons. Any changes will be posted on this page with a revised "Current as
          of" date above. We encourage you to review this page periodically.
        </p>
      </>
    )
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: (
      <>
        <p>
          For any questions, concerns, or requests regarding this Privacy Policy or your personal
          information, contact us at{' '}
          <a href="mailto:dinisha@lanmic.com">dinisha@lanmic.com</a>, call/WhatsApp{' '}
          <a href="tel:+94112636832">+94 11 2636 832</a>, or write to us at No. 15A, Kandawala
          Mawatha, Ratmalana, Sri Lanka.
        </p>
      </>
    )
  },
];

const PrivacyPolicy = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Learn how Leora Wellness (Pvt) Ltd collects, uses, and protects your information across Miracle Natural and Laira."
      overview="We are committed to privacy, transparency, and secure handling of customer data."
      date="August 5, 2026"
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
