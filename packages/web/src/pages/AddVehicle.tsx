// -----------------------------
// File: web/pages/AddVehicle.tsx
import { defaultVehicle } from '@vehicle-vitals/shared';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { addOrUpdateVehicle, getVehicles } from '../shared/firestoreService';
import {
  normalizeLicensePlate,
  validateLicensePlate,
} from '../shared/licensePlateUtils';
import { generateVehiclePhotoPath, uploadFile } from '../shared/storageService';
import {
  useSubscription,
  useUpgradePrompt,
  useVehicleLimit,
} from '../shared/useMonetization';
import { findVehiclePhotoFromWeb } from '../utils/vehiclePhotoService';
import { buildPersistedVinInsights, lookupVin } from '../utils/vehicleService';
import {
  detectVehicleIdentifierType,
  getVinLookupValidationError,
} from '../utils/vinValidation';

const VEHICLE_TYPE_OPTIONS = [
  'ATVs / UTVs',
  'Automobiles',
  'Boats',
  'Motorcycles',
  'RVs',
  'SUVs',
  'Trailers',
  'Trucks',
  'Vans',
  'Other',
].sort((a, b) => a.localeCompare(b));

const VEHICLE_SUBTYPE_OPTIONS: Record<string, string[]> = {
  RVs: ['Camping / Travel Trailer', 'Fifth Wheel', 'Motorhome', 'Other RV'].sort(
    (a, b) => a.localeCompare(b)
  ),
  Trailers: [
    'Boat Trailer',
    'Camping / Travel Trailer',
    'Horse Trailer',
    'Utility Trailer',
    'Other Trailer',
  ].sort((a, b) => a.localeCompare(b)),
};

const AUTOMOBILE_MAKES = [
  'Acura',
  'Audi',
  'BMW',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ford',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jeep',
  'Kia',
  'Lexus',
  'Lincoln',
  'Mazda',
  'Mercedes-Benz',
  'Nissan',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
].sort((a, b) => a.localeCompare(b));

const VEHICLE_STATUS_OPTIONS = [
  { value: 'active', label: 'In Garage' },
  { value: 'stored', label: 'In Storage' },
];

const sanitizeImageUrl = (value: unknown): string => {
  const raw = (value || '').toString().trim();
  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'blob:') {
      return raw;
    }
  } catch {
    return '';
  }

  return '';
};

export default function AddVehicle() {
  const [form, setForm] = useState({
    ...defaultVehicle,
    vehicleType: 'Automobiles',
  });
  const [plateValidationError, setPlateValidationError] = useState<string>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [makeQuery, setMakeQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
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
  const { years, makes, models, loadingModels } = useVehicleOptions({
    year: form.year,
    make: form.make,
  });
  const sortedYears = useMemo(
    () => [...years].sort((a, b) => a.localeCompare(b)),
    [years]
  );
  const sortedMakes = useMemo(() => {
    const source = form.vehicleType === 'Automobiles' ? AUTOMOBILE_MAKES : makes;
    return [...source].sort((a, b) => a.localeCompare(b));
  }, [form.vehicleType, makes]);
  const sortedModels = useMemo(
    () => [...models].sort((a, b) => a.localeCompare(b)),
    [models]
  );
  const subtypeOptions = VEHICLE_SUBTYPE_OPTIONS[form.vehicleType] || [];
  const detectedIdentifierType = detectVehicleIdentifierType(
    form.vin || '',
    (form as any).vehicleType
  );
  const detectedIdentifierLabel =
    detectedIdentifierType === 'vin'
      ? 'VIN'
      : detectedIdentifierType === 'hin'
        ? 'HIN'
        : detectedIdentifierType === 'serial'
          ? 'Serial/Other'
          : 'Not detected';

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
    } else if (name === 'vehicleType') {
      setForm(prev => ({
        ...prev,
        vehicleType: value,
        make: value !== prev.vehicleType ? '' : prev.make,
        model: value !== prev.vehicleType ? '' : prev.model,
        vehicleSubtype: value !== prev.vehicleType ? '' : (prev as any).vehicleSubtype,
      }));
      setMakeQuery('');
      setModelQuery('');
    } else if (name === 'vehicleSubtype') {
      setForm(prev => ({ ...prev, vehicleSubtype: value }));
    } else if (name === 'make') {
      setForm(prev => ({ ...prev, [name]: value, model: '' }));
      setMakeQuery(value);
      setModelQuery('');
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({
      ...defaultVehicle,
      vehicleType: 'Automobiles',
    });
    setMakeQuery('');
    setModelQuery('');
    setPlateValidationError(undefined);
    setInsights(null);
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

      let resolvedPhoto = {
        photoUrl: (form as any).photoUrl || '',
        photoSource: (form as any).photoSource || '',
        photoAttributionUrl: (form as any).photoAttributionUrl || '',
        photoAttributionText: (form as any).photoAttributionText || '',
      };

      if (!resolvedPhoto.photoUrl) {
        const candidate = await findVehiclePhotoFromWeb({
          year: form.year,
          make: form.make,
          model: form.model,
          vehicleType: (form as any).vehicleType,
        });
        if (candidate) {
          resolvedPhoto = {
            photoUrl: candidate.url,
            photoSource: candidate.source,
            photoAttributionUrl: candidate.attributionUrl || '',
            photoAttributionText: candidate.attributionText || '',
          };
        }
      }

      await addOrUpdateVehicle({
        ...form,
        vin: trimmedVin,
        ...resolvedPhoto,
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

  const handleLookupVin = async () => {
    const vin = (form.vin || '').trim();
    if (!vin) {
      alert(
        'Enter a vehicle ID first to look up details. For non-VIN assets, you can still track with Year/Make/Model and a vehicle ID.'
      );
      return;
    }

    const identifierType = detectVehicleIdentifierType(
      vin,
      (form as any).vehicleType
    );
    if (identifierType !== 'vin') {
      const detectedTypeLabel =
        identifierType === 'hin' ? 'HIN' : 'Serial/Other';
      alert(
        `VIN lookup currently supports VIN only. Detected ${detectedTypeLabel}. You can still save this vehicle ID and complete details manually.`
      );
      return;
    }

    const vinValidationError = getVinLookupValidationError(vin);
    if (vinValidationError) {
      alert(vinValidationError);
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
      } = await lookupVin(vin);
      setForm(prev => ({
        ...prev,
        make: make || prev.make,
        model: model || prev.model,
        year: year || prev.year,
        vehicleType: vehicleType || prev.vehicleType,
      }));
      if (make) {
        setMakeQuery(make);
      }
      if (model) {
        setModelQuery(model);
      }
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
          'Vehicle lookup could not return details. Review the vehicle ID and continue by filling any missing fields manually.'
      );
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const trimmedVin = (form.vin || '').trim();
    if (!trimmedVin) {
      alert('Enter a vehicle ID before uploading a photo.');
      event.target.value = '';
      return;
    }

    setPhotoBusy(true);
    try {
      const path = await generateVehiclePhotoPath(trimmedVin, file.name);
      const uploaded = await uploadFile(file, path);
      setForm(prev => ({
        ...prev,
        photoUrl: uploaded.url,
        photoPath: uploaded.path,
        photoSource: 'user_upload',
        photoAttributionUrl: '',
        photoAttributionText: '',
      }));
    } catch (error) {
      alert(
        'Failed to upload photo: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setPhotoBusy(false);
      event.target.value = '';
    }
  };

  const handleAutoPhotoLookup = async () => {
    if (!form.make || !form.model) {
      alert(
        'Provide at least make and model before searching for a web photo.'
      );
      return;
    }

    setPhotoBusy(true);
    try {
      const candidate = await findVehiclePhotoFromWeb({
        year: form.year,
        make: form.make,
        model: form.model,
        vehicleType: (form as any).vehicleType,
      });

      if (!candidate) {
        alert('No web photo match was found. You can upload your own image.');
        return;
      }

      setForm(prev => ({
        ...prev,
        photoUrl: candidate.url,
        photoPath: '',
        photoSource: candidate.source,
        photoAttributionUrl: candidate.attributionUrl || '',
        photoAttributionText: candidate.attributionText || '',
      }));
    } catch (error) {
      alert(
        'Web photo lookup failed: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setPhotoBusy(false);
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
            Enter a vehicle ID (VIN/HIN/Serial). We can look up details for some
            vehicles, and you can fill everything in by hand for any vehicle
            type.
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
          <button
            type="button"
            onClick={resetForm}
            className="mb-4 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Reset / Clear
          </button>

          <div className="space-y-4">
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
                value={form.vehicleType || 'Automobiles'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                {VEHICLE_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {subtypeOptions.length > 0 ? (
              <div>
                <label
                  htmlFor="vehicleSubtype"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                >
                  Vehicle Subtype
                </label>
                <select
                  id="vehicleSubtype"
                  name="vehicleSubtype"
                  value={(form as any).vehicleSubtype || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Subtype</option>
                  {subtypeOptions.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                  Motorhome is a subtype of RV. Camping and travel trailers are
                  tracked separately so maintenance estimates stay specific.
                </p>
              </div>
            ) : null}

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
                {sortedYears.map((y: string) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="vin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Vehicle ID (VIN/HIN/Serial)
              </label>
              <input
                id="vin"
                type="text"
                name="vin"
                value={form.vin}
                onChange={handleChange}
                placeholder="VIN, HIN, or serial number"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                A vehicle ID is required to save. Vehicle lookup can fill year,
                make, model, specs, and recall data for compatible vehicles, and
                you can edit missing fields before saving.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                Identifier type detected: {detectedIdentifierLabel}. Lookup
                currently supports VIN only.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleLookupVin}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                VIN Lookup
              </button>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                Optional lookup. You can continue manually if you prefer.
              </p>
            </div>

            <div>
              <label
                htmlFor="make"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Make
              </label>
              <input
                id="make"
                name="make"
                value={form.make}
                onChange={event => {
                  setMakeQuery(event.target.value);
                  handleChange(event);
                }}
                list="make-options"
                placeholder={
                  form.vehicleType === 'Automobiles'
                    ? 'Automobile Manufacturers'
                    : 'Type to search makes'
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              />
              <datalist id="make-options">
                {sortedMakes.map((m: string) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  Type to search and pick from the alphabetical list.
                </p>
                {makeQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMakeQuery('');
                      setForm(prev => ({ ...prev, make: '' }));
                    }}
                    className="text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Model
              </label>
              <input
                id="model"
                name="model"
                value={form.model}
                onChange={event => {
                  setModelQuery(event.target.value);
                  handleChange(event);
                }}
                list="model-options"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!form.year || !form.make || loadingModels}
                placeholder={
                  loadingModels
                    ? 'Loading models…'
                    : !form.year || !form.make
                      ? 'Select year & make first'
                      : 'Type to search models'
                }
              />
              <datalist id="model-options">
                {sortedModels.map((m: string) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  Models are sorted alphabetically.
                </p>
                {modelQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModelQuery('');
                      setForm(prev => ({ ...prev, model: '' }));
                    }}
                    className="text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="vehicleStatus"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Location Status
              </label>
              <select
                id="vehicleStatus"
                name="vehicleStatus"
                value={(form as any).vehicleStatus || 'active'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                {VEHICLE_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                Move special-use vehicles into storage so they appear separately
                from your active garage.
              </p>
            </div>

            <div>
              <label
                htmlFor="licensePlate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                License Plate
              </label>
              <input
                id="licensePlate"
                type="text"
                name="licensePlate"
                value={form.licensePlate}
                onChange={handleChange}
                placeholder="Plate number (optional)"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 ${
                  plateValidationError
                    ? 'border-danger-300 dark:border-danger-600'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {plateValidationError && (
                <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">
                  {plateValidationError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="mileage"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Mileage
              </label>
              <input
                id="mileage"
                type="text"
                name="mileage"
                value={form.mileage}
                onChange={handleChange}
                placeholder="Current mileage"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Vehicle Photo
              </label>
              {sanitizeImageUrl((form as any).photoUrl) ? (
                <div className="mb-2 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                  <p className="m-0 text-sm text-slate-700 dark:text-slate-300">
                    Photo attached and will be saved with this vehicle.
                  </p>
                  {(form as any).photoSource === 'wikimedia' && (
                    <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Source: Wikimedia
                    </p>
                  )}
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handlePhotoUpload}
                disabled={photoBusy}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              />
                <button
                  type="button"
                  onClick={handleAutoPhotoLookup}
                  disabled={photoBusy}
                  className="w-full bg-slate-500 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-60"
                >
                  Find Free Web Photo (Beta)
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                Web photos use public Wikimedia results and may not always be an
                exact trim match.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSubmit}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                Add Vehicle
              </button>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                Lookup is optional. A vehicle ID remains the primary identifier.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Lookup Preview
          </h3>

          {!insights ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
              Lookup a VIN to preview the vehicle profile, recall count, and
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
                <span className="inline-block rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200 px-2.5 py-1 text-xs font-medium">
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
                  <div className="rounded-lg bg-accent-50 dark:bg-accent-900/20 p-3 text-sm text-accent-700 dark:text-accent-300">
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
