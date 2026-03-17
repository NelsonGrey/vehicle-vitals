// -----------------------------
// File: web/pages/AddVehicle.tsx
import { defaultVehicle } from '@vehicle-vitals/shared';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { addOrUpdateVehicle } from '../shared/firestoreService';
import { buildPersistedVinInsights, decodeVin } from '../utils/vehicleService';

export default function AddVehicle() {
  const [form, setForm] = useState({ ...defaultVehicle });
  const [plateValidationError, setPlateValidationError] = useState<string>();
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

    // Special handling for license plate: normalize and validate
    if (name === 'licensePlate') {
      const normalized = normalizeLicensePlate(value);
      const validation = validateLicensePlate(normalized);
      setPlateValidationError(validation.error);
      setForm(prev => ({ ...prev, [name]: normalized }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
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
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 m-0">
            Add Vehicle
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
            Capture a vehicle profile, decode the VIN, and store backfilled
            specs before saving.
          </p>
        </div>
        <Link
          to="/app"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Vehicle Setup
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Year
              </label>
              <select
                id="year"
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Select Year</option>
                {years.map((y: string) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="make"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Make
              </label>
              <select
                id="make"
                name="make"
                value={form.make}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
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

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Model
              </label>
              <select
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
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

            {(['vin', 'licensePlate', 'mileage'] as const).map(field => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                >
                  {field === 'licensePlate'
                    ? 'License Plate'
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={field}
                  type="text"
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder={
                    field === 'vin'
                      ? 'Vehicle Identification Number'
                      : field === 'licensePlate'
                        ? 'Plate number (optional)'
                        : 'Current mileage'
                  }
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 ${
                    field === 'licensePlate' && plateValidationError
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {field === 'vin' && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Decode VIN fills the year, make, model, specs, and recall
                    data before save.
                  </p>
                )}
                {field === 'licensePlate' && plateValidationError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {plateValidationError}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label
                htmlFor="purchaseDate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Purchase Date
              </label>
              <input
                id="purchaseDate"
                type="date"
                name="purchaseDate"
                value={form.purchaseDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDecodeVin}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Decode VIN
              </button>
              <button
                onClick={handleSubmit}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                Add Vehicle
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Decode Preview
          </h3>

          {!insights ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
              Decode a VIN to preview the vehicle profile, recall count, and
              spec fields that will be saved with this record.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-1">
                    {form.year || 'Year'} {form.make || 'Make'}{' '}
                    {form.model || 'Model'}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                    VIN {form.vin || 'not provided yet'}
                  </p>
                </div>
                <span className="inline-block rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2.5 py-1 text-xs font-medium">
                  {insights.recallsCount} recall
                  {insights.recallsCount === 1 ? '' : 's'}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0 mb-3">
                  Vehicle specifications
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['Vehicle Type', insights.vehicleType],
                    ['Body Class', insights.bodyClass],
                    ['Engine Type', insights.engineType],
                    ['Fuel Type', insights.fuelType],
                    ['Drive Type', insights.driveType],
                    ['Transmission', insights.transmissionStyle],
                    ['Trim', insights.trim],
                    ['Recalls Source', insights.recallsSource],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 m-0">
                        {value || 'Not returned'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0 mb-3">
                  Recall details
                </p>
                {insights.recallsItems.length === 0 ? (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    No active recalls returned for this VIN.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                    {insights.recallsItems.map((item, index) => (
                      <div
                        key={`${index}-${String(item.NHTSACampaignNumber || item.campaignNumber || 'recall')}`}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0 mb-1">
                          {(
                            item.NHTSACampaignNumber ||
                            item.campaignNumber ||
                            'Recall'
                          ).toString()}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 m-0">
                          {(
                            item.Component ||
                            item.component ||
                            'Component not provided'
                          ).toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
