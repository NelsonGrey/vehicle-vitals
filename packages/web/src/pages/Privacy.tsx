import AdBanner from '../components/AdBanner';
// Header and footer provided by Layout

export default function Privacy() {
  return (
    <div>
      <div className="container">
        <AdBanner />
        <h1>Privacy Policy</h1>
        <p>Last updated: September 30, 2025</p>
        <h3>Information We Collect</h3>
        <ul>
          <li>Account information (e.g., email, authentication identifiers)</li>
          <li>Vehicle data (VIN, make, model, year, mileage)</li>
          <li>Maintenance entries (dates, notes, costs)</li>
          <li>Usage data (device/browser metadata) to improve the service</li>
        </ul>
        <h3>How We Use Information</h3>
        <ul>
          <li>Provide and improve the service</li>
          <li>Sync your data across web and mobile apps</li>
          <li>Communicate with you about updates and support</li>
        </ul>
        <h3>Data Sharing</h3>
        <p>
          We do not sell your personal data. We may share data with service providers (e.g., hosting, analytics) under agreements that protect your information.
        </p>
        <h3>Data Security</h3>
        <p>
          We use industry-standard measures to protect your data. No method of transmission or storage is 100% secure.
        </p>
        <h3>Your Choices</h3>
        <ul>
          <li>Access, update, or delete your data via the app</li>
          <li>Contact us to make a privacy request</li>
        </ul>
        <h3>Contact</h3>
        <p>
          Questions about privacy? Visit <a href="/contact">Contact Us</a>.
        </p>
      </div>
    </div>
  );
}
