import { createStandardVehiclePortfolio } from '@vehicle-vitals/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatFileDisplay } from '../shared/fileUtils';
import {
  getAttachmentAnalyses,
  getVehicle,
  updateVehicle,
} from '../shared/firestoreService';
import {
  deleteFile,
  generateVehicleRecordAttachmentPath,
  uploadFile,
} from '../shared/storageService';
import { analyzeAttachmentText } from '../utils/attachmentAnalysisService';

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

function resolveInitialCategories(
  loadedVehicle: VehicleRecord
): PortfolioCategory[] {
  const existing = loadedVehicle.documentPortfolio?.categories || [];
  if (existing.length > 0) {
    return clonePortfolio(existing);
  }
  return clonePortfolio(
    (createStandardVehiclePortfolio().categories || []) as PortfolioCategory[]
  );
}

function getAnalysisBadge(confidence: number | undefined): {
  label: string;
  className: string;
} {
  if (typeof confidence !== 'number') {
    return {
      label: 'Unscored',
      className:
        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    };
  }

  if (confidence >= 0.7) {
    return {
      label: 'Auto-Verified',
      className:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
  }

  if (confidence >= 0.4) {
    return {
      label: 'Review Suggested',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
  }

  return {
    label: 'Needs Review',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  };
}

export default function Records() {
  const { vin } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<
    'all' | 'required' | PortfolioItem['status']
  >('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!vin) return;
      const loadedVehicle = await getVehicle(vin);
      if (!loadedVehicle) {
        navigate('/app');
        return;
      }
      setVehicle(loadedVehicle as VehicleRecord);

      const initialCategories = resolveInitialCategories(
        loadedVehicle as VehicleRecord
      );

      // Collect all file paths across all portfolio items so we can
      // enrich them with stored analysis data in one batch read.
      const allPaths: string[] = [];
      for (const category of initialCategories) {
        for (const item of category.items) {
          for (const file of item.files || []) {
            if (file.path) allPaths.push(file.path);
          }
        }
      }

      if (allPaths.length > 0) {
        try {
          const analyses = await getAttachmentAnalyses(vin, allPaths);
          const pathToAnalysis = new Map(
            analyses
              .filter((a: any) => a?.path)
              .map((a: any) => [a.path, a])
          );

          if (pathToAnalysis.size > 0) {
            for (const category of initialCategories) {
              for (const item of category.items) {
                if (!item.files) continue;
                item.files = item.files.map(file => {
                  const analysis = file.path
                    ? pathToAnalysis.get(file.path)
                    : undefined;
                  if (!analysis) return file;
                  return {
                    ...file,
                    analysis: {
                      extracted: analysis.extracted,
                      confidence: analysis.confidence,
                    },
                  };
                });
              }
            }
          }
        } catch {
          // Non-fatal: render without analysis enrichment
        }
      }

      setCategories(initialCategories);
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
        await analyzeAttachmentText({
          vin,
          storagePath: path,
        });
        const analyses = await getAttachmentAnalyses(vin, [path]);
        const matched = analyses.find((entry: any) => entry?.path === path);
        appendItemFile(categoryIndex, itemIndex, {
          ...(uploaded as {
            name?: string;
            url?: string;
            path?: string;
            size?: number;
            type?: string;
          }),
          analysis: matched
            ? {
                extracted: matched.extracted,
                confidence: matched.confidence,
              }
            : undefined,
        });
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

  const initializePortfolio = () => {
    setCategories(
      clonePortfolio(
        (createStandardVehiclePortfolio().categories ||
          []) as PortfolioCategory[]
      )
    );
  };

  const flattenedItems = categories.flatMap((category, categoryIndex) =>
    category.items.map((item, itemIndex) => ({
      key: `${categoryIndex}:${itemIndex}`,
      categoryIndex,
      itemIndex,
      categoryTitle: category.title,
      item,
    }))
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchedItems = flattenedItems.filter(entry => {
    return (
      !normalizedSearch ||
      entry.item.title.toLowerCase().includes(normalizedSearch) ||
      entry.item.description.toLowerCase().includes(normalizedSearch) ||
      entry.categoryTitle.toLowerCase().includes(normalizedSearch)
    );
  });

  const filterCounts = {
    all: searchedItems.length,
    required: searchedItems.filter(entry => entry.item.required).length,
    missing: searchedItems.filter(entry => entry.item.status === 'missing')
      .length,
    'in-progress': searchedItems.filter(
      entry => entry.item.status === 'in-progress'
    ).length,
    ready: searchedItems.filter(entry => entry.item.status === 'ready').length,
  } as const;

  const filteredItems = flattenedItems.filter(entry => {
    const filterMatch =
      listFilter === 'all'
        ? true
        : listFilter === 'required'
          ? entry.item.required
          : entry.item.status === listFilter;

    const searchMatch = searchedItems.some(item => item.key === entry.key);

    return filterMatch && searchMatch;
  });

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedItemKey(null);
      return;
    }

    const hasSelected = filteredItems.some(
      entry => entry.key === selectedItemKey
    );
    if (!hasSelected) {
      setSelectedItemKey(filteredItems[0].key);
    }
  }, [filteredItems, selectedItemKey]);

  const selectedEntry = filteredItems.find(
    entry => entry.key === selectedItemKey
  );

  const statusClassMap: Record<PortfolioItem['status'], string> = {
    missing:
      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
    'in-progress':
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    ready:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  };

  const statusLabelMap: Record<PortfolioItem['status'], string> = {
    missing: 'Missing',
    'in-progress': 'In Progress',
    ready: 'Ready',
  };

  if (loading) {
    return <div className="p-6">Loading records...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
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
        {categories.length === 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-slate-700 dark:text-slate-300 mt-0">
              This vehicle does not have a records portfolio yet.
            </p>
            <button
              type="button"
              onClick={initializePortfolio}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-700"
            >
              Initialize Standard Records
            </button>
          </section>
        )}

        {flattenedItems.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-3 px-1">
                Record List
              </h2>
              <div className="mb-3 space-y-2">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search title, description, or category"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['all', 'All'],
                      ['required', 'Required'],
                      ['missing', 'Missing'],
                      ['in-progress', 'In Progress'],
                      ['ready', 'Ready'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setListFilter(value)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        listFilter === value
                          ? 'border-slate-700 bg-slate-700 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {label} ({filterCounts[value]})
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 max-h-[70dvh] overflow-y-auto pr-1">
                {filteredItems.map(entry => {
                  const isSelected = entry.key === selectedItemKey;
                  const fileCount = entry.item.files?.length || 0;

                  return (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => setSelectedItemKey(entry.key)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? 'border-slate-500 bg-slate-100 dark:bg-slate-700'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                          {entry.item.title}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${statusClassMap[entry.item.status]}`}
                        >
                          {statusLabelMap[entry.item.status]}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {entry.categoryTitle} •{' '}
                        {entry.item.required ? 'Required' : 'Optional'} •{' '}
                        {fileCount} file{fileCount === 1 ? '' : 's'}
                      </div>
                    </button>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
                    No records match this filter.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              {!selectedEntry ? (
                <p className="text-slate-600 dark:text-slate-400 m-0">
                  Select a record item to view and edit details.
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
                        {selectedEntry.item.title}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-2">
                        {selectedEntry.categoryTitle} •{' '}
                        {selectedEntry.item.required ? 'Required' : 'Optional'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusClassMap[selectedEntry.item.status]}`}
                    >
                      {statusLabelMap[selectedEntry.item.status]}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-0 mb-3">
                    {selectedEntry.item.description}
                  </p>

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedEntry.item.status}
                    onChange={event =>
                      setItemField(
                        selectedEntry.categoryIndex,
                        selectedEntry.itemIndex,
                        'status',
                        event.target.value
                      )
                    }
                    className="mb-3 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="missing">Missing</option>
                    <option value="in-progress">In Progress</option>
                    <option value="ready">Ready</option>
                  </select>

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={selectedEntry.item.notes || ''}
                    onChange={event =>
                      setItemField(
                        selectedEntry.categoryIndex,
                        selectedEntry.itemIndex,
                        'notes',
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Notes about where this document is stored, what still needs to be scanned, or renewal details."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                  />

                  <div className="mt-3">
                    <label className="inline-block px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer text-sm text-slate-900 dark:text-slate-100">
                      {uploadingKey === selectedEntry.key
                        ? 'Uploading...'
                        : 'Attach files'}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={event => {
                          void handleUpload(
                            selectedEntry.categoryIndex,
                            selectedEntry.itemIndex,
                            event.target.files
                          );
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {!!selectedEntry.item.files?.length && (
                    <div className="mt-3 space-y-2">
                      {selectedEntry.item.files.map((file, fileIndex) => {
                        const fileDisplay = formatFileDisplay(
                          file.name,
                          file.size,
                          file.type
                        );
                        const badge = getAnalysisBadge(
                          file.analysis?.confidence
                        );
                        const extracted = file.analysis?.extracted;
                        return (
                          <div
                            key={`${file.path || file.url || file.name}-${fileIndex}`}
                            className="flex items-center justify-between gap-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2"
                          >
                            <div className="min-w-0 flex items-start gap-2">
                              <span className="text-base flex-shrink-0">
                                {fileDisplay.icon}
                              </span>
                              <div className="min-w-0">
                                {file.url ? (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-700 dark:text-blue-300 no-underline hover:underline"
                                  >
                                    <span className="font-medium">
                                      {file.name || 'Attachment'}
                                    </span>
                                    {fileDisplay.sizeStr && (
                                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                                        ({fileDisplay.sizeStr})
                                      </span>
                                    )}
                                  </a>
                                ) : (
                                  <>
                                    <span className="font-medium">
                                      {file.name || 'Attachment'}
                                    </span>
                                    {fileDisplay.sizeStr && (
                                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                                        ({fileDisplay.sizeStr})
                                      </span>
                                    )}
                                  </>
                                )}
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                  {(extracted?.serviceType ||
                                    typeof extracted?.totalCost === 'number' ||
                                    extracted?.serviceDate) && (
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {extracted?.serviceType
                                        ? extracted.serviceType
                                        : 'Document insight'}
                                      {typeof extracted?.totalCost === 'number'
                                        ? ` • $${extracted.totalCost.toFixed(2)}`
                                        : ''}
                                      {extracted?.serviceDate
                                        ? ` • ${extracted.serviceDate}`
                                        : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void removeItemFile(
                                  selectedEntry.categoryIndex,
                                  selectedEntry.itemIndex,
                                  fileIndex
                                )
                              }
                              className="text-red-600 dark:text-red-400 bg-transparent border-0 cursor-pointer hover:opacity-70 flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}
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
