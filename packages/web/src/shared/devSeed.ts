import {
  createStandardVehiclePortfolio,
  defaultVehicle,
} from '@vehicle-vitals/shared';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { analyzeAttachmentText } from '../utils/attachmentAnalysisService';
import { generateAllDemoDocs } from '../utils/demoPdfGenerator';
import { enableHostedDemoPdfUploads } from './environment';
import { db } from './firebaseConfig';
import {
  addMaintenanceEntry,
  addOrUpdateVehicle,
  addReminder,
  dismissReminder,
  getMaintenanceEntries,
  getReminders,
  getVehicles,
  markReminderDelivery,
  snoozeReminder,
  updateVehicle,
} from './firestoreService';
import {
  generateVehicleRecordAttachmentPath,
  uploadFile,
} from './storageService';

export interface SeedDetails {
  userDisplayName: string;
  vehiclesCount: number;
  seededVehicles: number;
  seededMaintenance: number;
  seededReminders: number;
  seededRecordPortfolios: number;
  preferencesUpdated: boolean;
  seededPdfs: number;
  pdfUploadStatus:
    | 'ok'
    | 'hosted-disabled'
    | 'missing-bucket'
    | 'probe-failed'
    | 'upload-errors';
  pdfUploadErrorCount: number;
  pdfUploadErrors: string[];
}

// ─── PDF upload helper ─────────────────────────────────────────────────────

/**
 * Generate realistic PDF documents for a demo vehicle, upload each to Firebase
 * Storage under the proper records path, and invoke the analysis callable so
 * Firestore `attachmentAnalyses` docs get written with real extracted data.
 *
 * Returns:
 *  - realFiles: map of portfolioItemId → uploaded file metadata (for injecting
 *               real download URLs into the document portfolio before saving)
 *  - count:     number of PDFs that were successfully uploaded
 *
 * All failures are silently swallowed so a storage outage never blocks demo
 * seeding.
 */
async function uploadDemoPdfs(vehicle: DemoVehicleSeed): Promise<{
  realFiles: Record<
    string,
    Array<{ name: string; url: string; size: number; type: string }>
  >;
  count: number;
  status:
    | 'ok'
    | 'hosted-disabled'
    | 'missing-bucket'
    | 'probe-failed'
    | 'upload-errors';
  errors: string[];
}> {
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const allowHostedUploads = enableHostedDemoPdfUploads;

  // Hosted environments can have Storage bucket CORS restrictions that block
  // browser uploads. For hosted dev-seed runs, skip direct uploads by default
  // unless explicitly enabled via VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS=true.
  if (!isLocalhost && !allowHostedUploads) {
    console.info(
      '[devSeed] Using synthetic demo attachments on hosted domain. Set VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS=true after configuring Firebase Storage CORS to upload real PDFs.'
    );
    return {
      realFiles: {},
      count: 0,
      status: 'hosted-disabled',
      errors: [
        'Hosted demo PDF uploads are disabled by VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS.',
      ],
    };
  }

  // Validate bucket configuration up front, then rely on real upload attempts
  // for diagnostics. Browser OPTIONS probes can fail with generic network
  // errors even when uploads would succeed.
  if (!isLocalhost && allowHostedUploads) {
    const bucket = String(
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || ''
    ).trim();

    if (!bucket) {
      console.warn(
        '[devSeed] VITE_FIREBASE_STORAGE_BUCKET missing. Falling back to synthetic demo attachments.'
      );
      return {
        realFiles: {},
        count: 0,
        status: 'missing-bucket',
        errors: ['VITE_FIREBASE_STORAGE_BUCKET is not configured.'],
      };
    }
  }

  const allDocs = generateAllDemoDocs({
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    mileage: vehicle.mileage,
    purchaseDate: vehicle.purchaseDate,
    licensePlate: vehicle.licensePlate,
    nickname: vehicle.nickname,
    fuelType: vehicle.fuelType,
  });

  const realFiles: Record<
    string,
    Array<{ name: string; url: string; size: number; type: string }>
  > = {};
  let count = 0;
  const errors: string[] = [];

  for (const genDoc of allDocs) {
    try {
      const file = new File([genDoc.blob], genDoc.fileName, {
        type: genDoc.type,
      });
      const storagePath = await generateVehicleRecordAttachmentPath(
        vehicle.vin,
        genDoc.portfolioItemId,
        genDoc.fileName
      );
      const uploaded = await uploadFile(file, storagePath);

      if (!realFiles[genDoc.portfolioItemId]) {
        realFiles[genDoc.portfolioItemId] = [];
      }
      realFiles[genDoc.portfolioItemId].push({
        name: genDoc.fileName,
        url: uploaded.url,
        size: genDoc.blob.size,
        type: genDoc.type,
      });

      // Fire-and-forget analysis; errors are non-fatal.
      // Do not send prefilled OCR text during demo seeding so backend Gemini
      // extraction runs against the uploaded file bytes.
      analyzeAttachmentText({
        vin: vehicle.vin,
        storagePath: uploaded.path,
        contentType: genDoc.type,
      }).catch(() => {
        /* analysis failure is non-fatal */
      });

      count += 1;
    } catch (error) {
      // One PDF failed — continue with the rest
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (count === 0 && errors.length > 0) {
    return { realFiles, count, status: 'upload-errors', errors };
  }

  return { realFiles, count, status: 'ok', errors };
}

interface DemoVehicleSeed {
  vin: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  mileage: string;
  purchaseDate: string;
  nextDueByMiles: string;
  nextDueByDate: string;
  annualMileageEstimate: number;
  fuelType: string;
  nickname: string;
  maintenance: Array<{
    title: string;
    serviceType: string;
    provider: string;
    date: string;
    mileage: string;
    cost: number;
    notes: string;
  }>;
  reminders: Array<{
    title: string;
    serviceType: string;
    status: 'active' | 'snoozed' | 'dismissed';
    nextDueMileage: number;
    milesUntilDue: number;
    snoozedUntil?: string;
    deliveryStatus?: 'sent' | 'failed' | 'pending';
    lastDeliveredAt?: string;
    lastDeliveryError?: string;
  }>;
}

interface SeedUser {
  uid: string;
  email?: string | null;
}

interface DemoAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  analysis?: {
    extracted?: {
      documentCategory?: string;
      serviceType?: string;
      totalCost?: number;
      currency?: string;
      serviceDate?: string;
      mileage?: number;
    };
    confidence: number;
  };
}

function getDemoAnalysis(
  itemId: string,
  vehicle: DemoVehicleSeed,
  docIndex: number
): DemoAttachment['analysis'] {
  const purchaseYear = parseInt(vehicle.purchaseDate.slice(0, 4), 10);
  const mileageNum = parseInt(vehicle.mileage, 10);

  // Vary dates/amounts slightly by docIndex so multi-file items look distinct
  const offsetMonths = (docIndex - 1) * 4;
  const refYear = purchaseYear + Math.floor(offsetMonths / 12);
  const refMonth = String((offsetMonths % 12) + 1).padStart(2, '0');
  const refDate = `${refYear}-${refMonth}-15`;

  const costVariants = [89.95, 149.5, 212.0, 389.0, 47.0, 265.0, 72.5, 198.0];
  const baseCost =
    costVariants[
      (parseInt(vehicle.vin.slice(-2), 36) + docIndex) % costVariants.length
    ];

  const serviceItems: Record<string, DemoAttachment['analysis']> = {
    service_history: {
      extracted: {
        documentCategory: 'invoice',
        serviceType: 'Vehicle Service',
        totalCost: baseCost,
        currency: 'USD',
        serviceDate: refDate,
        mileage: mileageNum - 5000 * docIndex,
      },
      confidence: 0.78,
    },
    repair_invoices: {
      extracted: {
        documentCategory: 'invoice',
        serviceType: 'Repair Service',
        totalCost: baseCost + 120,
        currency: 'USD',
        serviceDate: refDate,
        mileage: mileageNum - 8000 * docIndex,
      },
      confidence: 0.74,
    },
    warranty_records: {
      extracted: {
        documentCategory: 'certificate',
        serviceType: 'Warranty Claim',
        serviceDate: refDate,
      },
      confidence: 0.68,
    },
    inspection_reports: {
      extracted: {
        documentCategory: 'invoice',
        serviceType: 'Inspection',
        totalCost: 55 + docIndex * 18,
        currency: 'USD',
        serviceDate: refDate,
      },
      confidence: 0.71,
    },
    title: {
      extracted: {
        documentCategory: 'certificate',
        serviceDate: vehicle.purchaseDate,
      },
      confidence: 0.85,
    },
    registration: {
      extracted: {
        documentCategory: 'certificate',
        serviceDate: `${parseInt(vehicle.purchaseDate.slice(0, 4), 10) + docIndex}-01-01`,
      },
      confidence: 0.82,
    },
    insurance: {
      extracted: {
        documentCategory: 'certificate',
        serviceDate: `${new Date().getFullYear()}-01-01`,
      },
      confidence: 0.79,
    },
    bill_of_sale: {
      extracted: {
        documentCategory: 'receipt',
        totalCost: mileageNum * 0.8 + 12000,
        currency: 'USD',
        serviceDate: vehicle.purchaseDate,
      },
      confidence: 0.83,
    },
    loan_or_lease: {
      extracted: {
        documentCategory: 'certificate',
        serviceDate: vehicle.purchaseDate,
      },
      confidence: 0.72,
    },
    payment_history: {
      extracted: {
        documentCategory: 'receipt',
        totalCost: baseCost * 3,
        currency: 'USD',
        serviceDate: refDate,
      },
      confidence: 0.66,
    },
    tax_receipts: {
      extracted: {
        documentCategory: 'receipt',
        totalCost: baseCost + 30,
        currency: 'USD',
        serviceDate: refDate,
      },
      confidence: 0.69,
    },
    owners_manual: {
      extracted: { documentCategory: 'manual' },
      confidence: 0.46,
    },
    modifications: {
      extracted: {
        documentCategory: 'invoice',
        serviceType: 'Modification',
        totalCost: baseCost + 80,
        currency: 'USD',
        serviceDate: refDate,
      },
      confidence: 0.63,
    },
    accident_reports: {
      extracted: { documentCategory: 'report', serviceDate: refDate },
      confidence: 0.58,
    },
    photo_log: {
      extracted: { documentCategory: 'other' },
      confidence: 0.28,
    },
  };

  return (
    serviceItems[itemId] ?? {
      extracted: { documentCategory: 'other' },
      confidence: 0.4,
    }
  );
}

interface AttachmentTemplate {
  baseName: string;
  extensions: string[];
}

const BOB_DEMO_VEHICLES: DemoVehicleSeed[] = [
  {
    vin: '4T1G11AK2PU123456',
    make: 'Toyota',
    model: 'Camry XLE',
    year: '2023',
    licensePlate: 'IL-B0B123',
    mileage: '38210',
    purchaseDate: '2023-07-18',
    nextDueByMiles: '40000',
    nextDueByDate: '2026-05-15',
    annualMileageEstimate: 12400,
    fuelType: 'Gasoline',
    nickname: 'Family Sedan',
    maintenance: [
      {
        title: '10k Service and Tire Rotation',
        serviceType: '10k_service',
        provider: 'Metro Toyota Service Center',
        date: '2024-02-10',
        mileage: '10240',
        cost: 129.95,
        notes: 'Included tire rotation and multi-point inspection.',
      },
      {
        title: '20k Service Package',
        serviceType: '20k_service',
        provider: 'Metro Toyota Service Center',
        date: '2024-11-06',
        mileage: '20384',
        cost: 246.5,
        notes: 'Cabin filter replaced, brake fluid checked.',
      },
      {
        title: 'Front Brake Pads Replacement',
        serviceType: 'brake_service',
        provider: 'Neighborhood Auto Care',
        date: '2025-08-22',
        mileage: '33105',
        cost: 412.0,
        notes: 'Pads and hardware replaced; rotors still in spec.',
      },
    ],
    reminders: [
      {
        title: '40k Mile Service Due Soon',
        serviceType: '40k_service',
        status: 'active',
        nextDueMileage: 40000,
        milesUntilDue: 1790,
        deliveryStatus: 'sent',
        lastDeliveredAt: '2026-03-10T09:18:00.000Z',
      },
      {
        title: 'Engine Air Filter Check',
        serviceType: 'air_filter',
        status: 'snoozed',
        nextDueMileage: 39500,
        milesUntilDue: 1290,
        snoozedUntil: '2026-04-01',
        deliveryStatus: 'pending',
      },
    ],
  },
  {
    vin: '1FTEW1EP8NFA23457',
    make: 'Ford',
    model: 'F-150 Lariat',
    year: '2022',
    licensePlate: 'IL-TRK457',
    mileage: '51745',
    purchaseDate: '2022-03-04',
    nextDueByMiles: '55000',
    nextDueByDate: '2026-06-12',
    annualMileageEstimate: 16800,
    fuelType: 'Gasoline',
    nickname: 'Work Truck',
    maintenance: [
      {
        title: 'Oil + Filter Service',
        serviceType: 'oil_change',
        provider: 'Blue Ridge Truck Center',
        date: '2024-04-15',
        mileage: '30120',
        cost: 118.25,
        notes: 'Synthetic blend and OEM filter.',
      },
      {
        title: 'Transmission Fluid Service',
        serviceType: 'transmission_service',
        provider: 'Blue Ridge Truck Center',
        date: '2025-02-03',
        mileage: '41910',
        cost: 289.0,
        notes: 'Fluid exchange and updated maintenance log.',
      },
      {
        title: 'Battery Replacement',
        serviceType: 'battery',
        provider: 'Interstate Fleet Service',
        date: '2025-12-19',
        mileage: '50120',
        cost: 236.75,
        notes: 'Cold-cranking amps below threshold during winter test.',
      },
    ],
    reminders: [
      {
        title: '55k Service Bundle',
        serviceType: '55k_service',
        status: 'active',
        nextDueMileage: 55000,
        milesUntilDue: 3255,
        deliveryStatus: 'pending',
      },
      {
        title: 'Cabin Filter Reminder',
        serviceType: 'cabin_filter',
        status: 'dismissed',
        nextDueMileage: 52000,
        milesUntilDue: 255,
        deliveryStatus: 'failed',
        lastDeliveryError: 'SMTP provider timeout',
      },
    ],
  },
  {
    vin: 'WBA53BX03PCL34568',
    make: 'BMW',
    model: '330i',
    year: '2023',
    licensePlate: 'IL-BMW330',
    mileage: '24180',
    purchaseDate: '2023-01-23',
    nextDueByMiles: '30000',
    nextDueByDate: '2026-07-02',
    annualMileageEstimate: 9800,
    fuelType: 'Premium Gasoline',
    nickname: 'Weekend Car',
    maintenance: [
      {
        title: 'Annual Service Inspection',
        serviceType: 'annual_inspection',
        provider: 'Northpoint BMW',
        date: '2024-01-30',
        mileage: '11205',
        cost: 0,
        notes: 'Covered under included maintenance plan.',
      },
      {
        title: 'Brake Fluid Flush',
        serviceType: 'brake_fluid',
        provider: 'Northpoint BMW',
        date: '2025-03-14',
        mileage: '18940',
        cost: 198.0,
        notes: 'Performed along with software update campaign.',
      },
    ],
    reminders: [
      {
        title: '30k Service and Inspection',
        serviceType: '30k_service',
        status: 'active',
        nextDueMileage: 30000,
        milesUntilDue: 5820,
        deliveryStatus: 'sent',
        lastDeliveredAt: '2026-03-12T15:44:00.000Z',
      },
    ],
  },
];

function buildDemoAttachment(
  vehicle: DemoVehicleSeed,
  template: AttachmentTemplate,
  itemId: string,
  categoryKey: string,
  docIndex: number
): DemoAttachment {
  const mimeByExt: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const ext =
    template.extensions[(docIndex - 1) % template.extensions.length] || 'pdf';
  const normalizedVin = vehicle.vin.toLowerCase();
  const normalizedName = template.baseName.replace(/\s+/g, '_');

  return {
    name: `${vehicle.year}_${vehicle.make}_${normalizedName}_${docIndex}.${ext}`,
    url: `https://storage.googleapis.com/vehicle-vitals-demo/${normalizedVin}/${categoryKey}/${itemId}-${docIndex}.${ext}`,
    size: 96_000 + docIndex * 28_000,
    type: mimeByExt[ext] || 'application/octet-stream',
    analysis: getDemoAnalysis(itemId, vehicle, docIndex),
  };
}

function getAttachmentTemplate(itemId: string): AttachmentTemplate {
  const templates: Record<string, AttachmentTemplate> = {
    title: { baseName: 'vehicle_title_front', extensions: ['pdf'] },
    registration: {
      baseName: 'registration_card',
      extensions: ['pdf', 'jpg'],
    },
    insurance: {
      baseName: 'insurance_policy_summary',
      extensions: ['pdf', 'jpg'],
    },
    bill_of_sale: {
      baseName: 'bill_of_sale',
      extensions: ['pdf', 'jpg'],
    },
    loan_or_lease: { baseName: 'loan_contract', extensions: ['pdf'] },
    payment_history: {
      baseName: 'payment_statement',
      extensions: ['pdf', 'pdf'],
    },
    tax_receipts: {
      baseName: 'tax_fee_receipt',
      extensions: ['pdf', 'jpg'],
    },
    service_history: {
      baseName: 'service_invoice',
      extensions: ['pdf', 'jpg'],
    },
    repair_invoices: {
      baseName: 'repair_invoice',
      extensions: ['pdf', 'jpg'],
    },
    warranty_records: {
      baseName: 'warranty_claim_record',
      extensions: ['pdf', 'jpg'],
    },
    inspection_reports: {
      baseName: 'inspection_report',
      extensions: ['pdf', 'pdf'],
    },
    owners_manual: {
      baseName: 'owners_manual_section',
      extensions: ['pdf'],
    },
    accident_reports: {
      baseName: 'incident_report_packet',
      extensions: ['pdf', 'jpg'],
    },
    photo_log: {
      baseName: 'condition_photo_log',
      extensions: ['jpg', 'webp'],
    },
    modifications: {
      baseName: 'modification_receipt',
      extensions: ['pdf', 'jpg'],
    },
  };

  return (
    templates[itemId] || {
      baseName: itemId,
      extensions: ['pdf', 'jpg'],
    }
  );
}

function getDemoAttachmentsForItem(
  vehicle: DemoVehicleSeed,
  categoryKey: string,
  itemId: string,
  itemIndex: number
): DemoAttachment[] {
  // Alternate 1-file and 2-file examples so every section demonstrates
  // both "single attachment" and "multiple attachments" behavior.
  const count = itemIndex % 2 === 0 ? 1 : 2;

  const template = getAttachmentTemplate(itemId);
  const attachments: DemoAttachment[] = [];
  for (let index = 1; index <= count; index += 1) {
    attachments.push(
      buildDemoAttachment(vehicle, template, itemId, categoryKey, index)
    );
  }

  return attachments;
}

function createDemoPortfolio(vehicle: DemoVehicleSeed) {
  const portfolio = createStandardVehiclePortfolio();
  const categories = portfolio.categories || [];

  for (const category of categories) {
    for (const [itemIndex, item] of (category.items || []).entries()) {
      if (category.key === 'maintenance') {
        item.status = item.required ? 'ready' : 'in-progress';
      } else if (category.key === 'ownership') {
        item.status = item.required ? 'ready' : 'in-progress';
      } else if (category.key === 'reference') {
        item.status = item.required ? 'in-progress' : 'missing';
      } else {
        item.status = item.required ? 'in-progress' : 'missing';
      }

      item.notes = `Bob Demo - ${vehicle.nickname}: ${item.title} ${
        item.status === 'ready' ? 'on file and verified.' : 'in progress.'
      }`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item as any).files = getDemoAttachmentsForItem(
        vehicle,
        category.key,
        item.id,
        itemIndex
      );
    }
  }

  return {
    ...portfolio,
    categories,
    ownerDisplayName: 'Bob Demo',
    updatedAt: new Date().toISOString(),
  };
}

export const bobDemoVehicleCount = BOB_DEMO_VEHICLES.length;

export async function seedBobDemo(user: SeedUser): Promise<SeedDetails> {
  if (!user?.uid) {
    throw new Error(
      'Please sign in (enable Anonymous sign-in for dev), then reload this page.'
    );
  }

  await setDoc(
    doc(db, `users/${user.uid}`),
    {
      displayName: 'Bob Demo',
      preferredName: 'Bob',
      role: 'demo',
      email: user.email || 'bob.demo@example.com',
      emailRemindersEnabled: true,
      updatedAt: serverTimestamp(),
      createdFrom: 'web-dev-seed',
    },
    { merge: true }
  );

  let seededMaintenance = 0;
  let seededReminders = 0;
  let seededRecordPortfolios = 0;
  let seededPdfs = 0;
  let pdfUploadStatus: SeedDetails['pdfUploadStatus'] = 'ok';
  const pdfUploadErrors: string[] = [];

  for (const vehicle of BOB_DEMO_VEHICLES) {
    // Generate + upload real PDFs first so we can inject real download URLs
    // into the portfolio before it's persisted.  Falls back to fake-URL items
    // for any category whose upload fails.
    const {
      realFiles,
      count: pdfCount,
      status,
      errors,
    } = await uploadDemoPdfs(vehicle).catch(() => ({
      realFiles: {} as Record<
        string,
        Array<{ name: string; url: string; size: number; type: string }>
      >,
      count: 0,
      status: 'upload-errors' as const,
      errors: ['Unexpected failure while uploading demo PDFs.'],
    }));
    seededPdfs += pdfCount;
    if (status !== 'ok' && seededPdfs === 0) {
      pdfUploadStatus = status;
    }
    if (errors.length) {
      pdfUploadErrors.push(...errors.map(err => `${vehicle.vin}: ${err}`));
    }

    const demoPortfolio = createDemoPortfolio(vehicle);

    // Replace fake-URL file entries with real uploaded ones where available.
    for (const category of demoPortfolio.categories ?? []) {
      for (const item of category.items ?? []) {
        if (realFiles[item.id]?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item as any).files = realFiles[item.id];
          item.status = 'ready';
        }
      }
    }

    await addOrUpdateVehicle({
      ...defaultVehicle,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      mileage: vehicle.mileage,
      purchaseDate: vehicle.purchaseDate,
      nextDueByMiles: vehicle.nextDueByMiles,
      nextDueByDate: vehicle.nextDueByDate,
      annualMileageEstimate: vehicle.annualMileageEstimate,
      fuelType: vehicle.fuelType,
      nickname: vehicle.nickname,
      documentPortfolio: demoPortfolio,
      demoOwnerName: 'Bob Demo',
    });

    // Ensure records demo content is applied even if addOrUpdateVehicle
    // falls back to an existing/default portfolio shape.
    await updateVehicle(vehicle.vin, {
      documentPortfolio: demoPortfolio,
      demoOwnerName: 'Bob Demo',
    });
    seededRecordPortfolios += 1;

    const existingMaintenance = await getMaintenanceEntries(vehicle.vin);
    for (const entry of vehicle.maintenance) {
      const exists = existingMaintenance.some(
        existing =>
          existing.title === entry.title &&
          String(existing.mileage || '') === entry.mileage
      );
      if (!exists) {
        await addMaintenanceEntry(vehicle.vin, entry);
        seededMaintenance += 1;
      }
    }

    const existingReminders = await getReminders(vehicle.vin);
    for (const reminder of vehicle.reminders) {
      const existing = existingReminders.find(
        current =>
          current.serviceType === reminder.serviceType &&
          current.title === reminder.title
      );

      if (existing) {
        continue;
      }

      const created = await addReminder(vehicle.vin, {
        title: reminder.title,
        description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        serviceType: reminder.serviceType,
        status: 'active',
        nextDueMileage: reminder.nextDueMileage,
        milesUntilDue: reminder.milesUntilDue,
        frequency: 'Mileage based',
        interval: 5000,
      });
      seededReminders += 1;

      if (reminder.status === 'snoozed' && reminder.snoozedUntil) {
        await snoozeReminder(vehicle.vin, created.id, reminder.snoozedUntil);
      }
      if (reminder.status === 'dismissed') {
        await dismissReminder(vehicle.vin, created.id);
      }
      if (reminder.deliveryStatus) {
        await markReminderDelivery(vehicle.vin, created.id, {
          deliveryStatus: reminder.deliveryStatus,
          lastDeliveredAt: reminder.lastDeliveredAt || null,
          lastDeliveryError: reminder.lastDeliveryError || null,
        });
      }
    }
  }

  await setDoc(
    doc(db, `users/${user.uid}/vehicles/preferences`),
    {
      profileName: 'Bob Demo',
      maintenanceAlertsEnabled: true,
      preferredReminderTimingDays: 14,
      preferredDailyMiles: 38,
      notificationEmail: user.email || 'bob.demo@example.com',
      preferredProviderRadiusMiles: 30,
      preferredProviderType: 'all',
      preferredProviderUseVehicleMake: true,
      preferredVehicleMake: 'Toyota',
      homeAddress: {
        street1: '1425 W Campbell Ave',
        street2: 'Unit 4',
        city: 'Chicago',
        stateProvince: 'IL',
        postalCode: '60618',
        country: 'US',
      },
      fcmToken: 'demo-fcm-token-bob-0001',
      updatedAt: serverTimestamp(),
      createdFrom: 'web-dev-seed',
    },
    { merge: true }
  );

  const vehicles = await getVehicles();
  return {
    userDisplayName: 'Bob Demo',
    vehiclesCount: vehicles.length,
    seededVehicles: BOB_DEMO_VEHICLES.length,
    seededMaintenance,
    seededReminders,
    seededRecordPortfolios,
    preferencesUpdated: true,
    seededPdfs,
    pdfUploadStatus,
    pdfUploadErrorCount: pdfUploadErrors.length,
    pdfUploadErrors: pdfUploadErrors.slice(0, 5),
  };
}
