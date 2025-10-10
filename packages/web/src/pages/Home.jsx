// -----------------------------
// File: web/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVehicles } from '../shared/firestoreService';
import { deleteVehicle } from '../shared/firestoreService';
import AdBanner from '../components/AdBanner';

export default function Home() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const list = await getVehicles();
      setVehicles(list);
    };
    fetchVehicles();
  }, []);

  const handleDelete = async (vin) => {
    const ok = window.confirm('Delete this vehicle? This cannot be undone.');
    if (!ok) return;
    try {
      await deleteVehicle(vin);
      const list = await getVehicles();
      setVehicles(list);
    } catch (err) {
      alert('Error deleting vehicle: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <main>
          <div className="flex items-end justify-between mb-3">
            <h1 className="font-serif font-bold text-4xl text-charcoal dark:text-light-cream m-0">Vehicle Vitals</h1>
            <Link 
              to="/add-vehicle" 
              className="inline-block px-4 py-2.5 bg-oxblood text-primary-contrast dark:bg-rust dark:text-deep-brown rounded-lg border border-oxblood dark:border-rust hover:opacity-90 transition-opacity no-underline font-medium"
            >
              Add Vehicle
            </Link>
          </div>
          <div className="my-3">
            <AdBanner />
          </div>
          {vehicles.length === 0 ? (
            <div className="bg-parchment dark:bg-dark-card p-4 rounded-xl border border-tan dark:border-dark-border my-4">
              <h3 className="font-serif font-semibold text-xl text-charcoal dark:text-light-cream mb-2">No vehicles yet</h3>
              <p className="text-warm-gray dark:text-light-gray mb-3">Get started by adding your first vehicle. You can use VIN decode to speed things up.</p>
              <Link 
                to="/add-vehicle" 
                className="inline-block px-4 py-2.5 bg-oxblood text-primary-contrast dark:bg-rust dark:text-deep-brown rounded-lg border border-oxblood dark:border-rust hover:opacity-90 transition-opacity no-underline font-medium"
              >
                Add your first vehicle
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
              {vehicles.map((v) => (
                <div key={v.vin} className="bg-parchment dark:bg-dark-card p-4 rounded-xl border border-tan dark:border-dark-border flex flex-col gap-2">
                  <div>
                    <div className="font-semibold text-lg text-charcoal dark:text-light-cream">{v.year} {v.make} {v.model}</div>
                    <div className="text-warm-gray dark:text-light-gray text-sm">VIN: {v.vin}{v.mileage ? ` • ${v.mileage} mi` : ''}</div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link 
                      to={`/edit-vehicle/${v.vin}`} 
                      className="inline-block px-3 py-2 bg-transparent border border-tan dark:border-dark-border text-charcoal dark:text-light-cream rounded-lg hover:bg-tan/10 dark:hover:bg-dark-border/20 transition-colors no-underline text-sm"
                    >
                      Open
                    </Link>
                    <button 
                      className="px-3 py-2 bg-danger text-white border border-danger rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer" 
                      onClick={() => handleDelete(v.vin)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <AdBanner />
          </div>
        </aside>
      </div>
    </div>
  );
}
