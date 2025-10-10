// -----------------------------
// File: web/pages/EditVehicle.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVehicle, updateVehicle, getMaintenanceEntries, addMaintenanceEntry, deleteVehicle } from '../shared/firestoreService';
import AdBanner from '../components/AdBanner';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { decodeVin } from '../utils/vehicleService';

export default function EditVehicle() {
  const { vin } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const { years, makes, models, loadingMakes, loadingModels } = useVehicleOptions({ year: form?.year, make: form?.make });

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vin) return;
      const v = await getVehicle(vin);
      setForm(v);
    };
    fetchVehicle();
  }, [vin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await updateVehicle(vin, form);
      alert('Vehicle updated successfully');
      navigate('/');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDecodeVin = async () => {
    const v = (form.vin || '').trim();
    if (!v) {
      alert('Enter a VIN first');
      return;
    }
    try {
      const { make, model, year } = await decodeVin(v);
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

  const handleDelete = async () => {
    const ok = window.confirm('Delete this vehicle? This will remove all vehicle data.');
    if (!ok) return;
    try {
      // deleteVehicle imported from shared service
      await deleteVehicle(vin);
      alert('Vehicle deleted');
      navigate('/');
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  if (!form) return (
    <div className="max-w-2xl mx-auto px-5 py-5">
      <p className="text-charcoal-600 dark:text-cream-300">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-5 py-5">
      <AdBanner />
      <h2 className="font-serif font-bold text-3xl text-charcoal-800 dark:text-cream-100 mb-6">Edit Vehicle</h2>
      
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
            {form.year && !years.includes(String(form.year)) && (
              <option value={form.year}>Current: {form.year}</option>
            )}
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Make dropdown */}
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
            {form.make && !makes.includes(form.make) && (
              <option value={form.make}>Current: {form.make}</option>
            )}
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
            {form.model && !models.includes(form.model) && (
              <option value={form.model}>Current: {form.model}</option>
            )}
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* VIN and mileage text inputs */}
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
                Decode VIN uses the NHTSA VPIC database to prefill Year, Make, and Model. Changes aren't saved until you click Save Changes.
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
        
        <div className="flex gap-3 pt-4">
          <button 
            onClick={handleUpdate}
            className="flex-1 bg-oxblood-600 hover:bg-oxblood-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
          >
            Save Changes
          </button>
          <button 
            onClick={handleDelete}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-md transition-colors duration-200 border border-red-300"
          >
            Delete Vehicle
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <AdBanner />
      </div>
      
      <div className="mt-8">
        <h3 className="font-serif font-bold text-2xl text-charcoal-800 dark:text-cream-100 mb-4">Maintenance</h3>
        <MaintenanceList vin={vin} />
      </div>
    </div>
  );
}

function MaintenanceList({ vin }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ title: '', notes: '', cost: '' });

  useEffect(() => {
    const load = async () => {
      const list = await getMaintenanceEntries(vin);
      setEntries(list);
    };
    load();
  }, [vin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    try {
      const entry = { ...form, date: new Date().toISOString() };
      await addMaintenanceEntry(vin, entry);
      const list = await getMaintenanceEntries(vin);
      setEntries(list);
      setForm({ title: '', notes: '', cost: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-md p-6">
      <ul className="space-y-4 mb-6">
        {entries.map((e) => (
          <li key={e.id} className="border-b border-charcoal-200 dark:border-charcoal-600 pb-3">
            <div className="flex justify-between items-start mb-1">
              <strong className="text-charcoal-800 dark:text-cream-100">{e.title}</strong>
              <span className="text-sm text-charcoal-600 dark:text-cream-300">{e.date?.split('T')[0]}</span>
            </div>
            <div className="text-sm text-charcoal-600 dark:text-cream-300 mb-1">${e.cost}</div>
            <div className="text-xs text-charcoal-500 dark:text-cream-400">{e.notes}</div>
          </li>
        ))}
      </ul>
      
      <div className="border-t border-charcoal-200 dark:border-charcoal-600 pt-4">
        <h4 className="font-serif font-bold text-xl text-charcoal-800 dark:text-cream-100 mb-4">Add Entry</h4>
        <div className="space-y-4">
          <div className="flex gap-3">
            <input 
              name="title" 
              placeholder="Title" 
              value={form.title} 
              onChange={handleChange} 
              className="flex-1 px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            />
            <input 
              name="cost" 
              placeholder="Cost" 
              value={form.cost} 
              onChange={handleChange} 
              className="w-24 px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            />
          </div>
          <div>
            <textarea 
              name="notes" 
              placeholder="Notes" 
              value={form.notes} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            />
          </div>
          <button 
            onClick={handleAdd}
            className="bg-oxblood-600 hover:bg-oxblood-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Add Maintenance
          </button>
        </div>
      </div>
    </div>
  );
}
