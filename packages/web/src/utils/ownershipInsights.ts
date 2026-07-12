export type OwnershipInsightFile = {
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
};

export type OwnershipInsightCategory = {
  // Portfolio category key (e.g. 'maintenance', 'finance', 'ownership') —
  // the authoritative signal for what a document is FOR. The AI-assigned
  // documentCategory on each file is only a generic receipt/invoice/image/
  // document/other classification of the paper itself, not its subject, so
  // e.g. a Bill of Sale filed under "ownership" can still come back tagged
  // "receipt" — it must not be confused with a maintenance receipt.
  key?: string;
  items: Array<{
    files?: OwnershipInsightFile[];
  }>;
};

export type OwnershipInsightVehicle = {
  year: string | number;
  // When available, used instead of model year to compute how long a loan
  // has likely been running — a used vehicle bought years after its model
  // year would otherwise have its loan tenure (and therefore paid-to-date)
  // overstated by assuming financing began the moment the car was built.
  purchaseDate?: string;
} | null;

export type OwnershipInsights = {
  analyzedDocumentCount: number;
  maintenanceDocsCount: number;
  maintenanceTotalCost: number;
  maintenanceAverageCost: number;
  latestServiceDate?: string;
  financeDocsCount: number;
  estimatedMonthlyPayment?: number;
  estimatedPrincipal?: number;
  estimatedCurrentValue?: number;
  estimatedValueRealized?: number;
  estimatedPaidToDate?: number;
  upcomingPaymentDates: string[];
  maintenanceBreakdown: Array<{ label: string; amount: number }>;
};

function formatServiceTypeLabel(raw: string): string {
  if (!raw) return 'Other';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function parseAmount(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function extractMonthlyPaymentFromText(
  sourceText?: string
): number | undefined {
  if (!sourceText) {
    return undefined;
  }

  const regex =
    /\$\s*([0-9]{2,5}(?:\.[0-9]{2})?)\s*(?:\/\s*)?(?:mo|month|monthly)/i;
  const matched = sourceText.match(regex);
  if (!matched) {
    return undefined;
  }

  const amount = Number(matched[1]);
  if (Number.isNaN(amount) || amount <= 0) {
    return undefined;
  }

  return amount;
}

// Classification is based on which portfolio category (Ownership, Finance,
// Maintenance, Reference) the user actually filed the document under, not
// a keyword guess against the AI's generic per-file documentCategory/
// serviceType — that field is deliberately coarse ("receipt" | "invoice" |
// "image" | "document" | "other") and says nothing about subject matter, so
// a keyword match would (and did) count a vehicle's Bill of Sale as
// "maintenance spend" just because it's a "receipt".
function isFinanceDocument(categoryKey: string | undefined) {
  return categoryKey === 'finance';
}

function isMaintenanceDocument(categoryKey: string | undefined) {
  return categoryKey === 'maintenance';
}

function estimateDepreciationFactor(vehicleYear: number): number {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - vehicleYear);
  let factor = 1;

  for (let year = 1; year <= age; year += 1) {
    factor *= year === 1 ? 0.85 : 0.9;
  }

  return Math.max(0.2, factor);
}

function buildUpcomingPaymentDates(count = 6): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let index = 0; index < count; index += 1) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth() + index + 1,
      1
    );
    dates.push(candidate.toLocaleDateString());
  }

  return dates;
}

export function computeOwnershipInsights(
  categories: OwnershipInsightCategory[],
  vehicle: OwnershipInsightVehicle
): OwnershipInsights {
  const filesWithCategory = categories.flatMap(category =>
    category.items.flatMap(item =>
      (item.files || []).map(file => ({ file, categoryKey: category.key }))
    )
  );
  const analyzedEntries = filesWithCategory.filter(
    entry => entry.file.analysis?.extracted
  );
  const analyzedFiles = analyzedEntries.map(entry => entry.file);

  const maintenanceFiles = analyzedEntries
    .filter(entry => isMaintenanceDocument(entry.categoryKey))
    .map(entry => entry.file);
  const maintenanceCosts = maintenanceFiles
    .map(file => parseAmount(file.analysis?.extracted?.totalCost))
    .filter((value): value is number => typeof value === 'number');

  const latestServiceDate = maintenanceFiles
    .map(file => file.analysis?.extracted?.serviceDate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0];

  const maintenanceByType = new Map<string, number>();
  for (const file of maintenanceFiles) {
    const amount = parseAmount(file.analysis?.extracted?.totalCost);
    if (!amount) continue;
    const label = formatServiceTypeLabel(
      file.analysis?.extracted?.serviceType ||
        file.analysis?.extracted?.documentCategory ||
        ''
    );
    maintenanceByType.set(label, (maintenanceByType.get(label) || 0) + amount);
  }
  const maintenanceBreakdown = Array.from(
    maintenanceByType,
    ([label, amount]) => ({ label, amount })
  ).sort((a, b) => b.amount - a.amount);

  const financeFiles = analyzedEntries
    .filter(entry => isFinanceDocument(entry.categoryKey))
    .map(entry => entry.file);
  const monthlyPayments = financeFiles
    .map(file => {
      const extractedCost = parseAmount(file.analysis?.extracted?.totalCost);
      if (extractedCost && extractedCost <= 2000) {
        return extractedCost;
      }

      return extractMonthlyPaymentFromText(file.analysis?.sourceText);
    })
    .filter((value): value is number => typeof value === 'number');

  const principalCandidates = financeFiles
    .map(file => parseAmount(file.analysis?.extracted?.totalCost))
    .filter(
      (value): value is number => typeof value === 'number' && value > 5000
    );

  const estimatedMonthlyPayment =
    monthlyPayments.length > 0
      ? Number(
          (
            monthlyPayments.reduce((sum, value) => sum + value, 0) /
            monthlyPayments.length
          ).toFixed(2)
        )
      : undefined;

  const estimatedPrincipal =
    principalCandidates.length > 0
      ? Math.max(...principalCandidates)
      : undefined;

  const vehicleYear = Number(vehicle?.year);
  const depreciationFactor =
    estimatedPrincipal && Number.isFinite(vehicleYear)
      ? estimateDepreciationFactor(vehicleYear)
      : undefined;

  const estimatedCurrentValue =
    estimatedPrincipal && depreciationFactor
      ? Number((estimatedPrincipal * depreciationFactor).toFixed(2))
      : undefined;

  const estimatedValueRealized =
    estimatedPrincipal && estimatedCurrentValue
      ? Number((estimatedPrincipal - estimatedCurrentValue).toFixed(2))
      : undefined;

  // Loan tenure is based on the actual purchase date when known — model
  // year is a reasonable proxy for a vehicle bought new, but overstates how
  // long a loan has run for a used vehicle bought years after its model
  // year, which in turn overstates estimatedPaidToDate toward the
  // principal (or "paid off") for a loan that may have only just started.
  const purchaseDate = vehicle?.purchaseDate
    ? new Date(vehicle.purchaseDate)
    : null;
  const ageMonths =
    purchaseDate && !Number.isNaN(purchaseDate.getTime())
      ? Math.max(
          0,
          (new Date().getFullYear() - purchaseDate.getFullYear()) * 12 +
            (new Date().getMonth() - purchaseDate.getMonth())
        )
      : Number.isFinite(vehicleYear)
        ? Math.max(0, (new Date().getFullYear() - vehicleYear) * 12)
        : 0;

  const estimatedPaidToDate =
    estimatedPrincipal && estimatedMonthlyPayment
      ? Number(
          Math.min(
            estimatedPrincipal,
            estimatedMonthlyPayment * ageMonths
          ).toFixed(2)
        )
      : undefined;

  return {
    analyzedDocumentCount: analyzedFiles.length,
    maintenanceDocsCount: maintenanceFiles.length,
    maintenanceTotalCost: maintenanceCosts.reduce(
      (sum, value) => sum + value,
      0
    ),
    maintenanceAverageCost:
      maintenanceCosts.length > 0
        ? Number(
            (
              maintenanceCosts.reduce((sum, value) => sum + value, 0) /
              maintenanceCosts.length
            ).toFixed(2)
          )
        : 0,
    latestServiceDate,
    financeDocsCount: financeFiles.length,
    estimatedMonthlyPayment,
    estimatedPrincipal,
    estimatedCurrentValue,
    estimatedValueRealized,
    estimatedPaidToDate,
    upcomingPaymentDates:
      estimatedMonthlyPayment && estimatedMonthlyPayment > 0
        ? buildUpcomingPaymentDates()
        : [],
    maintenanceBreakdown,
  };
}
