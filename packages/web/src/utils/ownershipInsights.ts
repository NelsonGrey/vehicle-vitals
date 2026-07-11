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
  items: Array<{
    files?: OwnershipInsightFile[];
  }>;
};

export type OwnershipInsightVehicle = {
  year: string | number;
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

function isFinanceDocument(file: OwnershipInsightFile) {
  const category = file.analysis?.extracted?.documentCategory || '';
  const summary = file.analysis?.sourceText || '';

  return /(loan|lease|finance|payment|contract|lender|apr)/i.test(
    `${category} ${summary}`
  );
}

function isMaintenanceDocument(file: OwnershipInsightFile) {
  const category = file.analysis?.extracted?.documentCategory || '';
  const serviceType = file.analysis?.extracted?.serviceType || '';

  return /(service|maintenance|repair|invoice|receipt|oil|brake|tire)/i.test(
    `${category} ${serviceType}`
  );
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
  const files = categories.flatMap(category =>
    category.items.flatMap(item => item.files || [])
  );
  const analyzedFiles = files.filter(file => file.analysis?.extracted);

  const maintenanceFiles = analyzedFiles.filter(isMaintenanceDocument);
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

  const financeFiles = analyzedFiles.filter(isFinanceDocument);
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

  const ageMonths = Number.isFinite(vehicleYear)
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
