import { defaultVehicle } from '@vehicle-vitals/shared';
import { useState } from 'react';
import { useAuth } from '../shared/AuthContext';
import {
  addMaintenanceEntry,
  addOrUpdateVehicle,
  getMaintenanceEntries,
  getVehicles,
} from '../shared/firestoreService';

interface SeedDetails {
  vehiclesCount: number;
  maintenanceCount: number;
}

export default function DevSeed() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Idle');
  const [details, setDetails] = useState<SeedDetails | null>(null);

  if (!import.meta.env.DEV) {
    return (
      <div className="dev-seed-container">
        This seeding page is only available in development builds.
      </div>
    );
  }

  const uid = user?.uid || '(not signed in)';

  const runSeed = async () => {
    try {
      if (!user?.uid) {
        setStatus(
          'Please sign in (enable Anonymous sign-in for dev), then reload this page.'
        );
        return;
      }
      setStatus('Seeding...');

      const vehicle = {
        ...defaultVehicle,
        vin: 'SEEDVIN0001',
        make: 'Toyota',
        model: 'Camry',
        year: '2018',
        mileage: '45000',
        purchaseDate: '2018-06-15',
      };

      await addOrUpdateVehicle(vehicle);
      await addMaintenanceEntry(vehicle.vin, {
        title: 'Oil Change',
        notes: 'Seeded entry',
        cost: 39.99,
        date: new Date().toISOString(),
      });

      const vehicles = await getVehicles();
      const maint = await getMaintenanceEntries(vehicle.vin);
      setDetails({
        vehiclesCount: vehicles.length,
        maintenanceCount: maint.length,
      });
      setStatus('Seed complete');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="dev-seed-container">
      <h2>Dev Seed</h2>
      <p>UID: {uid}</p>
      <button onClick={runSeed}>Seed sample data</button>
      <p className="dev-seed-status">Status: {status}</p>
      {details && (
        <pre className="dev-seed-pre">{JSON.stringify(details, null, 2)}</pre>
      )}
      <p className="dev-seed-note">
        This page writes to Firestore to create the expected collections
        (users/uid/vehicles, .../maintenance). Remove this route before
        production if you don&apos;t want it exposed.
      </p>
    </div>
  );
}
