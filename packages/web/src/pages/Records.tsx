import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteFile,
  generateVehicleRecordAttachmentPath,
  uploadFile,
} from '../shared/storageService';
import { getVehicle, updateVehicle } from '../shared/firestoreService';

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  status: 'missing' | 'in-progress' | 'ready';
  notes?: string;
  files?: Array<{
    name?: string;
    url?: string;
    path?: string;
    size?: number;
    type?: string;
  }>;
};

type PortfolioCategory = {
  key: string;
  title: string;
  items: PortfolioItem[];
};

type VehicleRecord = {
  vin: string;
  year: string | number;
  make: string;
  model: string;
  documentPortfolio?: {
    categories?: PortfolioCategory[];
  };
};

function clonePortfolio(categories: PortfolioCategory[]) {
  return JSON.parse(JSON.stringify(categories)) as PortfolioCategory[];
}

export default function Records() {
  const { vin } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!vin) return;
      const loadedVehicle = await getVehicle(vin);
      if (!loadedVehicle) {
        navigate('/app');
        return;
      }
      setVehicle(loadedVehicle as VehicleRecord);
      setCategories(
        clonePortfolio(loadedVehicle.documentPortfolio?.categories || [])
      );
      setLoading(false);
    };

    load().catch(error => {
      console.error('Failed to load vehicle records', error);
      alert('Failed to load vehicle records');
      navigate('/app');
    });
  }, [navigate, vin]);

  const setItemField = (
    categoryIndex: number,
    itemIndex: number,
    field: 'status' | 'notes',
    value: string
  ) => {
    setCategories(prev => {
      const next = clonePortfolio(prev);
      next[categoryIndex].items[itemIndex] = {
        ...next[categoryIndex].items[itemIndex],
        [field]: value,
      };
      return next;
    });
  };

  const appendItemFile = (
    categoryIndex: number,
    itemIndex: number,
    fileEntry: NonNullable<PortfolioItem['files']>[number]
  ) => {
    setCategories(prev => {
      const next = clonePortfolio(prev);
      const currentItem = next[categoryIndex].items[itemIndex];
      const files = Array.isArray(currentItem.files) ? currentItem.files : [];
      next[categoryIndex].items[itemIndex] = {
        ...currentItem,
        files: [...files, fileEntry],
      };
      return next;
    });
  };

  const removeItemFile = async (
    categoryIndex: number,
    itemIndex: number,
    fileIndex: number
  ) => {
    const item = categories[categoryIndex]?.items[itemIndex];
    const file = item?.files?.[fileIndex];
    if (!file) return;

    try {
      if (file.path) {
        await deleteFile(file.path);
      }
      setCategories(prev => {
        const next = clonePortfolio(prev);
        const currentItem = next[categoryIndex].items[itemIndex];
        const files = [...(currentItem.files || [])];
        files.splice(fileIndex, 1);
        next[categoryIndex].items[itemIndex] = {
          ...currentItem,
          files,
        };
        return next;
      });
    } catch (error) {
      console.error('Failed to delete record attachment', error);
      alert('Failed to delete attachment');
    }
  };

  const handleUpload = async (
    categoryIndex: number,
    itemIndex: number,
    fileList: FileList | null
  ) => {
    if (!vin || !fileList?.length) return;

    const item = categories[categoryIndex]?.items[itemIndex];
    if (!item) return;

    const uploadKey = `${categoryIndex}:${itemIndex}`;
    setUploadingKey(uploadKey);
    try {
      for (const file of Array.from(fileList)) {
        const path = await generateVehicleRecordAttachmentPath(
          vin,
          item.id,
          file.name
        );
        const uploaded = await uploadFile(file, path);
        appendItemFile(
          categoryIndex,
          itemIndex,
          uploaded as {
            name?: string;
            url?: string;
            path?: string;
            size?: number;
            type?: string;
          }
        );
      }
    } catch (error) {
      console.error('Failed to upload record attachment', error);
      alert('Failed to upload attachment');
    } finally {
      setUploadingKey(null);
    }
  };

  const requiredCount = categories.reduce(
    (sum, category) =>
      sum + category.items.filter(item => item.required).length,
    0
  );
  const readyCount = categories.reduce(
    (sum, category) =>
      sum +
      category.items.filter(item => item.required && item.status === 'ready')
        .length,
    0
  );

  const save = async () => {
    if (!vin) return;
    setSaving(true);
    try {
      await updateVehicle(vin, {
        documentPortfolio: {
          ...(vehicle?.documentPortfolio || {}),
          categories,
          updatedAt: new Date().toISOString(),
        },
      });
      alert('Records updated successfully');
      navigate('/app');
    } catch (error) {
      console.error('Failed to save vehicle records', error);
      alert('Failed to save vehicle records');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading records...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 m-0">
            Vehicle Records
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
            {vehicle?.year} {vehicle?.make} {vehicle?.model} • {vehicle?.vin}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-0">
            Required records complete: {readyCount}/{requiredCount}
          </p>
        </div>
        <Link
          to="/app"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>

      <div className="space-y-4">
        {categories.map((category, categoryIndex) => (
          <section
            key={category.key}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-4">
              {category.title}
            </h2>
            <div className="space-y-4">
              {category.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-0 mt-1">
                        {item.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 mb-0">
                        {item.required ? 'Required' : 'Optional'}
                      </p>
                    </div>
                    <select
                      value={item.status}
                      onChange={event =>
                        setItemField(
                          categoryIndex,
                          itemIndex,
                          'status',
                          event.target.value
                        )
                      }
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="missing">Missing</option>
                      <option value="in-progress">In Progress</option>
                      <option value="ready">Ready</option>
                    </select>
                  </div>
                  <textarea
                    value={item.notes || ''}
                    onChange={event =>
                      setItemField(
                        categoryIndex,
                        itemIndex,
                        'notes',
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Notes about where this document is stored, what still needs to be scanned, or renewal details."
                    className="mt-3 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                  />
                  <div className="mt-3">
                    <label className="inline-block px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer text-sm text-slate-900 dark:text-slate-100">
                      {uploadingKey === `${categoryIndex}:${itemIndex}`
                        ? 'Uploading...'
                        : 'Attach files'}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={event => {
                          void handleUpload(
                            categoryIndex,
                            itemIndex,
                            event.target.files
                          );
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {!!item.files?.length && (
                    <div className="mt-3 space-y-2">
                      {item.files.map((file, fileIndex) => (
                        <div
                          key={`${file.path || file.url || file.name}-${fileIndex}`}
                          className="flex items-center justify-between gap-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2"
                        >
                          <div className="min-w-0">
                            {file.url ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 dark:text-blue-300 no-underline"
                              >
                                {file.name || 'Attachment'}
                              </a>
                            ) : (
                              <span>{file.name || 'Attachment'}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void removeItemFile(
                                categoryIndex,
                                itemIndex,
                                fileIndex
                              )
                            }
                            className="text-red-600 dark:text-red-400 bg-transparent border-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-3 bg-slate-700 text-white rounded-lg border border-slate-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Records'}
        </button>
      </div>
    </div>
  );
}
