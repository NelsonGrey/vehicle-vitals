import { useState } from 'react';
import { useAuth } from '../shared/AuthContext';
import {
  bobDemoVehicleCount,
  seedBobDemo,
  type SeedDetails,
} from '../shared/devSeed';
import { isDevelopmentEnvironment } from '../shared/environment';

export default function DevSeed() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Idle');
  const [details, setDetails] = useState<SeedDetails | null>(null);

  if (!isDevelopmentEnvironment) {
    return (
      <div className="dev-seed-container">
        This seeding page is only available in the development environment.
      </div>
    );
  }

  const uid = user?.uid || '(not signed in)';

  const runSeed = async () => {
    try {
      setStatus('Seeding...');
      const nextDetails = await seedBobDemo({
        uid: user?.uid || '',
        email: user?.email,
      });
      setDetails(nextDetails);
      setStatus('Seed complete: Bob Demo data is ready');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="dev-seed-container">
      <h2>Dev Seed - Bob Demo Scenario</h2>
      <p>UID: {uid}</p>
      <button onClick={runSeed}>
        Seed Bob Demo ({bobDemoVehicleCount} vehicles)
      </button>
      <p className="dev-seed-status">Status: {status}</p>
      {details && (
        <pre className="dev-seed-pre">{JSON.stringify(details, null, 2)}</pre>
      )}
      <p className="dev-seed-note">
        This writes demo data to Firestore for the currently signed-in account:
        profile preferences, 3 vehicles, maintenance history, reminders, and
        document portfolio statuses for records workflows.
      </p>
    </div>
  );
}
