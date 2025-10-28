// -----------------------------
// File: web/pages/EditVehicle.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUpcomingMaintenance } from '../../../../shared/maintenanceSchedules';
import AdBanner from '../components/AdBanner';
import useVehicleOptions from '../hooks/useVehicleOptions';
import {
  addMaintenanceEntry,
  deleteVehicle,
  getMaintenanceEntries,
  getVehicle,
  updateVehicle,
} from '../shared/firestoreService';
import {
  generateMaintenanceAttachmentPath,
  uploadFile,
} from '../shared/storageService';
import { decodeVin } from '../utils/vehicleService';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  purchaseDate?: string;
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
    type?: string;
  }>;
}

export default function EditVehicle() {
  const { vin } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Vehicle | null>(null);
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
    setForm(prev => (prev ? { ...prev, [name]: value } : null));
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
      const { make, model, year } = await decodeVin(v);
      setForm(prev =>
        prev
          ? {
              ...prev,
              make: make || prev.make,
              model: model || prev.model,
              year: year || prev.year,
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
      <div className="max-w-2xl mx-auto px-5 py-5">
        <p className="text-charcoal-600 dark:text-cream-300">Loading...</p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-5 py-5">
      <AdBanner />
      <h2 className="font-serif font-bold text-3xl text-charcoal-800 dark:text-cream-100 mb-6">
        Edit Vehicle
      </h2>

      <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-md p-6 space-y-6">
        {/* Year dropdown */}
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
          >
            Year
          </label>
          <select
            id="year"
            name="year"
            value={form.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
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
            className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
          >
            Make
          </label>
          <select
            id="make"
            name="make"
            value={form.make}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100 disabled:bg-charcoal-100 disabled:cursor-not-allowed"
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

        {/* Model dropdown depends on year+make */}
        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
          >
            Model
          </label>
          <select
            id="model"
            name="model"
            value={form.model}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100 disabled:bg-charcoal-100 disabled:cursor-not-allowed"
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

        {/* VIN and mileage text inputs */}
        {['vin', 'mileage'].map(field => (
          <div key={field}>
            <label
              htmlFor={field}
              className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              id={field}
              type="text"
              name={field}
              value={form[field as keyof Vehicle] || ''}
              onChange={handleChange}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full px-3 py-2 border border-charcoal-300 dark:border-charcoal-600 rounded-md focus:outline-none focus:ring-2 focus:ring-oxblood-500 focus:border-oxblood-500 dark:bg-charcoal-700 dark:text-cream-100"
            />
            {field === 'vin' && (
              <p className="text-xs text-charcoal-600 dark:text-cream-400 mt-1">
                Decode VIN uses the NHTSA VPIC database to prefill Year, Make,
                and Model. Changes aren&apos;t saved until you click Save
                Changes.
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
          <label
            htmlFor="purchaseDate"
            className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-2"
          >
            Purchase Date
          </label>
          <input
            id="purchaseDate"
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
        <h3 className="font-serif font-bold text-2xl text-charcoal-800 dark:text-cream-100 mb-4">
          Maintenance
        </h3>
        {vin && <MaintenanceList vin={vin} />}
      </div>
    </div>
  );
}

function MaintenanceList({ vin }: { vin: string }) {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [form, setForm] = useState({
    title: '',
    notes: '',
    cost: '',
    attachments: [] as Array<{ name: string; url: string; type?: string }>,
  });
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
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
      setForm(p => ({
        ...p,
        attachments: [...(p.attachments || []), ...uploadedFiles],
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
      const entry = {
        ...form,
        date: new Date().toISOString(),
        attachments: form.attachments || [],
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

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-lg shadow-md p-6">
      {/* Manufacturer Schedules Section */}
      {vehicle && (
        <div className="mb-6 border-b border-charcoal-200 dark:border-charcoal-600 pb-4">
          <h4 className="font-serif font-bold text-xl text-charcoal-800 dark:text-cream-100 mb-3">
            Recommended Maintenance
          </h4>
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
                      {item.frequency}
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

      <div className="border-t border-charcoal-200 dark:border-charcoal-600 pt-4">
        <h4 className="font-serif font-bold text-xl text-charcoal-800 dark:text-cream-100 mb-4">
          Add Entry
        </h4>
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
                {form.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-charcoal-50 dark:bg-charcoal-700 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      {attachment.type?.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-charcoal-200 dark:bg-charcoal-600 rounded flex items-center justify-center">
                          <span className="text-xs">📄</span>
                        </div>
                      )}
                      <span className="text-sm text-charcoal-800 dark:text-cream-100">
                        {attachment.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
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
