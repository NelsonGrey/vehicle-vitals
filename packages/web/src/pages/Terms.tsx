import AdBanner from '../components/AdBanner';
// Header and footer provided by Layout

export default function Terms() {
  return (
    <div>
      <div className="container">
        <AdBanner />
        <h1>Terms of Use</h1>
        <p>Last updated: September 30, 2025</p>
        <h3>1. Acceptance of Terms</h3>
        <p>
          By accessing or using Vehicle Vitals, you agree to be bound by these Terms of Use. If you do not agree, do not use the service.
        </p>
        <h3>2. Description of Service</h3>
        <p>
          Vehicle Vitals provides tools to track vehicle information and maintenance. Features may change over time.
        </p>
        <h3>3. Your Responsibilities</h3>
        <ul>
          <li>Provide accurate information about your vehicles and maintenance.</li>
          <li>Maintain the security of your account.</li>
          <li>Use the service in compliance with applicable laws.</li>
        </ul>
        <h3>4. Data and Privacy</h3>
        <p>
          We handle personal and vehicle data as described in our <a href="/privacy">Privacy Policy</a>.
        </p>
        <h3>5. Disclaimers</h3>
        <p>
          The service is provided “as is” without warranties of any kind. Maintenance reminders or suggestions are informational and you are responsible for your vehicle’s upkeep.
        </p>
        <h3>6. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, Vehicle Vitals is not liable for any indirect, incidental, or consequential damages arising from your use of the service.
        </p>
        <h3>7. Changes to Terms</h3>
        <p>
          We may update these Terms from time to time. Continued use constitutes acceptance of the updated Terms.
        </p>
        <h3>8. Contact</h3>
        <p>
          Questions about these Terms? Contact us at <a href="/contact">Contact Us</a>.
        </p>
      </div>
    </div>
  );
}
