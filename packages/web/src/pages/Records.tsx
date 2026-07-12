import { createStandardVehiclePortfolio } from '@vehicle-vitals/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CollapsibleSection from '../components/CollapsibleSection';
import GaugeDial from '../components/charts/GaugeDial';
import WheelBreakdownChart from '../components/charts/WheelBreakdownChart';
import { formatFileDisplay } from '../shared/fileUtils';
import {
  addReminder,
  completeReminder,
  dismissReminder,
  getAttachmentAnalyses,
  getReminders,
  getVehicle,
  reopenReminder,
  snoozeReminder,
  updateVehicle,
} from '../shared/firestoreService';
import {
  deleteFile,
  generateVehicleRecordAttachmentPath,
  uploadFile,
} from '../shared/storageService';
import { analyzeAttachmentText } from '../utils/attachmentAnalysisService';
import { createMaintenanceCalendarEvent } from '../utils/calendarService';
import {
  buildDocumentSummary,
  getSourceSnippet,
} from '../utils/documentAnalysisSummary';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { computeOwnershipInsights } from '../utils/ownershipInsights';

type AnalysisData = {
  path?: string;
  extracted?: {
    documentCategory?: string;
    serviceType?: string;
    totalCost?: number;
    serviceDate?: string;
    mileage?: number;
  };
  confidence?: number;
  sourceText?: string;
};

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
        documentCategory?: string;
        serviceType?: string;
        totalCost?: number;
        serviceDate?: string;
        mileage?: number;
      };
      confidence?: number;
      sourceText?: string;
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

type InsightActionType =
  | 'payment_reminder'
  | 'payment_calendar'
  | 'maintenance_follow_up'
  | 'equity_review';

type InsightReminderSummary = {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  nextDueDate?: string;
};

const INSIGHT_ACTION_LABELS: Record<
  Exclude<InsightActionType, 'payment_calendar'>,
  string
> = {
  payment_reminder: 'Payment Reminder',
  maintenance_follow_up: 'Maintenance Follow-Up',
  equity_review: 'Value Review',
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
        'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200',
    };
  }

  if (confidence >= 0.4) {
    return {
      label: 'Review Suggested',
      className:
        'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    };
  }

  return {
    label: 'Needs Review',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  };
}

function getDocumentSummary(
  file: NonNullable<PortfolioItem['files']>[number]
): string {
  return buildDocumentSummary(
    file.analysis?.extracted,
    file.analysis?.sourceText
  );
}

function buildMonthStartDate(monthOffset = 1): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1, 9, 0, 0);
}

function buildFutureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

const formatCurrency = formatCurrencyUtil;

const SPEND_WHEEL_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#a78bfa',
  '#f43f5e',
  '#14b8a6',
  '#94a3b8',
];

function formatInsightDueDate(value?: string): string {
  if (!value) {
    return 'No due date';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
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
  const [savedInsightActions, setSavedInsightActions] = useState<Set<string>>(
    () => new Set()
  );
  const [savedInsightReminders, setSavedInsightReminders] = useState<
    Partial<
      Record<
        Exclude<InsightActionType, 'payment_calendar'>,
        InsightReminderSummary
      >
    >
  >({});
  const [workingInsightAction, setWorkingInsightAction] =
    useState<InsightActionType | null>(null);
  const [actingReminderIds, setActingReminderIds] = useState<Set<string>>(
    () => new Set()
  );
  const [insightActionMessage, setInsightActionMessage] = useState('');
  const [calendarTarget, setCalendarTarget] = useState<
    'google' | 'apple' | 'ics'
  >('google');
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
          const pathToAnalysis = new Map<string | undefined, AnalysisData>(
            analyses
              .filter((a: AnalysisData) => a?.path)
              .map((a: AnalysisData) => [a.path, a])
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
                      sourceText: analysis.sourceText,
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

      try {
        const existingReminders = await getReminders(vin);
        const nextInsightReminders: Partial<
          Record<
            Exclude<InsightActionType, 'payment_calendar'>,
            InsightReminderSummary
          >
        > = {};
        const reminderKeys = existingReminders
          .filter(
            (reminder: any) =>
              reminder?.serviceType &&
              reminder?.status !== 'completed' &&
              reminder?.status !== 'dismissed'
          )
          .map((reminder: any) => String(reminder.serviceType));

        existingReminders.forEach((reminder: any) => {
          const serviceType = reminder?.serviceType as
            Exclude<InsightActionType, 'payment_calendar'> | undefined;
          if (
            serviceType &&
            serviceType in INSIGHT_ACTION_LABELS &&
            reminder?.status !== 'dismissed' &&
            reminder?.status !== 'completed'
          ) {
            nextInsightReminders[serviceType] = {
              id: String(reminder.id || serviceType),
              title: String(
                reminder.title || INSIGHT_ACTION_LABELS[serviceType]
              ),
              status: String(reminder.status || 'active'),
              dueDate:
                typeof reminder.dueDate === 'string'
                  ? reminder.dueDate
                  : undefined,
              nextDueDate:
                typeof reminder.nextDueDate === 'string'
                  ? reminder.nextDueDate
                  : undefined,
            };
          }
        });

        setSavedInsightActions(new Set(reminderKeys));
        setSavedInsightReminders(nextInsightReminders);
      } catch {
        // Non-fatal: reminder actions stay available without preload state.
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
                sourceText: matched.sourceText,
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

  const insights = useMemo(
    () => computeOwnershipInsights(categories, vehicle),
    [categories, vehicle]
  );

  const runInsightReminderAction = async (action: InsightActionType) => {
    if (!vin || !vehicle) {
      return;
    }

    if (savedInsightActions.has(action)) {
      setInsightActionMessage('This insight action is already scheduled.');
      return;
    }

    setWorkingInsightAction(action);
    setInsightActionMessage('');

    try {
      let dueDate = buildFutureDate(30);
      let title = 'Ownership review';
      let description = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      let frequency = 'monthly';
      let interval = 1;

      if (action === 'payment_reminder') {
        dueDate = buildMonthStartDate();
        title = `Monthly payment for ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        description = `Estimated payment ${formatCurrency(insights.estimatedMonthlyPayment)} based on uploaded finance documents.`;
      }

      if (action === 'maintenance_follow_up') {
        dueDate = insights.latestServiceDate
          ? new Date(
              new Date(insights.latestServiceDate).getTime() +
                90 * 24 * 60 * 60 * 1000
            )
          : buildFutureDate(45);
        title = `Maintenance follow-up for ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        description = `Review upcoming service needs after ${insights.maintenanceDocsCount} maintenance documents and ${formatCurrency(insights.maintenanceTotalCost)} in captured spend.`;
        frequency = 'quarterly';
        interval = 3;
      }

      if (action === 'equity_review') {
        dueDate = buildFutureDate(180);
        title = `Value review for ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        description = `Check refinance, trade-in, or sale timing against estimated realized value of ${formatCurrency(insights.estimatedValueRealized)}.`;
        frequency = 'semiannual';
        interval = 6;
      }

      const createdReminder = await addReminder(vin, {
        title,
        description,
        serviceType: action,
        frequency,
        interval,
        status: 'active',
        dueDate: dueDate.toLocaleDateString(),
        nextDueDate: dueDate.toISOString(),
        estimatedAmount:
          action === 'payment_reminder'
            ? insights.estimatedMonthlyPayment
            : undefined,
      });

      setSavedInsightActions(prev => new Set(prev).add(action));
      if (action !== 'payment_calendar') {
        setSavedInsightReminders(prev => ({
          ...prev,
          [action]: {
            id: createdReminder.id,
            title,
            status: 'active',
            dueDate: dueDate.toLocaleDateString(),
            nextDueDate: dueDate.toISOString(),
          },
        }));
      }
      setInsightActionMessage('Reminder saved to Upcoming Tasks.');
    } catch (error) {
      console.error('Failed to save insight reminder', error);
      setInsightActionMessage('Failed to save reminder.');
    } finally {
      setWorkingInsightAction(null);
    }
  };

  const updateSavedInsightReminder = (
    action: Exclude<InsightActionType, 'payment_calendar'>,
    updater: (current: InsightReminderSummary) => InsightReminderSummary | null
  ) => {
    setSavedInsightReminders(prev => {
      const current = prev[action];
      if (!current) {
        return prev;
      }

      const nextValue = updater(current);
      if (!nextValue) {
        const next = { ...prev };
        delete next[action];
        return next;
      }

      return {
        ...prev,
        [action]: nextValue,
      };
    });
  };

  const handleInsightReminderStateChange = async (
    action: Exclude<InsightActionType, 'payment_calendar'>,
    operation: 'complete' | 'snooze' | 'dismiss' | 'resume'
  ) => {
    if (!vin) {
      return;
    }

    const reminder = savedInsightReminders[action];
    if (!reminder?.id) {
      return;
    }

    setActingReminderIds(prev => new Set(prev).add(reminder.id));
    setInsightActionMessage('');

    try {
      if (operation === 'complete') {
        await completeReminder(vin, reminder.id);
        updateSavedInsightReminder(action, () => null);
        setSavedInsightActions(prev => {
          const next = new Set(prev);
          next.delete(action);
          return next;
        });
        setInsightActionMessage('Reminder completed.');
      }

      if (operation === 'dismiss') {
        await dismissReminder(vin, reminder.id);
        updateSavedInsightReminder(action, () => null);
        setSavedInsightActions(prev => {
          const next = new Set(prev);
          next.delete(action);
          return next;
        });
        setInsightActionMessage('Reminder dismissed.');
      }

      if (operation === 'snooze') {
        const snoozedUntil = new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString();
        await snoozeReminder(vin, reminder.id, snoozedUntil);
        updateSavedInsightReminder(action, current => ({
          ...current,
          status: 'snoozed',
          nextDueDate: snoozedUntil,
        }));
        setInsightActionMessage('Reminder snoozed for 14 days.');
      }

      if (operation === 'resume') {
        await reopenReminder(vin, reminder.id);
        updateSavedInsightReminder(action, current => ({
          ...current,
          status: 'active',
        }));
        setSavedInsightActions(prev => new Set(prev).add(action));
        setInsightActionMessage('Reminder resumed.');
      }
    } catch (error) {
      console.error('Failed to update insight reminder state', error);
      setInsightActionMessage('Failed to update reminder.');
    } finally {
      setActingReminderIds(prev => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  const runInsightCalendarAction = async () => {
    if (
      !vin ||
      !vehicle ||
      typeof insights.estimatedMonthlyPayment !== 'number'
    ) {
      return;
    }

    setWorkingInsightAction('payment_calendar');
    setInsightActionMessage('');

    try {
      const startAt = buildMonthStartDate().toISOString();
      const endAt = new Date(
        new Date(startAt).getTime() + 60 * 60 * 1000
      ).toISOString();
      const event = await createMaintenanceCalendarEvent({
        vehicleVin: vin,
        title: `Vehicle payment due for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        description: `Estimated payment ${formatCurrency(insights.estimatedMonthlyPayment)} based on uploaded finance documents.`,
        startAt,
        endAt,
        target: calendarTarget,
      });

      const destination = event.actionUrl || event.downloadUrl;
      if (destination) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      }

      setInsightActionMessage(`Calendar event created for ${calendarTarget}.`);
    } catch (error) {
      console.error('Failed to create payment calendar event', error);
      setInsightActionMessage('Failed to create calendar event.');
    } finally {
      setWorkingInsightAction(null);
    }
  };

  const statusClassMap: Record<PortfolioItem['status'], string> = {
    missing:
      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
    'in-progress':
      'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200',
    ready:
      'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200',
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 m-0">
            Vehicle Records
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
            {vehicle?.year} {vehicle?.make} {vehicle?.model} • {vehicle?.vin}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {requiredCount > 0 && (
            <GaugeDial
              size="sm"
              value={Math.round((readyCount / requiredCount) * 100)}
              label="Records Complete"
              sublabel={`${readyCount}/${requiredCount}`}
            />
          )}
          <Link
            to="/app"
            className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {flattenedItems.length > 0 && (
          <CollapsibleSection
            title="Ownership Insights"
            description="Estimates from extracted document data. Add finance contracts, payment statements, and purchase docs to increase precision."
            headerRight={
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Documents analyzed: {insights.analyzedDocumentCount}
              </div>
            }
            defaultCollapsed
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Maintenance spend captured
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(insights.maintenanceTotalCost)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {insights.maintenanceDocsCount} docs • Avg{' '}
                  {formatCurrency(insights.maintenanceAverageCost)}
                  {insights.latestServiceDate
                    ? ` • Latest ${new Date(insights.latestServiceDate).toLocaleDateString()}`
                    : ''}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  From docs filed under Maintenance and Repair only —
                  purchase price and finance documents are excluded.
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Estimated monthly payment
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {typeof insights.estimatedMonthlyPayment === 'number'
                    ? formatCurrency(insights.estimatedMonthlyPayment)
                    : 'Add finance docs'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Finance docs detected: {insights.financeDocsCount}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Value realized vs depreciation
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {typeof insights.estimatedValueRealized === 'number'
                    ? `${formatCurrency(insights.estimatedValueRealized)} realized`
                    : 'Need principal doc'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {typeof insights.estimatedCurrentValue === 'number'
                    ? `Est. current value ${formatCurrency(insights.estimatedCurrentValue)}`
                    : 'Upload purchase/loan principal to unlock estimate'}
                </div>
              </div>
            </div>

            {(insights.maintenanceBreakdown || []).length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Maintenance Spend Breakdown
                </div>
                <WheelBreakdownChart
                  segments={(insights.maintenanceBreakdown || []).map((entry, index) => ({
                    label: entry.label,
                    amount: entry.amount,
                    color: SPEND_WHEEL_COLORS[index % SPEND_WHEEL_COLORS.length],
                  }))}
                  formatAmount={formatCurrency}
                  centerValue={formatCurrency(insights.maintenanceTotalCost)}
                  centerLabel="Total spend"
                />
              </div>
            )}

            {insights.upcomingPaymentDates.length > 0 &&
              typeof insights.estimatedMonthlyPayment === 'number' && (
                <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Payment Calendar Projection
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                    Upcoming monthly obligations from extracted finance records.
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {insights.upcomingPaymentDates.map(date => (
                      <div
                        key={date}
                        className="rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 px-2 py-1"
                      >
                        <div className="text-slate-600 dark:text-slate-300">
                          {date}
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(insights.estimatedMonthlyPayment)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {typeof insights.estimatedPaidToDate === 'number' && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Estimated paid to date:{' '}
                      {formatCurrency(insights.estimatedPaidToDate)}
                    </div>
                  )}
                </div>
              )}

            <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Turn Insights Into Actions
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Save reminder records or add projected obligations to your
                    calendar.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="recordsCalendarTarget"
                    className="text-xs text-slate-500 dark:text-slate-400"
                  >
                    Calendar target
                  </label>
                  <select
                    id="recordsCalendarTarget"
                    value={calendarTarget}
                    onChange={event =>
                      setCalendarTarget(
                        event.target.value as 'google' | 'apple' | 'ics'
                      )
                    }
                    className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="google">Google</option>
                    <option value="apple">Apple</option>
                    <option value="ics">ICS download</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {typeof insights.estimatedMonthlyPayment === 'number' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        void runInsightReminderAction('payment_reminder')
                      }
                      disabled={workingInsightAction !== null}
                      className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-60"
                    >
                      {workingInsightAction === 'payment_reminder'
                        ? 'Saving...'
                        : savedInsightActions.has('payment_reminder')
                          ? 'Payment Reminder Saved'
                          : 'Save Payment Reminder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void runInsightCalendarAction()}
                      disabled={workingInsightAction !== null}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-60"
                    >
                      {workingInsightAction === 'payment_calendar'
                        ? 'Creating...'
                        : 'Add Payment To Calendar'}
                    </button>
                  </>
                )}

                {insights.maintenanceDocsCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      void runInsightReminderAction('maintenance_follow_up')
                    }
                    disabled={workingInsightAction !== null}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-60"
                  >
                    {workingInsightAction === 'maintenance_follow_up'
                      ? 'Saving...'
                      : savedInsightActions.has('maintenance_follow_up')
                        ? 'Maintenance Follow-Up Saved'
                        : 'Schedule Maintenance Follow-Up'}
                  </button>
                )}

                {typeof insights.estimatedValueRealized === 'number' && (
                  <button
                    type="button"
                    onClick={() =>
                      void runInsightReminderAction('equity_review')
                    }
                    disabled={workingInsightAction !== null}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-60"
                  >
                    {workingInsightAction === 'equity_review'
                      ? 'Saving...'
                      : savedInsightActions.has('equity_review')
                        ? 'Value Review Saved'
                        : 'Schedule Value Review'}
                  </button>
                )}
              </div>

              {insightActionMessage && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  {insightActionMessage}
                </div>
              )}

              {Object.keys(savedInsightReminders).length > 0 &&
                vehicle?.vin && (
                  <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Scheduled Insight Actions
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          These reminders are already saved for this vehicle.
                        </div>
                      </div>
                      <Link
                        to={`/app/upcoming?vin=${encodeURIComponent(vehicle.vin)}`}
                        className="text-xs text-slate-700 dark:text-slate-200 no-underline border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1"
                      >
                        Open Upcoming Tasks
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                      {(
                        Object.entries(savedInsightReminders) as Array<
                          [
                            Exclude<InsightActionType, 'payment_calendar'>,
                            InsightReminderSummary,
                          ]
                        >
                      ).map(([action, reminder]) => (
                        <div
                          key={reminder.id}
                          className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                        >
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {INSIGHT_ACTION_LABELS[action]}
                          </div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                            {reminder.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Status: {reminder.status}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Due:{' '}
                            {formatInsightDueDate(
                              reminder.nextDueDate || reminder.dueDate
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reminder.status === 'snoozed' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleInsightReminderStateChange(
                                    action,
                                    'resume'
                                  )
                                }
                                disabled={actingReminderIds.has(reminder.id)}
                                className="px-2 py-1 text-[11px] rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-60"
                              >
                                {actingReminderIds.has(reminder.id)
                                  ? 'Working...'
                                  : 'Resume'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleInsightReminderStateChange(
                                    action,
                                    'snooze'
                                  )
                                }
                                disabled={actingReminderIds.has(reminder.id)}
                                className="px-2 py-1 text-[11px] rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-60"
                              >
                                {actingReminderIds.has(reminder.id)
                                  ? 'Working...'
                                  : 'Snooze 14d'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                void handleInsightReminderStateChange(
                                  action,
                                  'complete'
                                )
                              }
                              disabled={actingReminderIds.has(reminder.id)}
                              className="px-2 py-1 text-[11px] rounded-md border border-accent-300 dark:border-accent-700 text-accent-700 dark:text-accent-300 disabled:opacity-60"
                            >
                              {actingReminderIds.has(reminder.id)
                                ? 'Working...'
                                : 'Complete'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleInsightReminderStateChange(
                                  action,
                                  'dismiss'
                                )
                              }
                              disabled={actingReminderIds.has(reminder.id)}
                              className="px-2 py-1 text-[11px] rounded-md border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 disabled:opacity-60"
                            >
                              {actingReminderIds.has(reminder.id)
                                ? 'Working...'
                                : 'Dismiss'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </CollapsibleSection>
        )}

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
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-1 px-1">
                Record List
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-3 px-1">
                Search and filter this vehicle's document portfolio.
              </p>
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
                          className={`shrink-0 text-xs px-2 py-1 rounded-full ${statusClassMap[entry.item.status]}`}
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

            <div className="lg:col-span-8 lg:sticky lg:top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
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
                        const summaryText = getDocumentSummary(file);
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
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {summaryText}
                                  </span>
                                </div>
                                <details className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-2 py-1">
                                  <summary className="cursor-pointer text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                    Analysis details
                                  </summary>
                                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                                    <div>
                                      Confidence:{' '}
                                      {typeof file.analysis?.confidence ===
                                      'number'
                                        ? `${Math.round(file.analysis.confidence * 100)}%`
                                        : 'n/a'}
                                    </div>
                                    <div>
                                      Category:{' '}
                                      {extracted?.documentCategory || 'n/a'}
                                    </div>
                                    <div>
                                      Service type:{' '}
                                      {extracted?.serviceType || 'n/a'}
                                    </div>
                                    <div>
                                      Total cost:{' '}
                                      {typeof extracted?.totalCost === 'number'
                                        ? formatCurrency(extracted.totalCost)
                                        : 'n/a'}
                                    </div>
                                    <div>
                                      Service date:{' '}
                                      {extracted?.serviceDate || 'n/a'}
                                    </div>
                                    <div>
                                      Mileage:{' '}
                                      {typeof extracted?.mileage === 'number'
                                        ? `${extracted.mileage.toLocaleString()} mi`
                                        : 'n/a'}
                                    </div>
                                    <div>
                                      Source snippet:{' '}
                                      {getSourceSnippet(
                                        file.analysis?.sourceText
                                      ) || 'n/a'}
                                    </div>
                                    {(extracted?.serviceType ||
                                      typeof extracted?.totalCost ===
                                        'number' ||
                                      extracted?.serviceDate ||
                                      typeof extracted?.mileage ===
                                        'number') && (
                                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            navigate(
                                              `/app/edit-vehicle/${vin}`,
                                              {
                                                state: {
                                                  maintenancePrefill: {
                                                    title:
                                                      extracted?.serviceType,
                                                    cost:
                                                      typeof extracted?.totalCost ===
                                                      'number'
                                                        ? extracted.totalCost.toFixed(
                                                            2
                                                          )
                                                        : undefined,
                                                    date: extracted?.serviceDate,
                                                    mileage:
                                                      typeof extracted?.mileage ===
                                                      'number'
                                                        ? String(
                                                            extracted.mileage
                                                          )
                                                        : undefined,
                                                  },
                                                },
                                              }
                                            )
                                          }
                                          className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-transparent border-0 cursor-pointer hover:underline p-0"
                                        >
                                          Add to maintenance log →
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </details>
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
                              className="text-danger-600 dark:text-danger-400 bg-transparent border-0 cursor-pointer hover:opacity-70 flex-shrink-0"
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
