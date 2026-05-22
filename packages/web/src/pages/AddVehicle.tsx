// -----------------------------
// File: web/pages/AddVehicle.tsx
import { defaultVehicle } from '@vehicle-vitals/shared';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { addOrUpdateVehicle, getVehicles } from '../shared/firestoreService';
import {
  normalizeLicensePlate,
  validateLicensePlate,
} from '../shared/licensePlateUtils';
import {
  useSubscription,
  useUpgradePrompt,
  useVehicleLimit,
} from '../shared/useMonetization';
import { buildPersistedVinInsights, decodeVin } from '../utils/vehicleService';

const VEHICLE_TYPE_OPTIONS = [
  'Car',
  'Truck',
  'Motorcycle',
  'Recreational Vehicle (RV)',
  'Boat',
  'Van',
  'SUV',
  'Trailer',
  'ATV/UTV',
  'Other',
];

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
  const { tier } = useSubscription();
  const vehicleLimit = useVehicleLimit();
  const { shouldShowModal, targetTier, openUpgradeModal, closeUpgradeModal } =
    useUpgradePrompt();
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
    const trimmedVin = (form.vin || '').trim();
    if (!trimmedVin) {
      alert('A vehicle ID (VIN/HIN/Serial) is required before saving.');
      return;
    }

    try {
      let existingVehicles: Array<{ vin?: string }> = [];
      try {
        existingVehicles = (await getVehicles()) as Array<{ vin?: string }>;
      } catch {
        existingVehicles = [];
      }
      const alreadyExists = existingVehicles.some(
        vehicle => (vehicle?.vin || '').trim() === trimmedVin
      );

      if (!alreadyExists && existingVehicles.length >= vehicleLimit) {
        const requiredTier = tier === 'free' ? 'pro' : 'premium';
        openUpgradeModal(requiredTier, 'vehicle_limit_add_vehicle');
        return;
      }

      await addOrUpdateVehicle({
        ...form,
        vin: trimmedVin,
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
      alert(
        'Enter a VIN first for decode. For non-VIN assets, you can still track with Year/Make/Model and a vehicle ID.'
      );
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
        vehicleType: vehicleType || prev.vehicleType,
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
      alert(
        error?.message ||
          'VIN lookup could not return vehicle details. Review the VIN and continue by filling any missing fields manually.'
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 m-0">
            Add Vehicle
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
            Enter a vehicle ID (VIN/HIN/Serial). VIN decode is available for
            compatible vehicles, and you can complete details manually for all
            vehicle types.
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
                htmlFor="vehicleType"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Vehicle Type
              </label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={form.vehicleType || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Select Vehicle Type</option>
                {VEHICLE_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>
                    {type}
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
                    : field === 'vin'
                      ? 'Vehicle ID (VIN/HIN/Serial)'
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
                      ? 'VIN, HIN, or serial number'
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
                    A vehicle ID is required to save. VIN decode can fill year,
                    make, model, specs, and recall data for compatible VIN
                    assets, and you can edit missing fields before saving.
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
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                Decode is optional. A vehicle ID remains the primary identifier.
              </p>
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
              spec fields that will be saved with this vehicle. If lookup is
              incomplete, update the form manually and continue.
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

      <UpgradeModal
        isOpen={shouldShowModal}
        currentTier={tier}
        targetTier={targetTier || 'pro'}
        trigger="vehicle_limit_add_vehicle"
        onClose={closeUpgradeModal}
      />
    </div>
  );
}
