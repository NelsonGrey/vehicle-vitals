import React, { useState } from 'react';
import { useAuth } from '../shared/AuthContext';
import {
  addOrUpdateVehicle,
  addMaintenanceEntry,
  getVehicles,
  getMaintenanceEntries,
} from '../shared/firestoreService';
import { defaultVehicle } from '@vehicle-vitals/shared/types';

export default function DevSeed() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Idle');
  const [details, setDetails] = useState(null);

  if (!import.meta.env.DEV) {
    return <div style={{ padding: 20 }}>This seeding page is only available in development builds.</div>;
  }

  const uid = user?.uid || '(not signed in)';

  const runSeed = async () => {
    try {
      if (!user?.uid) {
        setStatus('Please sign in (enable Anonymous sign-in for dev), then reload this page.');
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
      setDetails({ vehiclesCount: vehicles.length, maintenanceCount: maint.length });
      setStatus('Seed complete');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err?.message || String(err)));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Dev Seed</h2>
      <p>UID: {uid}</p>
      <button onClick={runSeed}>Seed sample data</button>
      <p style={{ marginTop: 12 }}>Status: {status}</p>
      {details && (
        <pre style={{ background: '#f7f7f7', padding: 12 }}>
{JSON.stringify(details, null, 2)}
        </pre>
      )}
      <p style={{ marginTop: 8, color: '#777' }}>
        This page writes to Firestore to create the expected collections (users/uid/vehicles, .../maintenance).
        Remove this route before production if you don’t want it exposed.
      </p>
    </div>
  );
}
