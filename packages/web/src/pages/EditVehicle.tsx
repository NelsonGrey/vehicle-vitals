// -----------------------------
// File: web/pages/EditVehicle.jsx
import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useVehicleOptions from '../hooks/useVehicleOptions';
import { formatFileDisplay } from '../shared/fileUtils';
import {
  addMaintenanceEntry,
  deleteVehicle,
  getAttachmentAnalyses,
  getMaintenanceEntries,
  getVehicle,
  updateVehicle,
} from '../shared/firestoreService';
import {
  generateMaintenanceAttachmentPath,
  uploadFile,
} from '../shared/storageService';
import { analyzeAttachmentText } from '../utils/attachmentAnalysisService';
import { createMaintenanceCalendarEvent } from '../utils/calendarService';
import { decodeVin } from '../utils/vehicleService';

interface VinInsights {
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  bodyClass?: string;
  engineType?: string;
  fuelType?: string;
  driveType?: string;
  transmissionStyle?: string;
  trim?: string;
  vehicleType?: string;
}

interface Recall {
  campaignNumber?: string;
  reportReceivedDate?: string;
  component?: string;
  summary?: string;
  consequence?: string;
  remedy?: string;
  manufacturer?: string;
}

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  licensePlate?: string;
  mileage: string;
  purchaseDate?: string;
  engineType?: string;
  bodyClass?: string;
  fuelType?: string;
  driveType?: string;
  transmissionStyle?: string;
  trim?: string;
  vehicleType?: string;
  recallsCount?: number;
  recallsSource?: string;
  recallsItems?: Recall[];
  vinProfile?: VinInsights;
  insightsUpdatedAt?: string;
}

interface MaintenanceEntry {
  id: string;
  title: string;
  notes: string;
  cost: string;
  date: string;
  attachments?: Array<{
    name: string;
    url: string;
    path?: string;
    type?: string;
    analysis?: {
      extracted?: {
        serviceType?: string;
        totalCost?: number;
        serviceDate?: string;
        mileage?: number;
      };
      confidence?: number;
    };
  }>;
}

export default function EditVehicle() {
  const { vin } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const maintenancePrefill = (location.state as any)?.maintenancePrefill as
    | { title?: string; cost?: string; date?: string; mileage?: string }
    | undefined;
  const [form, setForm] = useState<Vehicle | null>(null);
  const [plateValidationError, setPlateValidationError] = useState<string>();
  const { years, makes, models, loadingMakes, loadingModels } =
    useVehicleOptions({ year: form?.year, make: form?.make });

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vin) return;
      const v = await getVehicle(vin);
      setForm(v);
    };
    fetchVehicle();
  }, [vin]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Special handling for license plate: normalize and validate
    if (name === 'licensePlate') {
      const normalized = normalizeLicensePlate(value);
      const validation = validateLicensePlate(normalized);
      setPlateValidationError(validation.error);
      setForm(prev => (prev ? { ...prev, [name]: normalized } : null));
    } else {
      setForm(prev => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const handleUpdate = async () => {
    try {
      await updateVehicle(vin, form);
      alert('Vehicle updated successfully');
      navigate('/');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDecodeVin = async () => {
    if (!form) return;
    const v = (form.vin || '').trim();
    if (!v) {
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
      } = await decodeVin(v);
      setForm(prev =>
        prev
          ? {
              ...prev,
              make: make || prev.make,
              model: model || prev.model,
              year: year || prev.year,
              recallsCount:
                typeof recallsCount === 'number'
                  ? recallsCount
                  : prev.recallsCount,
              recallsSource:
                typeof recallsSource === 'string' && recallsSource
                  ? recallsSource
                  : prev.recallsSource,
              engineType:
                typeof engineType === 'string' ? engineType : prev.engineType,
              bodyClass:
                typeof bodyClass === 'string' ? bodyClass : prev.bodyClass,
              fuelType: typeof fuelType === 'string' ? fuelType : prev.fuelType,
              driveType:
                typeof driveType === 'string' ? driveType : prev.driveType,
              transmissionStyle:
                typeof transmissionStyle === 'string'
                  ? transmissionStyle
                  : prev.transmissionStyle,
              trim: typeof trim === 'string' ? trim : prev.trim,
              vehicleType:
                typeof vehicleType === 'string'
                  ? vehicleType
                  : prev.vehicleType,
              recallsItems: Array.isArray(recallsItems)
                ? (recallsItems as Recall[])
                : prev.recallsItems,
              vinProfile:
                vinProfile && typeof vinProfile === 'object'
                  ? (vinProfile as VinInsights)
                  : prev.vinProfile,
              insightsUpdatedAt: new Date().toISOString(),
            }
          : null
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to decode VIN');
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      'Delete this vehicle? This will remove all vehicle data.'
    );
    if (!ok) return;
    try {
      // deleteVehicle imported from shared service
      await deleteVehicle(vin);
      alert('Vehicle deleted');
      navigate('/');
    } catch (err) {
      alert(
        'Error deleting: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  if (!form)
    return (
      <div className="w-full max-w-7xl mx-auto px-5 py-5">
        <p className="text-charcoal-600 dark:text-cream-300">Loading...</p>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif font-bold text-3xl text-charcoal-800 dark:text-cream-100 m-0">
            Edit Vehicle
          </h2>
          <p className="text-charcoal-600 dark:text-cream-300 mt-2 mb-0">
            {form.year} {form.make} {form.model} • {form.vin}
          </p>
        </div>
        <Link
          to="/app"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>

      {/* Two-column layout: Form + VIN Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
        {/* Left Column: Vehicle Edit Form */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4 px-0">
            Vehicle Details
          </h3>

          <div className="space-y-4">
            {/* Year dropdown */}
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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
                {form.year && !years.includes(String(form.year)) && (
                  <option value={form.year}>Current: {form.year}</option>
                )}
                {years.map((y: string) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Make dropdown */}
            <div>
              <label
                htmlFor="make"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Make
              </label>
              <select
                id="make"
                name="make"
                value={form.make}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingMakes}
              >
                <option value="">
                  {loadingMakes ? 'Loading makes…' : 'Select Make'}
                </option>
                {form.make && !(makes as string[]).includes(form.make) && (
                  <option value={form.make}>Current: {form.make}</option>
                )}
                {makes.map((m: string) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Model dropdown */}
            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Model
              </label>
              <select
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!form.year || !form.make || loadingModels}
              >
                <option value="">
                  {loadingModels
                    ? 'Loading models…'
                    : !form.year || !form.make
                      ? 'Select year & make first'
                      : 'Select Model'}
                </option>
                {form.model && !(models as string[]).includes(form.model) && (
                  <option value={form.model}>Current: {form.model}</option>
                )}
                {models.map((m: string) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* VIN */}
            <div>
              <label
                htmlFor="vin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                VIN
              </label>
              <input
                id="vin"
                type="text"
                name="vin"
                value={form.vin || ''}
                onChange={handleChange}
                placeholder="Vehicle Identification Number"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Enter VIN and click Decode to prefill vehicle details
              </p>
            </div>

            {/* Mileage */}
            <div>
              <label
                htmlFor="licensePlate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                License Plate
              </label>
              <input
                id="licensePlate"
                type="text"
                name="licensePlate"
                value={form.licensePlate || ''}
                onChange={handleChange}
                placeholder="Plate number (optional)"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:text-slate-100 ${
                  plateValidationError
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {plateValidationError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {plateValidationError}
                </p>
              )}
            </div>

            {/* Mileage */}
            <div>
              <label
                htmlFor="mileage"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Mileage
              </label>
              <input
                id="mileage"
                type="text"
                name="mileage"
                value={form.mileage || ''}
                onChange={handleChange}
                placeholder="Current mileage"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label
                htmlFor="purchaseDate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDecodeVin}
                className="w-full px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Decode VIN
              </button>
              <button
                onClick={handleUpdate}
                className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-md border border-red-300 transition-colors"
              >
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: VIN Insights Display */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4 px-0">
            Vehicle Insights
          </h3>

          {!form.vehicleType ? (
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Run VIN decode to populate vehicle insights from NHTSA database
            </p>
          ) : (
            <>
              {/* Vehicle Specifications */}
              <div className="mb-6">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-3">
                  Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Body Class', value: form.bodyClass },
                    { label: 'Vehicle Type', value: form.vehicleType },
                    { label: 'Engine Type', value: form.engineType },
                    { label: 'Fuel Type', value: form.fuelType },
                    { label: 'Drive Type', value: form.driveType },
                    { label: 'Transmission', value: form.transmissionStyle },
                    { label: 'Trim', value: form.trim },
                  ].map(({ label, value }) =>
                    value ? (
                      <div key={label}>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mb-0.5">
                          {label}
                        </p>
                        <p className="text-slate-900 dark:text-slate-100 font-medium mb-0">
                          {value}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* Recalls Section */}
              {form.recallsCount !== undefined && (
                <div className="mb-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm m-0">
                      Active Recalls
                    </h4>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      {form.recallsCount || 0} Recall
                      {form.recallsCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {form.recallsSource && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Source: {form.recallsSource}
                    </p>
                  )}

                  {form.recallsCount === 0 ? (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded p-2">
                      No active recalls found for this vehicle.
                    </p>
                  ) : form.recallsItems && form.recallsItems.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {form.recallsItems.map((recall, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-200 dark:border-slate-600 rounded p-2 text-sm"
                        >
                          {recall.campaignNumber && (
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-xs mb-1">
                              Campaign: {recall.campaignNumber}
                            </p>
                          )}
                          {recall.component && (
                            <p className="text-slate-700 dark:text-slate-300 text-xs mb-1">
                              <span className="font-medium">Component:</span>{' '}
                              {recall.component}
                            </p>
                          )}
                          {recall.summary && (
                            <p className="text-slate-700 dark:text-slate-300 text-xs mb-1">
                              <span className="font-medium">Summary:</span>{' '}
                              {recall.summary}
                            </p>
                          )}
                          {recall.consequence && (
                            <p className="text-slate-700 dark:text-slate-300 text-xs mb-1">
                              <span className="font-medium">Consequence:</span>{' '}
                              {recall.consequence}
                            </p>
                          )}
                          {recall.remedy && (
                            <p className="text-slate-700 dark:text-slate-300 text-xs">
                              <span className="font-medium">Remedy:</span>{' '}
                              {recall.remedy}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {form.insightsUpdatedAt && (
                <p className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3 mt-4">
                  Last updated:{' '}
                  {new Date(form.insightsUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Maintenance Section */}
      <div className="mt-8">
        <h3 className="font-serif font-bold text-2xl text-charcoal-800 dark:text-cream-100 mb-4">
          Maintenance
        </h3>
        {vin && <MaintenanceList vin={vin} prefill={maintenancePrefill} />}
      </div>
    </div>
  );
}

function MaintenanceList({
  vin,
  prefill,
}: {
  vin: string;
  prefill?: { title?: string; cost?: string; date?: string; mileage?: string };
}) {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [prefillDismissed, setPrefillDismissed] = useState(false);
  const addEntryRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    title: '',
    notes: '',
    cost: '',
    attachments: [] as Array<{
      name: string;
      url: string;
      path?: string;
      type?: string;
      analysisStatus?: 'analyzing' | 'extracted' | 'failed';
      analysis?: {
        extracted?: {
          serviceType?: string;
          totalCost?: number;
          serviceDate?: string;
          mileage?: number;
        };
        confidence?: number;
      };
    }>,
  });
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [calendarTarget, setCalendarTarget] = useState<
    'google' | 'apple' | 'ics'
  >('google');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const list = await getMaintenanceEntries(vin);
      setEntries(list);
      const v = await getVehicle(vin);
      setVehicle(v);
    };
    load();
  }, [vin]);

  useEffect(() => {
    if (!prefill) return;
    setForm(p => ({
      ...p,
      title: prefill.title || p.title,
      cost: prefill.cost || p.cost,
    }));
    // Scroll to the Add Entry form so the user sees the pre-filled values
    const timer = setTimeout(() => {
      addEntryRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 300);
    return () => clearTimeout(timer);
    // Only run once on mount when prefill is provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async file => {
        // Generate a temporary maintenance ID for upload path
        const tempId = `temp_${Date.now()}`;
        const path = await generateMaintenanceAttachmentPath(
          vin,
          tempId,
          file.name
        );
        const result = await uploadFile(file, path);
        return result;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const uploadedPaths = uploadedFiles
        .map(file => file.path)
        .filter((path): path is string => Boolean(path));

      // Show 'analyzing' badge immediately while the Cloud Function runs
      setForm(p => ({
        ...p,
        attachments: [
          ...(p.attachments || []),
          ...uploadedFiles.map(f => ({
            ...f,
            analysisStatus: 'analyzing' as const,
          })),
        ],
      }));

      await Promise.allSettled(
        uploadedPaths.map(storagePath =>
          analyzeAttachmentText({
            vin,
            storagePath,
          })
        )
      );

      const analyses = await getAttachmentAnalyses(vin, uploadedPaths);
      const pathToAnalysis = new Map(
        analyses
          .filter((analysis: any) => analysis?.path)
          .map((analysis: any) => [analysis.path, analysis])
      );

      const firstExtracted = analyses.find(
        (analysis: any) =>
          analysis?.extracted?.totalCost || analysis?.extracted?.serviceType
      )?.extracted;

      // Update each newly-added attachment with its final analysis result
      setForm(p => ({
        ...p,
        title: p.title.trim() || firstExtracted?.serviceType || '',
        cost:
          p.cost.trim() ||
          (typeof firstExtracted?.totalCost === 'number'
            ? firstExtracted.totalCost.toFixed(2)
            : ''),
        attachments: p.attachments.map(attachment => {
          if (
            !attachment.path ||
            attachment.analysisStatus !== 'analyzing' ||
            !uploadedPaths.includes(attachment.path)
          ) {
            return attachment;
          }
          const analysis = pathToAnalysis.get(attachment.path);
          if (!analysis) {
            return { ...attachment, analysisStatus: 'failed' as const };
          }
          return {
            ...attachment,
            analysisStatus: 'extracted' as const,
            analysis: {
              extracted: analysis.extracted,
              confidence: analysis.confidence,
            },
          };
        }),
      }));
    } catch (error) {
      alert(
        'Error uploading files: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setForm(p => ({
      ...p,
      attachments: p.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleAdd = async () => {
    try {
      const attachmentPaths = (form.attachments || [])
        .map(attachment => attachment.path)
        .filter((path): path is string => Boolean(path));

      const analyses = await getAttachmentAnalyses(vin, attachmentPaths);
      const pathToAnalysis = new Map(
        analyses
          .filter((analysis: any) => analysis?.path)
          .map((analysis: any) => [analysis.path, analysis])
      );

      const enrichedAttachments = (form.attachments || []).map(attachment => {
        const analysis = attachment.path
          ? pathToAnalysis.get(attachment.path)
          : undefined;

        if (!analysis) {
          return attachment;
        }

        return {
          ...attachment,
          analysis: {
            extracted: analysis.extracted,
            confidence: analysis.confidence,
          },
        };
      });

      const firstExtracted = analyses.find(
        (analysis: any) =>
          analysis?.extracted?.totalCost ||
          analysis?.extracted?.serviceType ||
          analysis?.extracted?.serviceDate
      )?.extracted;

      const derivedTitle =
        form.title.trim() || firstExtracted?.serviceType || 'Service Record';
      const derivedCost =
        form.cost.trim() ||
        (typeof firstExtracted?.totalCost === 'number'
          ? firstExtracted.totalCost.toFixed(2)
          : '');

      const derivedDate = firstExtracted?.serviceDate
        ? new Date(`${firstExtracted.serviceDate}T00:00:00Z`).toISOString()
        : new Date().toISOString();

      const entry = {
        ...form,
        title: derivedTitle,
        cost: derivedCost,
        date: derivedDate,
        attachments: enrichedAttachments,
      };

      await addMaintenanceEntry(vin, entry);
      const list = await getMaintenanceEntries(vin);
      setEntries(list);
      setForm({ title: '', notes: '', cost: '', attachments: [] });
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const upcomingMaintenance = vehicle
    ? getUpcomingMaintenance(vehicle.make, vehicle.model, vehicle.mileage)
    : [];

  const handleAddToCalendar = async (item: any) => {
    if (!vehicle?.vin) {
      alert('Vehicle VIN is required to create calendar events.');
      return;
    }

    try {
      const dueDate = new Date();
      const milesUntilDue = Number(item.milesUntilDue || 0);
      const dayOffset = Math.max(
        1,
        Math.min(180, Math.ceil(milesUntilDue / 100))
      );
      dueDate.setDate(dueDate.getDate() + dayOffset);

      const startAt = dueDate.toISOString();
      const endAt = new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString();
      const event = await createMaintenanceCalendarEvent({
        vehicleVin: vehicle.vin,
        title: item.description,
        description: `${vehicle.year} ${vehicle.make} ${vehicle.model} maintenance reminder`,
        startAt,
        endAt,
        target: calendarTarget,
      });

      const destination = event.actionUrl || event.downloadUrl;
      if (destination) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      }

      alert(`Calendar event created for ${calendarTarget}.`);
    } catch (error) {
      alert(
        'Failed to create calendar event: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-md p-6">
      {/* Manufacturer Schedules Section */}
      {vehicle && (
        <div className="mb-6 border-b border-charcoal-200 dark:border-charcoal-600 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h4 className="font-serif font-bold text-xl text-charcoal-800 dark:text-cream-100">
              Recommended Maintenance
            </h4>
            <div className="flex items-center gap-2">
              <label
                htmlFor="calendarTarget"
                className="text-sm text-charcoal-700 dark:text-cream-300"
              >
                Calendar
              </label>
              <select
                id="calendarTarget"
                value={calendarTarget}
                onChange={e =>
                  setCalendarTarget(
                    e.target.value as 'google' | 'apple' | 'ics'
                  )
                }
                className="px-2 py-1 border border-charcoal-300 dark:border-charcoal-600 rounded-md text-sm dark:bg-charcoal-700 dark:text-cream-100"
              >
                <option value="google">Google</option>
                <option value="apple">Apple</option>
                <option value="ics">ICS</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-charcoal-600 dark:text-cream-300 mb-3">
            {vehicle.make} {vehicle.model} ({vehicle.year}) • Current mileage:{' '}
            {vehicle.mileage}
          </p>
          {upcomingMaintenance.length > 0 ? (
            <div className="space-y-2">
              {upcomingMaintenance
                .slice(0, 3)
                .map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-charcoal-50 dark:bg-charcoal-700 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-oxblood-100 dark:bg-oxblood-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-oxblood-600 dark:text-oxblood-300">
                          !
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-charcoal-800 dark:text-cream-100">
                          {item.description}
                        </div>
                        <div className="text-sm text-charcoal-600 dark:text-cream-300">
                          Due: {item.nextDueMileage} miles ({item.milesUntilDue}{' '}
                          miles)
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-charcoal-500 dark:text-cream-400 text-right">
                      <div>{item.frequency}</div>
                      <button
                        onClick={() => handleAddToCalendar(item)}
                        className="mt-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-1 px-2 rounded text-xs"
                      >
                        Add to Calendar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-charcoal-500 dark:text-cream-400 italic">
              No manufacturer schedules available for this vehicle.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif font-bold text-xl text-charcoal-800 dark:text-cream-100">
          Maintenance History
        </h3>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const { exportMaintenanceAsCSV } = await import(
                '../utils/dataExport'
              );
              exportMaintenanceAsCSV(entries, form);
            }}
            className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-1 px-3 rounded-md transition-colors duration-200 text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={async () => {
              const { exportMaintenanceAsPDF } = await import(
                '../utils/dataExport'
              );
              exportMaintenanceAsPDF(entries, form);
            }}
            className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-1 px-3 rounded-md transition-colors duration-200 text-sm"
          >
            Export PDF
          </button>
        </div>
      </div>

      <ul className="space-y-4 mb-6">
        {entries.map(e => (
          <li
            key={e.id}
            className="border-b border-charcoal-200 dark:border-charcoal-600 pb-3"
          >
            <div className="flex justify-between items-start mb-1">
              <strong className="text-charcoal-800 dark:text-cream-100">
                {e.title}
              </strong>
              <span className="text-sm text-charcoal-600 dark:text-cream-300">
                {e.date?.split('T')[0]}
              </span>
            </div>
            <div className="text-sm text-charcoal-600 dark:text-cream-300 mb-1">
              ${e.cost}
            </div>
            <div className="text-xs text-charcoal-500 dark:text-cream-400">
              {e.notes}
            </div>
          </li>
        ))}
      </ul>

      <div
        ref={addEntryRef}
        className="border-t border-charcoal-200 dark:border-charcoal-600 pt-4"
      >
        <h4 className="font-serif font-bold text-xl text-charcoal-800 dark:text-cream-100 mb-4">
          Add Entry
        </h4>
        {prefill && !prefillDismissed && (
          <div className="mb-3 flex items-start justify-between gap-2 rounded-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-xs text-blue-800 dark:text-blue-200">
            <span>
              Pre-filled from document analysis. Review and adjust before
              saving.
            </span>
            <button
              type="button"
              onClick={() => setPrefillDismissed(true)}
              className="bg-transparent border-0 cursor-pointer text-blue-600 dark:text-blue-300 hover:opacity-70 p-0 flex-shrink-0 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="title" className="sr-only">
                Maintenance Title
              </label>
              <input
                id="title"
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                aria-label="Maintenance Title"
                className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
              />
            </div>
            <div className="w-24">
              <label htmlFor="cost" className="sr-only">
                Cost
              </label>
              <input
                id="cost"
                name="cost"
                placeholder="Cost"
                value={form.cost}
                onChange={handleChange}
                aria-label="Cost"
                className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
              />
            </div>
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
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">
              Photos/Receipts
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              aria-label="Upload photos or receipts"
              className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-oxblood-50 file:text-oxblood-700 hover:file:bg-oxblood-100"
            />
            {uploading && (
              <p className="text-sm text-charcoal-600 dark:text-cream-300 mt-1">
                Uploading files...
              </p>
            )}
          </div>
          {form.attachments && form.attachments.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2">
                Attachments
              </h5>
              <div className="space-y-2">
                {form.attachments.map((attachment, index) => {
                  const fileDisplay = formatFileDisplay(
                    attachment.name,
                    undefined,
                    attachment.type
                  );
                  const extracted = attachment.analysis?.extracted;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-charcoal-50 dark:bg-charcoal-700 rounded-md border border-charcoal-200 dark:border-charcoal-600"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {attachment.type?.startsWith('image/') ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <span className="text-base">
                              {fileDisplay.icon}
                            </span>
                          )}
                          <span className="text-sm text-charcoal-800 dark:text-cream-100">
                            {attachment.name}
                          </span>
                          {attachment.analysisStatus === 'analyzing' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <svg
                                className="w-2.5 h-2.5 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                              </svg>
                              Analyzing
                            </span>
                          )}
                          {attachment.analysisStatus === 'extracted' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              ✓{' '}
                              {typeof attachment.analysis?.confidence ===
                              'number'
                                ? `${Math.round(attachment.analysis.confidence * 100)}%`
                                : 'Analyzed'}
                            </span>
                          )}
                          {attachment.analysisStatus === 'failed' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              No data
                            </span>
                          )}
                        </div>
                        {(extracted?.serviceType ||
                          typeof extracted?.totalCost === 'number' ||
                          extracted?.serviceDate ||
                          typeof extracted?.mileage === 'number') && (
                          <p className="mt-1 text-xs text-charcoal-600 dark:text-cream-300">
                            Detected:
                            {extracted?.serviceType
                              ? ` ${extracted.serviceType}`
                              : ''}
                            {typeof extracted?.totalCost === 'number'
                              ? ` • $${extracted.totalCost.toFixed(2)}`
                              : ''}
                            {extracted?.serviceDate
                              ? ` • ${extracted.serviceDate}`
                              : ''}
                            {typeof extracted?.mileage === 'number'
                              ? ` • ${extracted.mileage.toLocaleString()} mi`
                              : ''}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={uploading}
            className="bg-oxblood-600 hover:bg-oxblood-700 disabled:bg-charcoal-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Add Maintenance
          </button>
        </div>
      </div>
    </div>
  );
}
