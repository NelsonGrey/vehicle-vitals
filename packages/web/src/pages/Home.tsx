// -----------------------------
// File: web/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVehicles } from '../shared/firestoreService';
import { deleteVehicle } from '../shared/firestoreService';
import AdBanner from '../components/AdBanner';
import { Vehicle } from '@vehicle-vitals/shared/types';

export default function Home(): JSX.Element {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async (): Promise<void> => {
      const list = await getVehicles();
      setVehicles(list);
    };
    fetchVehicles();
  }, []);

  const handleDelete = async (vin: string): Promise<void> => {
    const ok = window.confirm('Delete this vehicle? This cannot be undone.');
    if (!ok) return;
    try {
      await deleteVehicle(vin);
      const list = await getVehicles();
      setVehicles(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Error deleting vehicle: ' + message);
    }
  };

  return (
    <div className="container">
      <div className="layout-with-sidebar">
        <main>
          <div className="flex items-end justify-between mb-3">
            <h1 className="m-0">Vehicle Vitals</h1>
            <Link to="/add-vehicle" className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium">Add Vehicle</Link>
          </div>
          <div className="my-3">
            <AdBanner style={{}} className="" slot="" />
          </div>
          {vehicles.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg my-4 p-3 shadow-sm">
              <h3 className="text-slate-900 dark:text-slate-100 mb-2">No vehicles yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-2">Get started by adding your first vehicle. You can use VIN decode to speed things up.</p>
              <Link to="/add-vehicle" className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium inline-block">Add your first vehicle</Link>
            </div>
          ) : (
            <div className="row g-3 my-4">
              {vehicles.map((v) => (
                <div key={v.vin} className="col-12 col-md-6">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col gap-2 p-3 shadow-sm">
                    <div>
                      <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">{v.year} {v.make} {v.model}</div>
                      <div className="text-slate-600 dark:text-slate-400 vin-details">VIN: {v.vin}{v.mileage ? ` • ${v.mileage} mi` : ''}</div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Link to={`/edit-vehicle/${v.vin}`} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-md font-medium">Open</Link>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium" onClick={() => handleDelete(v.vin)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <aside className="sidebar-ads">
          <div className="sticky">
            <AdBanner style={{}} className="" slot="" />
          </div>
        </aside>
      </div>
    </div>
  );
}