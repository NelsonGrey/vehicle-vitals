import React from 'react';
import AdBanner from '../components/AdBanner';
// Header and footer provided by Layout

export default function Contact() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-5">
      <AdBanner />
      <h1 className="font-serif font-bold text-4xl text-charcoal dark:text-light-cream mb-4">Contact Us</h1>
      <p className="text-charcoal dark:text-light-cream mb-4">
        We'd love to hear from you. For support, feedback, or questions, send us an email:
      </p>
      <p className="mb-4">
        <a 
          href="mailto:support@vehicle-vitals.com"
          className="text-oxblood dark:text-rust hover:underline"
        >
          support@vehicle-vitals.com
        </a>
      </p>
      <p className="text-warm-gray dark:text-light-gray text-sm">
        Include your browser/app version and a brief description of the issue to help us assist you faster.
      </p>
    </div>
  );
}
