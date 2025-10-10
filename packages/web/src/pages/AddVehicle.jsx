// -----------------------------
// File: web/pages/AddVehicle.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addOrUpdateVehicle } from '../shared/firestoreService';
import AdBanner from '../components/AdBanner';
import { defaultVehicle } from '@vehicle-vitals/shared/types';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { decodeVin } from '../utils/vehicleService';

export default function AddVehicle() {
  const [form, setForm] = useState({ ...defaultVehicle });
  const navigate = useNavigate();
  const { years, makes, models, loadingMakes, loadingModels } = useVehicleOptions({ year: form.year, make: form.make });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await addOrUpdateVehicle(form);
  alert('Vehicle added successfully');
  navigate('/app');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDecodeVin = async () => {
    const vin = (form.vin || '').trim();
    if (!vin) {
      alert('Enter a VIN first');
      return;
    }
    try {
      const { make, model, year } = await decodeVin(vin);
      setForm((prev) => ({
        ...prev,
        make: make || prev.make,
        model: model || prev.model,
        year: year || prev.year,
      }));
    } catch (e) {
      alert(e?.message || 'Failed to decode VIN');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-5">
      <AdBanner />
      <h2 className="font-serif font-bold text-3xl text-charcoal-800 dark:text-cream-100 mb-6">Add Vehicle</h2>
      
      <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-md p-6 space-y-6">
        {/* Year dropdown */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">Year</label>
          <select 
            name="year" 
            value={form.year} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Make dropdown with fallback */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">Make</label>
          <select 
            name="make" 
            value={form.make} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100 disabled:bg-charcoal-100 disabled:cursor-not-allowed" 
            disabled={loadingMakes}
          >
            <option value="">{loadingMakes ? 'Loading makes…' : 'Select Make'}</option>
            {makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Model dropdown depends on year+make */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">Model</label>
          <select 
            name="model" 
            value={form.model} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100 disabled:bg-charcoal-100 disabled:cursor-not-allowed" 
            disabled={!form.year || !form.make || loadingModels}
          >
            <option value="">{loadingModels ? 'Loading models…' : (!form.year || !form.make ? 'Select year & make first' : 'Select Model')}</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* VIN and mileage remain free-form */}
        {['vin', 'mileage'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type="text"
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            />
            {field === 'vin' && (
              <p className="text-xs text-charcoal-600 dark:text-cream-400 mt-1">
                Decode VIN uses the NHTSA VPIC database to prefill Year, Make, and Model. No data is saved until you click Add Vehicle.
              </p>
            )}
          </div>
        ))}
        
        <div>
          <button 
            type="button" 
            onClick={handleDecodeVin}
            className="bg-charcoal-600 hover:bg-charcoal-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Decode VIN
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">Purchase Date</label>
          <input
            type="date"
            name="purchaseDate"
            value={form.purchaseDate || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
          />
        </div>
        
        <div className="pt-4">
          <button 
            onClick={handleSubmit}
            className="w-full bg-oxblood-600 hover:bg-oxblood-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
          >
            Add Vehicle
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <AdBanner />
      </div>
    </div>
  );
}
