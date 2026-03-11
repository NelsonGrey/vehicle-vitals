// -----------------------------
// File: web/pages/AddVehicle.tsx
import { defaultVehicle } from '@vehicle-vitals/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { addOrUpdateVehicle } from '../shared/firestoreService';
import { buildPersistedVinInsights, decodeVin } from '../utils/vehicleService';

export default function AddVehicle() {
  const [form, setForm] = useState({ ...defaultVehicle });
  const [insights, setInsights] = useState<{
    recallsCount: number;
    recallsSource: string;
    recallsItems: Array<Record<string, unknown>>;
    engineType: string;
    bodyClass: string;
    fuelType: string;
    driveType: string;
    transmissionStyle: string;
    trim: string;
    vehicleType: string;
    vinProfile: Record<string, unknown>;
    rawInsights: Record<string, unknown>;
  } | null>(null);
  const navigate = useNavigate();
  const { years, makes, models, loadingMakes, loadingModels } =
    useVehicleOptions({ year: form.year, make: form.make });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await addOrUpdateVehicle({
        ...form,
        ...(insights
          ? {
              ...buildPersistedVinInsights(insights.rawInsights),
            }
          : {}),
      });
      alert('Vehicle added successfully');
      navigate('/app');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error: ' + error.message);
    }
  };

  const handleDecodeVin = async () => {
    const vin = (form.vin || '').trim();
    if (!vin) {
      alert('Enter a VIN first');
      return;
    }
    try {
      const {
        make,
        model,
        year,
        recallsCount,
        recallsSource,
        engineType,
        bodyClass,
        fuelType,
        driveType,
        transmissionStyle,
        trim,
        vehicleType,
        recallsItems,
        vinProfile,
        rawInsights,
      } = await decodeVin(vin);
      setForm(prev => ({
        ...prev,
        make: make || prev.make,
        model: model || prev.model,
        year: year || prev.year,
      }));
      setInsights({
        recallsCount: Number(recallsCount || 0),
        recallsSource: (recallsSource || 'NHTSA').toString(),
        engineType: (engineType || '').toString(),
        bodyClass: (bodyClass || '').toString(),
        fuelType: (fuelType || '').toString(),
        driveType: (driveType || '').toString(),
        transmissionStyle: (transmissionStyle || '').toString(),
        trim: (trim || '').toString(),
        vehicleType: (vehicleType || '').toString(),
        recallsItems: Array.isArray(recallsItems)
          ? (recallsItems as Array<Record<string, unknown>>)
          : [],
        vinProfile:
          vinProfile && typeof vinProfile === 'object'
            ? (vinProfile as Record<string, unknown>)
            : {},
        rawInsights:
          rawInsights && typeof rawInsights === 'object'
            ? (rawInsights as Record<string, unknown>)
            : {},
      });
    } catch (e: unknown) {
      const error = e as Error;
      alert(error?.message || 'Failed to decode VIN');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-5">
      <h2 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 mb-6">
        Add Vehicle
      </h2>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-6">
        {/* Year dropdown */}
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Year
          </label>
          <select
            id="year"
            name="year"
            value={form.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">Select Year</option>
            {years.map((y: string) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Make dropdown with fallback */}
        <div>
          <label
            htmlFor="make"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Make
          </label>
          <select
            id="make"
            name="make"
            value={form.make}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
            disabled={loadingMakes}
          >
            <option value="">
              {loadingMakes ? 'Loading makes…' : 'Select Make'}
            </option>
            {makes.map((m: string) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Model dropdown depends on year+make */}
        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Model
          </label>
          <select
            id="model"
            name="model"
            value={form.model}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
            disabled={!form.year || !form.make || loadingModels}
          >
            <option value="">
              {loadingModels
                ? 'Loading models…'
                : !form.year || !form.make
                  ? 'Select year & make first'
                  : 'Select Model'}
            </option>
            {models.map((m: string) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* VIN and mileage remain free-form */}
        {(['vin', 'mileage'] as const).map(field => (
          <div key={field}>
            <label
              htmlFor={field}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              id={field}
              type="text"
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            />
            {field === 'vin' && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Decode VIN uses the NHTSA VPIC database to prefill Year, Make,
                and Model. No data is saved until you click Add Vehicle.
              </p>
            )}
          </div>
        ))}

        <div>
          <button
            type="button"
            onClick={handleDecodeVin}
            className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Decode VIN
          </button>
        </div>

        {insights && (
          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              Free Vehicle Insights
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 m-0">
              Open recalls: <strong>{insights.recallsCount}</strong> (source:{' '}
              {insights.recallsSource})
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 m-0">
              {[
                insights.vehicleType,
                insights.engineType,
                insights.bodyClass,
                insights.trim,
                insights.fuelType,
                insights.driveType,
                insights.transmissionStyle,
              ]
                .filter(Boolean)
                .join(' • ') || 'No additional specs returned for this VIN.'}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="purchaseDate"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Purchase Date
          </label>
          <input
            id="purchaseDate"
            type="date"
            name="purchaseDate"
            value={form.purchaseDate || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
          >
            Add Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}
