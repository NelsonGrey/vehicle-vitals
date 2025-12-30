import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
// Header and footer provided by Layout

export default function Instructions() {
  return (
    <div>
      <div className="container medium">
        <AdBanner />
        <h1>Instructions</h1>
        <p>Follow these steps to get started with Vehicle Vitals:</p>
        <ol>
          <li>Open the <Link to="/app">web app</Link> and sign in.</li>
          <li>Add your first vehicle by entering a VIN or selecting Year, Make, and Model.</li>
          <li>Log maintenance entries with date, title, notes, and cost.</li>
          <li>Return anytime to review history and plan upcoming service.</li>
        </ol>
        <h3>Mobile Apps</h3>
        <p>
          Our iOS and Android apps sync with your account so you can scan a VIN, update mileage, and add notes on the go.
          Store listings are coming soon.
        </p>
        <p>
          Need help? <Link to="/contact">Contact us</Link>.
        </p>
      </div>
    </div>
  );
}
