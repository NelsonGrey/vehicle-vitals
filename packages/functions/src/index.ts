/* eslint-disable quotes, object-curly-spacing, arrow-parens, operator-linebreak, indent, max-len, quote-props */
import { VertexAI } from '@google-cloud/vertexai';
import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import {
  buildAppleCalendarEvent,
  buildGoogleCalendarEvent,
  buildIcsEvent,
} from './calendar.provider';
import { sendEmail } from './email.provider';
import {
  readIntegrationCache,
  writeIntegrationCache,
} from './integration.cache';
import { getIntegrationConfig } from './integrations.config';
import { lookupOwnerManuals } from './manuals.provider';
import { verifyPremiumReceipt } from './premium.provider';
import { enforceRateLimit, requireAuthenticatedUser } from './request.guards';
import { buildMaintenancePlan } from './schedule.provider';
import { lookupWarrantySummary } from './warranty.provider';

// Initialize Firebase Admin
admin.initializeApp();

// TypeScript interfaces for Firebase Functions
interface Vehicle {
  uid?: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  purchaseDate?: string;
  nextDueOilChange?: string;
  nextDueTireRotation?: string;
  nextDueBrakeInspection?: string;
}

interface MaintenanceItem {
  title: string;
  dueDate: string;
  type: string;
}

interface MaintenanceEntry {
  id?: string;
  title?: string;
  date: string | Date | Timestamp;
  mileage?: number;
  notes?: string;
}

interface LocalServiceProvider {
  id: string;
  type: 'repair_shop' | 'dealership';
  name: string;
  distanceMiles: number;
  address: string;
  phone: string;
  website: string;
  rating: number;
  specialties: string[];
}

interface ReminderSweepSummary {
  usersScanned: number;
  vehiclesScanned: number;
  remindersSent: number;
  reminderFailures: number;
  pushSent: number;
  pushFailures: number;
}

interface ReminderSweepDependencies {
  queryDocuments: (
    collection: string,
    options?: {
      filters?: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: unknown;
      }>;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      offset?: number;
    }
  ) => Promise<any[]>;
  getUpcomingMaintenance: (
    vehicle: Vehicle,
    daysAhead?: number
  ) => Promise<MaintenanceItem[]>;
  sendReminderEmail: (
    email: string,
    vehicle: Vehicle,
    maintenanceItems: MaintenanceItem[]
  ) => Promise<void>;
  sendPushNotification: (
    fcmToken: string,
    vehicle: Vehicle,
    maintenanceItems: MaintenanceItem[]
  ) => Promise<void>;
}

interface ReminderScheduleRunDependencies {
  runSweep: () => Promise<ReminderSweepSummary>;
  onInfo: (message: string, payload?: unknown) => void;
  onError: (message: string, error: unknown) => void;
}

/**
 * Firestore CRUD helpers for Firebase Functions
 */
class FirestoreCrudHelpers {
  private static db = admin.firestore();

  /**
   * Query documents with filters
   * @param {string} collection The collection path to query
   * @param {object} options Query options including filters, ordering, limits
   * @return {Promise<any[]>} Array of documents with their data
   */
  static async queryDocuments(
    collection: string,
    options?: {
      filters?: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: unknown;
      }>;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    let query: admin.firestore.Query = this.db.collection(collection);

    // Apply filters
    if (options?.filters) {
      options.filters.forEach(filter => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // Apply offset (startAfter) - simplified version
    if (options?.offset) {
      // In practice you'd need a document reference
      // query = query.startAfter(options.offset);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

interface AttachmentExtractedData {
  documentCategory: 'receipt' | 'invoice' | 'image' | 'document' | 'other';
  serviceType?: string;
  totalCost?: number;
  currency?: string;
  serviceDate?: string;
  mileage?: number;
}

function compactDefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function inferDocumentCategory(
  fileName: string,
  mimeType?: string
): AttachmentExtractedData['documentCategory'] {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (lower.includes('receipt') || lower.includes('invoice')) {
    return lower.includes('invoice') ? 'invoice' : 'receipt';
  }

  if (mime.startsWith('image/')) {
    return 'image';
  }

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('sheet') ||
    mime.includes('text')
  ) {
    return 'document';
  }

  return 'other';
}

function inferServiceType(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  const mapping: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /oil/, label: 'Oil Change' },
    { pattern: /tire|tyre|rotation/, label: 'Tire Service' },
    { pattern: /brake/, label: 'Brake Service' },
    { pattern: /battery/, label: 'Battery Service' },
    { pattern: /inspection/, label: 'Inspection' },
    { pattern: /alignment/, label: 'Alignment' },
  ];

  const match = mapping.find(item => item.pattern.test(lower));
  return match?.label;
}

function extractCost(value: string): number | undefined {
  const text = value.toLowerCase();
  const explicit =
    text.match(
      /(?:total|amount|invoice|paid|cost)\D{0,8}(\d{1,5}(?:[.,]\d{2})?)/i
    ) || text.match(/\$(\d{1,5}(?:[.,]\d{2})?)/);
  if (!explicit) return undefined;

  const normalized = explicit[1].replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Number(parsed.toFixed(2));
}

function extractMileage(value: string): number | undefined {
  const mileageMatch = value.match(
    /(\d{1,3}(?:,\d{3})+|\d{4,6})\s?(?:mi|miles|km)\b/i
  );
  if (!mileageMatch) return undefined;
  const parsed = Number(mileageMatch[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toIsoDate(date: Date): string | undefined {
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function extractServiceDate(value: string): string | undefined {
  const isoMatch = value.match(/\b(\d{4})[-_/](\d{2})[-_/](\d{2})\b/);
  if (isoMatch) {
    return toIsoDate(
      new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`)
    );
  }

  const usMatch = value.match(/\b(\d{1,2})[-_/](\d{1,2})[-_/](\d{2,4})\b/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0');
    const day = usMatch[2].padStart(2, '0');
    const year = usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3];
    return toIsoDate(new Date(`${year}-${month}-${day}T00:00:00Z`));
  }

  return undefined;
}

interface GeminiExtractedData {
  documentCategory?: string;
  serviceType?: string;
  totalCost?: number;
  currency?: string;
  serviceDate?: string;
  mileage?: number;
  rawText?: string;
}

async function callGeminiAnalysis(
  bucketName: string,
  objectPath: string,
  mimeType: string
): Promise<GeminiExtractedData | null> {
  try {
    const projectId =
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      admin.app().options.projectId;
    if (!projectId) {
      logger.warn('Gemini: no project ID available, skipping');
      return null;
    }

    // Download file bytes from Storage
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(objectPath);
    const [fileBuffer] = await file.download();
    const base64Data = fileBuffer.toString('base64');

    // Cap at 10 MB to avoid Gemini payload limits on very large files
    if (fileBuffer.byteLength > 10 * 1024 * 1024) {
      logger.warn('Gemini: file too large (>10 MB), skipping', { objectPath });
      return null;
    }

    const SUPPORTED_MIMES = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/gif',
    ];
    const effectiveMime = SUPPORTED_MIMES.includes(mimeType)
      ? mimeType
      : 'application/pdf';

    const vertexAI = new VertexAI({
      project: projectId,
      location: 'us-central1',
    });
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const prompt = `You are a vehicle document parser. Analyze the attached document and extract structured data.

Return a JSON object with ONLY these fields (omit any field you cannot find):
{
  "documentCategory": "receipt" | "invoice" | "image" | "document" | "other",
  "serviceType": "short description of the service (e.g. Oil Change, Tire Rotation, Brake Service, Annual Inspection, etc.)",
  "totalCost": <number, dollars, no currency symbol>,
  "currency": "USD",
  "serviceDate": "YYYY-MM-DD",
  "mileage": <number, odometer reading if present>,
  "rawText": "full text content of the document in a single string"
}

Rules:
- Extract costs as plain numbers (e.g. 89.99, not "$89.99")
- If the document has multiple line items, use the grand total for totalCost
- Use the document date as serviceDate (not today's date)
- Omit any field that is not clearly present in the document
- For documentCategory: receipt = retail receipt, invoice = professional service invoice, image = photo with no text, document = general document`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: effectiveMime, data: base64Data } },
          ],
        },
      ],
    });

    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) return null;

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as GeminiExtractedData;
    return parsed;
  } catch (err) {
    logger.warn('Gemini analysis failed, falling back to heuristics', {
      error: String(err),
    });
    return null;
  }
}

function buildAttachmentAnalysis(
  objectName: string,
  mimeType: string | undefined,
  customMetadata: Record<string, string> | undefined,
  gemini?: GeminiExtractedData | null
): {
  extracted: AttachmentExtractedData;
  confidence: number;
  sourceText: string;
} {
  const fileName = objectName.split('/').pop() || objectName;
  const metadataText = [
    fileName,
    customMetadata?.title,
    customMetadata?.description,
    customMetadata?.notes,
    customMetadata?.ocrText,
    gemini?.rawText,
  ]
    .filter(Boolean)
    .join(' ');

  // Prefer Gemini-extracted values; fall back to heuristics for any missing field
  const heuristicCategory = inferDocumentCategory(fileName, mimeType);
  const heuristicServiceType = inferServiceType(metadataText);
  const heuristicCost = extractCost(metadataText);
  const heuristicDate = extractServiceDate(metadataText);
  const heuristicMileage = extractMileage(metadataText);

  const geminiCategory = gemini?.documentCategory as
    | AttachmentExtractedData['documentCategory']
    | undefined;
  const validCategories: AttachmentExtractedData['documentCategory'][] = [
    'receipt',
    'invoice',
    'image',
    'document',
    'other',
  ];

  const extracted = compactDefined({
    documentCategory:
      geminiCategory && validCategories.includes(geminiCategory)
        ? geminiCategory
        : heuristicCategory,
    serviceType: gemini?.serviceType || heuristicServiceType,
    totalCost:
      typeof gemini?.totalCost === 'number' ? gemini.totalCost : heuristicCost,
    currency: gemini?.currency || 'USD',
    serviceDate: gemini?.serviceDate || heuristicDate,
    mileage:
      typeof gemini?.mileage === 'number' ? gemini.mileage : heuristicMileage,
  }) as AttachmentExtractedData;

  const confidenceSignals = [
    extracted.documentCategory !== 'other',
    Boolean(extracted.serviceType),
    typeof extracted.totalCost === 'number',
    Boolean(extracted.serviceDate),
    typeof extracted.mileage === 'number',
  ].filter(Boolean).length;

  // Gemini analysis earns a base confidence bonus
  const geminiBonus = gemini ? 0.3 : 0;
  const confidence = Math.min(
    0.25 + geminiBonus + confidenceSignals * 0.1,
    0.95
  );

  return { extracted, confidence, sourceText: metadataText };
}

function parseAttachmentPath(path: string): {
  uid: string;
  vin: string;
  section: 'maintenance' | 'records';
  parentId: string;
} | null {
  const match = path.match(
    /^users\/([^/]+)\/vehicles\/([^/]+)\/(maintenance|records)\/([^/]+)\/.+/
  );

  if (!match) return null;

  return {
    uid: match[1],
    vin: match[2],
    section: match[3] as 'maintenance' | 'records',
    parentId: match[4],
  };
}

async function upsertAttachmentAnalysis(params: {
  uid: string;
  vin: string;
  objectPath: string;
  bucket?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  customMetadata?: Record<string, string>;
  forceOcrText?: string;
  skipGemini?: boolean;
}) {
  const {
    uid,
    vin,
    objectPath,
    bucket,
    contentType,
    sizeBytes,
    customMetadata,
    forceOcrText,
    skipGemini,
  } = params;

  const pathContext = parseAttachmentPath(objectPath);
  if (!pathContext) {
    throw new HttpsError('invalid-argument', 'Invalid attachment storage path');
  }

  if (pathContext.uid !== uid) {
    throw new HttpsError(
      'permission-denied',
      'Attachment path does not match authenticated user'
    );
  }

  if (pathContext.vin !== vin) {
    throw new HttpsError(
      'invalid-argument',
      'Attachment path VIN does not match request VIN'
    );
  }

  const db = admin.firestore();
  const mergedMetadata = {
    ...(customMetadata || {}),
    ...(forceOcrText ? { ocrText: forceOcrText } : {}),
  };

  // Attempt Gemini analysis if we have a bucket reference and haven't been asked to skip
  let geminiResult: GeminiExtractedData | null = null;
  const effectiveBucket = bucket || admin.app().options.storageBucket || null;
  const geminiEnabledMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif',
  ];
  const mimeForGemini = (contentType || '').toLowerCase();
  const canUseGemini =
    !skipGemini &&
    !forceOcrText &&
    effectiveBucket &&
    (geminiEnabledMimes.includes(mimeForGemini) || mimeForGemini === '');

  if (canUseGemini && effectiveBucket) {
    logger.info('Running Gemini analysis', { objectPath, contentType });
    geminiResult = await callGeminiAnalysis(
      effectiveBucket,
      objectPath,
      mimeForGemini || 'application/pdf'
    );
    if (geminiResult) {
      logger.info('Gemini analysis succeeded', {
        objectPath,
        serviceType: geminiResult.serviceType,
        totalCost: geminiResult.totalCost,
        confidence: 'computed-after-merge',
      });
    }
  }

  const { extracted, confidence, sourceText } = buildAttachmentAnalysis(
    objectPath,
    contentType || undefined,
    mergedMetadata,
    geminiResult
  );

  const analysisDocId = encodeURIComponent(objectPath);
  const analysisData = {
    path: objectPath,
    bucket: bucket || null,
    contentType: contentType || null,
    sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : null,
    fileName: objectPath.split('/').pop() || objectPath,
    section: pathContext.section,
    parentId: pathContext.parentId,
    extracted,
    confidence,
    sourceText,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db
    .doc(`users/${uid}/vehicles/${vin}/attachmentAnalyses/${analysisDocId}`)
    .set(analysisData, { merge: true });

  if (
    pathContext.section === 'maintenance' &&
    !pathContext.parentId.startsWith('temp_')
  ) {
    const maintenanceRef = db.doc(
      `users/${uid}/vehicles/${vin}/maintenance/${pathContext.parentId}`
    );
    const maintenanceSnap = await maintenanceRef.get();
    if (maintenanceSnap.exists) {
      const data = maintenanceSnap.data() || {};
      const attachments = Array.isArray(data.attachments)
        ? data.attachments
        : [];
      let changed = false;
      const nextAttachments = attachments.map((attachment: any) => {
        if (attachment?.path !== objectPath) {
          return attachment;
        }

        changed = true;
        return {
          ...attachment,
          analysis: {
            extracted,
            confidence,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      if (changed) {
        await maintenanceRef.set(
          {
            attachments: nextAttachments,
            attachmentAnalysisUpdatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }

  return {
    extracted,
    confidence,
    sourceText,
    section: pathContext.section,
    parentId: pathContext.parentId,
  };
}

const storageAttachmentAnalysisEnabled =
  (process.env.ENABLE_STORAGE_ATTACHMENT_ANALYSIS || 'true')
    .trim()
    .toLowerCase() !== 'false';

if (!storageAttachmentAnalysisEnabled) {
  logger.info(
    'Storage attachment analysis trigger disabled ' +
      '(set ENABLE_STORAGE_ATTACHMENT_ANALYSIS=true to enable)'
  );
}

export const analyzeUploadedAttachment = storageAttachmentAnalysisEnabled
  ? onObjectFinalized(async event => {
      const object = event.data;
      const objectName = object.name;
      if (!objectName) {
        logger.warn('Skipping storage finalize event with missing object name');
        return;
      }

      const pathContext = parseAttachmentPath(objectName);
      if (!pathContext) {
        return;
      }

      await upsertAttachmentAnalysis({
        uid: pathContext.uid,
        vin: pathContext.vin,
        objectPath: objectName,
        bucket: object.bucket,
        contentType: object.contentType || null,
        sizeBytes: Number(object.size || 0),
        customMetadata: object.metadata as Record<string, string> | undefined,
      });
    })
  : undefined;

export const analyzeAttachmentTextCallable = onCall(
  { timeoutSeconds: 120 },
  async request => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Missing auth context');
    }

    const {
      vin,
      storagePath,
      ocrText,
      contentType,
      bucket: bucketParam,
    } = (request.data as {
      vin?: string;
      storagePath?: string;
      ocrText?: string;
      contentType?: string;
      bucket?: string;
    }) ?? {};

    const normalizedVin = (vin || '').trim().toUpperCase();
    const normalizedPath = (storagePath || '').trim();
    const normalizedText = (ocrText || '').trim();

    if (!normalizedVin || normalizedVin.length !== 17) {
      throw new HttpsError(
        'invalid-argument',
        'Valid 17-character VIN required'
      );
    }

    if (!normalizedPath) {
      throw new HttpsError('invalid-argument', 'storagePath is required');
    }

    const result = await upsertAttachmentAnalysis({
      uid,
      vin: normalizedVin,
      objectPath: normalizedPath,
      bucket: (bucketParam || '').trim() || null,
      contentType: (contentType || '').trim() || null,
      forceOcrText: normalizedText || undefined,
    });

    return {
      success: true,
      vin: normalizedVin,
      storagePath: normalizedPath,
      analysis: result,
    };
  }
);

async function decodeVinData(vinInput: string) {
  const vin = vinInput.trim().toUpperCase();
  if (vin.length !== 17) {
    throw new Error('Valid 17-character VIN required');
  }

  logger.info(`Decoding VIN: ${vin.substring(0, 8)}...`);

  const nhtsaUrl =
    'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/' +
    `${encodeURIComponent(vin)}?format=json`;
  const nhtsaResponse = await fetch(nhtsaUrl);

  if (!nhtsaResponse.ok) {
    throw new Error(`NHTSA API error: ${nhtsaResponse.status}`);
  }

  const data = await nhtsaResponse.json();
  const results = data?.Results || [];

  const sanitize = (value: string | undefined) => {
    const s = (value ?? '').toString().trim();
    if (!s) return '';
    const bad = new Set([
      '0',
      'NOT APPLICABLE',
      'NULL',
      'N/A',
      'NONE',
      'UNKNOWN',
    ]);
    return bad.has(s.toUpperCase()) ? '' : s;
  };

  const getVal = (key: string) =>
    sanitize(
      results.find(
        (r: { Variable: string; Value: string }) => r.Variable === key
      )?.Value
    );

  const vehicle = {
    vin,
    make: getVal('Make'),
    model: getVal('Model'),
    year: getVal('Model Year'),
    bodyClass: getVal('Body Class'),
    engineType: getVal('Engine Type'),
    fuelType: getVal('Fuel Type - Primary'),
    driveType: getVal('Drive Type'),
    transmissionStyle: getVal('Transmission Style'),
    trim: getVal('Trim'),
    vehicleType: getVal('Vehicle Type'),
  };

  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  logger.info(`Successfully decoded VIN for ${vehicleDesc}`);

  return vehicle;
}

async function lookupNhtsaRecalls(vinInput: string) {
  const vin = vinInput.trim().toUpperCase();
  if (vin.length !== 17) {
    throw new Error('Valid 17-character VIN required');
  }

  const recallsUrl =
    'https://api.nhtsa.gov/recalls/recallsByVehicle?vin=' +
    encodeURIComponent(vin);
  const recallsResponse = await fetch(recallsUrl);

  if (!recallsResponse.ok) {
    throw new Error(`NHTSA recalls API error: ${recallsResponse.status}`);
  }

  const recallsData = await recallsResponse.json();
  const recalls = Array.isArray(recallsData?.results)
    ? recallsData.results
    : [];

  return recalls.map((item: Record<string, unknown>) => ({
    campaignNumber: (item['NHTSACampaignNumber'] || '').toString(),
    reportReceivedDate: (item['ReportReceivedDate'] || '').toString(),
    component: (item['Component'] || '').toString(),
    summary: (item['Summary'] || '').toString(),
    consequence: (item['Conequence'] || item['Consequence'] || '').toString(),
    remedy: (item['Remedy'] || '').toString(),
    manufacturer: (item['Manufacturer'] || '').toString(),
  }));
}

function hashToSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let currentSeed = seed;

  for (let i = copy.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
    const j = currentSeed % (i + 1);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy;
}

function normalizeLocationText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function buildLocalServiceProviders(
  locationQuery: string,
  radiusMiles: number,
  maxResults: number,
  vehicleMake?: string,
  providerTypeFilter: 'all' | 'repair_shop' | 'dealership' = 'all'
): LocalServiceProvider[] {
  const normalizedLocation = normalizeLocationText(locationQuery);
  const focusMake = (vehicleMake || '').trim();
  const seed = hashToSeed(`${normalizedLocation}:${focusMake}`);

  const repairShopTemplates = [
    { name: 'Precision Auto Care', specialties: ['Oil Change', 'Brakes'] },
    {
      name: 'Neighborhood Garage Works',
      specialties: ['Diagnostics', 'Engine Repair'],
    },
    {
      name: 'Summit Tire & Service',
      specialties: ['Tires', 'Alignment', 'Suspension'],
    },
    {
      name: 'Main Street Auto Clinic',
      specialties: ['Transmission', 'AC Service'],
    },
  ];

  const dealerTemplates = [
    {
      name: `${focusMake || 'Certified'} Auto Center`,
      specialties: ['Factory Service', 'Warranty Repairs'],
    },
    {
      name: `${focusMake || 'Premier'} Motors`,
      specialties: ['Certified Pre-Owned', 'Recall Service'],
    },
    {
      name: 'Metro Auto Dealership',
      specialties: ['OEM Parts', 'Service Packages'],
    },
  ];

  const providers: LocalServiceProvider[] = [
    ...repairShopTemplates.map((template, index) => ({
      id: `repair-${index + 1}`,
      type: 'repair_shop' as const,
      name: template.name,
      distanceMiles: Math.max(1, Math.min(radiusMiles, 2 + index * 3)),
      address: `${100 + index * 11} Service Ave, ${normalizedLocation}`,
      phone: `+1-555-01${(index + 10).toString()}`,
      website: `https://example.com/repair/${index + 1}`,
      rating: 4.2 + (index % 3) * 0.2,
      specialties: template.specialties,
    })),
    ...dealerTemplates.map((template, index) => ({
      id: `dealer-${index + 1}`,
      type: 'dealership' as const,
      name: template.name,
      distanceMiles: Math.max(2, Math.min(radiusMiles, 4 + index * 5)),
      address: `${400 + index * 13} Dealer Blvd, ${normalizedLocation}`,
      phone: `+1-555-02${(index + 20).toString()}`,
      website: `https://example.com/dealer/${index + 1}`,
      rating: 4.0 + (index % 3) * 0.3,
      specialties: template.specialties,
    })),
  ];

  const filteredProviders =
    providerTypeFilter === 'all'
      ? providers
      : providers.filter(provider => provider.type === providerTypeFilter);

  return deterministicShuffle(filteredProviders, seed)
    .slice(0, maxResults)
    .map((provider, index) => ({
      ...provider,
      distanceMiles: Number(
        Math.min(radiusMiles, provider.distanceMiles + index * 0.4).toFixed(1)
      ),
      rating: Number(Math.min(5, provider.rating).toFixed(1)),
    }));
}

// VIN decoding function
export const decodeVIN = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { vin } = request.body;
      if (!vin || typeof vin !== 'string') {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }
      const vehicle = await decodeVinData(vin);

      response.json({
        success: true,
        vehicle,
      });
    } catch (error) {
      logger.error('VIN decoding error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to decode VIN',
      });
    }
  }
);

export const decodeVINCallable = onCall(async request => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const vin = (request.data?.vin || '').toString();
  if (vin.length !== 17) {
    throw new HttpsError('invalid-argument', 'Valid 17-character VIN required');
  }

  try {
    const vehicle = await decodeVinData(vin);
    return {
      success: true,
      vehicle,
    };
  } catch (error) {
    logger.error('VIN callable decoding error:', error);
    throw new HttpsError('internal', 'Failed to decode VIN');
  }
});

export const getVehicleInsightsCallable = onCall(async request => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const vin = (request.data?.vin || '').toString();
  if (vin.length !== 17) {
    throw new HttpsError('invalid-argument', 'Valid 17-character VIN required');
  }

  try {
    const normalizedVin = vin.trim().toUpperCase();
    const [vehicleResult, recallsResult] = await Promise.allSettled([
      decodeVinData(normalizedVin),
      lookupNhtsaRecalls(normalizedVin),
    ]);

    if (vehicleResult.status !== 'fulfilled') {
      logger.error('VIN profile lookup failed', {
        vinPrefix: normalizedVin.substring(0, 8),
        error: vehicleResult.reason,
      });
      throw new HttpsError('internal', 'Failed to decode VIN profile');
    }

    const vehicle = vehicleResult.value;
    const recalls =
      recallsResult.status === 'fulfilled' ? recallsResult.value : [];
    const recallsSource =
      recallsResult.status === 'fulfilled'
        ? 'NHTSA'
        : 'NHTSA (temporarily unavailable)';

    if (recallsResult.status !== 'fulfilled') {
      logger.warn('VIN recalls lookup failed, returning fallback recalls', {
        vinPrefix: normalizedVin.substring(0, 8),
        error: recallsResult.reason,
      });
    }

    const integrationConfig = getIntegrationConfig();

    return {
      success: true,
      vin: normalizedVin,
      free: {
        vinProfile: vehicle,
        recalls: {
          source: recallsSource,
          count: recalls.length,
          items: recalls,
        },
      },
      paid: {
        manuals: {
          enabled: integrationConfig.features.manualsEnabled,
          provider: integrationConfig.providers.manuals,
        },
        warranty: {
          enabled: integrationConfig.features.warrantyEnabled,
          provider: integrationConfig.providers.warranty,
        },
        maintenancePlan: {
          enabled: integrationConfig.features.maintenancePlanEnabled,
          provider: integrationConfig.providers.schedule,
        },
      },
      sources: {
        free: ['NHTSA vPIC', 'NHTSA Recalls API'],
        paid: [
          'Owner Manuals Provider',
          'Warranty Provider',
          'Maintenance Schedule Provider',
        ],
      },
      warnings:
        recallsResult.status === 'fulfilled'
          ? []
          : ['Recalls data temporarily unavailable; VIN profile returned.'],
    };
  } catch (error) {
    logger.error('Vehicle insights callable error:', error);
    throw new HttpsError('internal', 'Failed to fetch vehicle insights');
  }
});

export const getLocalServiceProvidersCallable = onCall(async request => {
  const authRequired =
    (process.env.INTEGRATION_AUTH_REQUIRED || 'true').trim().toLowerCase() !==
    'false';

  if (authRequired && !request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const { locationQuery, radiusMiles, maxResults, vehicleMake, providerType } =
    (request.data as {
      locationQuery?: string;
      radiusMiles?: number;
      maxResults?: number;
      vehicleMake?: string;
      providerType?: 'all' | 'repair_shop' | 'dealership';
    }) ?? {};

  const normalizedLocation = normalizeLocationText(
    (locationQuery || '').toString()
  );
  if (!normalizedLocation || normalizedLocation.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'locationQuery is required to find nearby providers'
    );
  }

  const safeRadius = Number.isFinite(Number(radiusMiles))
    ? Math.max(5, Math.min(100, Number(radiusMiles)))
    : 25;
  const safeMaxResults = Number.isFinite(Number(maxResults))
    ? Math.max(1, Math.min(25, Number(maxResults)))
    : 8;
  const allowedProviderTypes = new Set(['all', 'repair_shop', 'dealership']);
  const safeProviderType = allowedProviderTypes.has(providerType || '')
    ? (providerType as 'all' | 'repair_shop' | 'dealership')
    : 'all';

  const providers = buildLocalServiceProviders(
    normalizedLocation,
    safeRadius,
    safeMaxResults,
    vehicleMake,
    safeProviderType
  );

  return {
    success: true,
    source: 'location_fallback',
    locationQuery: normalizedLocation,
    radiusMiles: safeRadius,
    providerType: safeProviderType,
    providers,
  };
});

// Email reminder function
export const sendMaintenanceReminder = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { email, vehicle, maintenanceItems } = request.body;

      if (
        !email ||
        !vehicle ||
        !maintenanceItems ||
        !Array.isArray(maintenanceItems)
      ) {
        response.status(400).json({
          error: 'Missing required fields: email, vehicle, maintenanceItems',
        });
        return;
      }

      logger.info(
        `Sending maintenance reminder to ${email} for ` +
          `${vehicle.make} ${vehicle.model}`
      );

      // For now, we'll log the email content. In production, integrate
      // with SendGrid
      const emailContent = {
        to: email,
        subject:
          `Maintenance Reminder: ${vehicle.make} ` +
          `${vehicle.model} (${vehicle.year})`,
        html:
          `
          <h2>Vehicle Maintenance Reminder</h2>
          <p>Your <strong>${vehicle.year} ${vehicle.make} ` +
          `${vehicle.model}</strong>
          (VIN: ${vehicle.vin}) is due for maintenance:</p>
          <ul>
            ${maintenanceItems
              .map(
                item =>
                  `<li><strong>${item.title}</strong> - Due: ${item.dueDate}</li>`
              )
              .join('')}
          </ul>
          <p>Please schedule these services soon to keep your vehicle ` +
          `in optimal condition.</p>
          <br>
          <p>Vehicle Vitals Team</p>
        `,
        text: `
          Vehicle Maintenance Reminder

          Your ${vehicle.year} ${vehicle.make} ${vehicle.model}
          (VIN: ${vehicle.vin}) is due for maintenance:

          ${maintenanceItems
            .map(item => `- ${item.title} - Due: ${item.dueDate}`)
            .join('\n')}

          Please schedule these services soon to keep your vehicle
          in optimal condition.

          Vehicle Vitals Team
        `,
      };

      await sendEmail(emailContent);

      response.json({
        success: true,
        message: 'Reminder email sent',
      });
    } catch (error) {
      logger.error('Email reminder error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to send reminder email',
      });
    }
  }
);

// Scheduled function to check for upcoming maintenance (runs daily)
export const checkMaintenanceReminders = onSchedule('0 9 * * *', async () => {
  await runMaintenanceReminderSchedule();
});

/**
 * Execute one scheduled reminder run with logging and error swallowing.
 * @param {Partial<ReminderScheduleRunDependencies>} dependencies Optional
 * injected dependencies for tests
 * @return {Promise<ReminderSweepSummary | null>} Sweep summary on success
 */
export async function runMaintenanceReminderSchedule(
  dependencies?: Partial<ReminderScheduleRunDependencies>
): Promise<ReminderSweepSummary | null> {
  const runSweep = dependencies?.runSweep || runMaintenanceReminderSweep;
  const onInfo = dependencies?.onInfo || logger.info;
  const onError = dependencies?.onError || logger.error;

  onInfo('Checking for maintenance reminders...');

  try {
    const summary = await runSweep();
    onInfo('Maintenance reminder check completed', summary);
    return summary;
  } catch (error) {
    onError('Error checking maintenance reminders:', error);
    return null;
  }
}

/**
 * Execute scheduled reminder eligibility checks and email dispatch.
 * @param {ReminderSweepDependencies} dependencies Optional injected deps
 * @return {Promise<ReminderSweepSummary>} Sweep counts for observability/tests
 */
export async function runMaintenanceReminderSweep(
  dependencies?: Partial<ReminderSweepDependencies>
): Promise<ReminderSweepSummary> {
  const queryDocuments =
    dependencies?.queryDocuments ||
    FirestoreCrudHelpers.queryDocuments.bind(FirestoreCrudHelpers);
  const resolveUpcomingMaintenance =
    dependencies?.getUpcomingMaintenance || getUpcomingMaintenance;
  const deliverReminderEmail =
    dependencies?.sendReminderEmail || sendReminderEmail;
  const deliverPushNotification =
    dependencies?.sendPushNotification || sendPushNotification;

  const users = await queryDocuments('users');

  let usersScanned = 0;
  let vehiclesScanned = 0;
  let remindersSent = 0;
  let reminderFailures = 0;
  let pushSent = 0;
  let pushFailures = 0;

  for (const user of users) {
    usersScanned += 1;

    const emailRemindersEnabled = user.emailRemindersEnabled !== false;

    const userId = (user.id || '').toString();
    if (!userId) {
      continue;
    }

    const vehicles = await queryDocuments(`users/${userId}/vehicles`);

    // Extract FCM token from the preferences doc (virtual vehicle record).
    const prefsDoc = (vehicles as any[]).find(v => v.id === '__preferences__');
    const userFcmToken: string = (prefsDoc?.fcmToken || '').toString();

    for (const vehicle of vehicles as Vehicle[]) {
      // Skip the preferences sentinel – it is not a real vehicle.
      if ((vehicle as any).id === '__preferences__') {
        continue;
      }

      vehiclesScanned += 1;
      const upcomingMaintenance = await resolveUpcomingMaintenance(vehicle, 30);

      if (upcomingMaintenance.length === 0) {
        continue;
      }

      if (emailRemindersEnabled && user.email) {
        try {
          await deliverReminderEmail(user.email, vehicle, upcomingMaintenance);
          remindersSent += 1;
        } catch (error) {
          reminderFailures += 1;
          logger.error('Reminder email delivery failed', {
            userId,
            email: user.email,
            vin: vehicle.vin,
            error,
          });
        }
      }

      if (userFcmToken) {
        try {
          await deliverPushNotification(
            userFcmToken,
            vehicle,
            upcomingMaintenance
          );
          pushSent += 1;
        } catch (pushError) {
          pushFailures += 1;
          logger.warn('Push notification delivery failed', {
            userId,
            vin: vehicle.vin,
            pushError,
          });
        }
      }
    }
  }

  return {
    usersScanned,
    vehiclesScanned,
    remindersSent,
    reminderFailures,
    pushSent,
    pushFailures,
  };
}

/**
 * Helper function to get upcoming maintenance items for a vehicle
 * @param {Vehicle} vehicle The vehicle to check for upcoming maintenance
 * @param {number} daysAhead Number of days to look ahead for maintenance
 * @return {Promise<MaintenanceItem[]>} Array of upcoming maintenance items
 */
async function getUpcomingMaintenance(
  vehicle: Vehicle,
  daysAhead = 30
): Promise<MaintenanceItem[]> {
  // Get maintenance entries using FirestoreCrudHelpers
  const maintenanceEntries = await FirestoreCrudHelpers.queryDocuments(
    `users/${vehicle.uid || 'unknown'}/vehicles/${vehicle.vin}/maintenance`
  );

  return deriveUpcomingMaintenanceItems(maintenanceEntries, daysAhead);
}

/**
 * Build upcoming maintenance reminders from maintenance history entries.
 * @param {MaintenanceEntry[]} maintenanceEntries User maintenance history
 * @param {number} daysAhead Number of days to look ahead for reminders
 * @return {MaintenanceItem[]} Array of upcoming maintenance items
 */
export function deriveUpcomingMaintenanceItems(
  maintenanceEntries: MaintenanceEntry[],
  daysAhead = 30
): MaintenanceItem[] {
  // This is a simplified version - in practice, you'd need manufacturer
  // schedules. For now, we'll check existing maintenance entries and look
  // for patterns
  const upcomingItems: MaintenanceItem[] = [];
  const now = new Date();
  const normalizedDaysAhead = Math.max(1, daysAhead);

  // Simple logic: if no maintenance in last 6 months, suggest oil change
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  let hasRecentOilChange = false;
  maintenanceEntries.forEach((entry: MaintenanceEntry) => {
    let entryDate: Date;
    if (entry.date instanceof Date) {
      entryDate = entry.date;
    } else if (typeof entry.date === 'string') {
      entryDate = new Date(entry.date);
    } else if (entry.date && typeof entry.date.toDate === 'function') {
      entryDate = entry.date.toDate();
    } else {
      return; // Skip invalid dates
    }

    if (
      entry.title?.toLowerCase().includes('oil') &&
      entryDate > sixMonthsAgo
    ) {
      hasRecentOilChange = true;
    }
  });

  if (!hasRecentOilChange) {
    const dueDateLabel =
      normalizedDaysAhead <= 30
        ? `Within ${normalizedDaysAhead} days`
        : 'Within 1 month';

    upcomingItems.push({
      title: 'Oil Change',
      dueDate: dueDateLabel,
      type: 'preventive',
    });
  }

  return upcomingItems;
}

/**
 * Helper function to send reminder email (placeholder)
 * @param {string} email The recipient email address
 * @param {Vehicle} vehicle The vehicle information
 * @param {MaintenanceItem[]} maintenanceItems Array of maintenance items due
 */
async function sendReminderEmail(
  email: string,
  vehicle: Vehicle,
  maintenanceItems: MaintenanceItem[]
): Promise<void> {
  const emailContent = {
    to: email,
    subject:
      `Maintenance Reminder: ${vehicle.make} ` +
      `${vehicle.model} (${vehicle.year})`,
    html: `
        <h2>Vehicle Maintenance Reminder</h2>
        <p>Your
        <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong>
        (VIN: ${vehicle.vin}) is due for maintenance:</p>
        <ul>
          ${maintenanceItems
            .map(
              item =>
                `<li><strong>${item.title}</strong> - Due: ${item.dueDate}</li>`
            )
            .join('')}
        </ul>
        <p>
        Please schedule these services soon to keep your vehicle in
        optimal condition.
        </p>
        <br>
        <p>Vehicle Vitals Team</p>
      `,
    text: `
      Vehicle Maintenance Reminder

      Your ${vehicle.year} ${vehicle.make} ${vehicle.model}
      (VIN: ${vehicle.vin}) is due for maintenance:

      ${maintenanceItems
        .map(item => `- ${item.title} - Due: ${item.dueDate}`)
        .join('\n')}

      Please schedule these services soon to keep your vehicle in
      optimal condition.

      Vehicle Vitals Team
    `,
  };

  await sendEmail(emailContent);
}

/**
 * Send an FCM push notification for upcoming maintenance items.
 * @param {string} fcmToken The recipient's Firebase Cloud Messaging token
 * @param {Vehicle} vehicle The vehicle with upcoming maintenance
 * @param {MaintenanceItem[]} maintenanceItems Items due for service
 * @return {Promise<void>}
 */
async function sendPushNotification(
  fcmToken: string,
  vehicle: Vehicle,
  maintenanceItems: MaintenanceItem[]
): Promise<void> {
  const firstItem = maintenanceItems[0];
  const title = [
    'Maintenance due:',
    String(vehicle.year),
    vehicle.make,
    vehicle.model,
  ].join(' ');
  const body =
    maintenanceItems.length === 1
      ? `${firstItem.title} — Due: ${firstItem.dueDate}`
      : `${firstItem.title} and ` +
        `${maintenanceItems.length - 1} more service(s) due`;

  await admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
    data: {
      vin: vehicle.vin,
      type: 'maintenance_reminder',
    },
  });
}

// API roadmap scaffolds for cross-platform integrations.
// These handlers provide stable contracts while provider
// integrations are built.

export const getOwnerManuals = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'getOwnerManuals')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const vin = ((request.query.vin as string) || '').trim().toUpperCase();
      if (!vin || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      const config = getIntegrationConfig();
      if (!config.features.manualsEnabled) {
        response.status(503).json({
          success: false,
          error: 'Owner manual feature is disabled',
          provider: config.providers.manuals,
          vin,
          manuals: [],
        });
        return;
      }

      if (config.providers.manuals !== 'manuals_primary') {
        response.status(501).json({
          success: false,
          error: 'Owner manual provider integration not implemented',
          provider: config.providers.manuals,
          vin,
          manuals: [],
        });
        return;
      }

      const cachedManuals = await readIntegrationCache<unknown[]>(
        uid,
        vin,
        'manuals'
      );
      if (cachedManuals.hit && Array.isArray(cachedManuals.value)) {
        response.json({
          success: true,
          provider: config.providers.manuals,
          vin,
          manuals: cachedManuals.value,
          cache: { hit: true },
        });
        return;
      }

      const manuals = await lookupOwnerManuals(vin);
      await writeIntegrationCache(uid, vin, 'manuals', manuals);
      response.json({
        success: true,
        provider: config.providers.manuals,
        vin,
        manuals,
        cache: { hit: false },
      });
    } catch (error) {
      logger.error('Owner manual lookup error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to fetch owner manuals',
      });
    }
  }
);

export const getWarrantySummary = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'getWarrantySummary')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const vin = ((request.query.vin as string) || '').trim().toUpperCase();
      if (!vin || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      const mileageRaw = Number(request.query.currentMileage ?? '');
      const currentMileage = Number.isFinite(mileageRaw)
        ? mileageRaw
        : undefined;

      const config = getIntegrationConfig();
      if (!config.features.warrantyEnabled) {
        response.status(503).json({
          success: false,
          error: 'Warranty feature is disabled',
          provider: config.providers.warranty,
          vin,
          warranty: null,
        });
        return;
      }

      if (config.providers.warranty !== 'warranty_primary') {
        response.status(501).json({
          success: false,
          error: 'Warranty provider integration not implemented',
          provider: config.providers.warranty,
          vin,
          warranty: null,
        });
        return;
      }

      const cachedWarranty = await readIntegrationCache<unknown>(
        uid,
        vin,
        'warranty'
      );
      if (cachedWarranty.hit && cachedWarranty.value) {
        response.json({
          success: true,
          provider: config.providers.warranty,
          vin,
          warranty: cachedWarranty.value,
          cache: { hit: true },
        });
        return;
      }

      const warranty = await lookupWarrantySummary(vin, currentMileage);
      await writeIntegrationCache(uid, vin, 'warranty', warranty);
      response.json({
        success: true,
        provider: config.providers.warranty,
        vin,
        warranty,
        cache: { hit: false },
      });
    } catch (error) {
      logger.error('Warranty summary error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to fetch warranty summary',
      });
    }
  }
);

export const getMaintenancePlan = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'getMaintenancePlan')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const vin = ((request.query.vin as string) || '').trim().toUpperCase();
      const currentMileage = Number(request.query.currentMileage ?? '');

      if (!vin || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      if (!Number.isFinite(currentMileage) || currentMileage < 0) {
        response
          .status(400)
          .json({ error: 'Valid currentMileage is required' });
        return;
      }

      const config = getIntegrationConfig();
      if (!config.features.maintenancePlanEnabled) {
        response.status(503).json({
          success: false,
          error: 'Maintenance plan feature is disabled',
          provider: config.providers.schedule,
          vin,
          plan: null,
        });
        return;
      }

      if (config.providers.schedule !== 'schedule_primary') {
        response.status(501).json({
          success: false,
          error: 'Maintenance schedule provider integration not implemented',
          provider: config.providers.schedule,
          vin,
          plan: null,
        });
        return;
      }

      const plan = buildMaintenancePlan(currentMileage);
      response.json({
        success: true,
        provider: config.providers.schedule,
        vin,
        plan,
      });
    } catch (error) {
      logger.error('Maintenance plan error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to build maintenance plan',
      });
    }
  }
);

export const createCalendarEvent = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'createCalendarEvent')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }
      response.json(buildCalendarEventResponse(request.body));
    } catch (error) {
      if (error instanceof HttpsError) {
        const codeToStatus: Record<string, number> = {
          'invalid-argument': 400,
          unauthenticated: 401,
          'failed-precondition': 503,
          unimplemented: 501,
        };
        const status = codeToStatus[error.code] || 500;
        response.status(status).json({ success: false, error: error.message });
        return;
      }

      logger.error('Calendar event error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to create calendar event',
      });
    }
  }
);

/**
 * Shared calendar event creation contract used by HTTP and callable triggers.
 * @param {unknown} input Raw request payload
 * @return {object} Success payload with normalized event data
 */
function buildCalendarEventResponse(input: unknown) {
  const { vehicleVin, title, startAt, target, description, endAt } =
    (input as {
      vehicleVin?: string;
      title?: string;
      startAt?: string;
      target?: 'google' | 'apple' | 'ics';
      description?: string;
      endAt?: string;
    }) ?? {};

  const vin = (vehicleVin || '').toString().trim().toUpperCase();
  const allowedTargets = new Set(['google', 'apple', 'ics']);

  if (!vin || vin.length !== 17) {
    throw new HttpsError(
      'invalid-argument',
      'Valid 17-character vehicleVin required'
    );
  }

  if (!title || !startAt || !target || !allowedTargets.has(target)) {
    throw new HttpsError(
      'invalid-argument',
      'Required fields: title, startAt, target (google|apple|ics)'
    );
  }

  const config = getIntegrationConfig();
  if (!config.features.calendarEnabled) {
    throw new HttpsError('failed-precondition', 'Calendar feature is disabled');
  }

  if (config.providers.calendar !== 'calendar_primary') {
    throw new HttpsError(
      'unimplemented',
      'Calendar provider integration not implemented'
    );
  }

  const eventInput = {
    vehicleVin: vin,
    title,
    description,
    startAt,
    endAt,
    target,
  };

  const event =
    target === 'google'
      ? buildGoogleCalendarEvent(eventInput)
      : target === 'apple'
        ? buildAppleCalendarEvent(eventInput)
        : buildIcsEvent(eventInput);

  return {
    success: true,
    provider: config.providers.calendar,
    vehicleVin: vin,
    event: {
      target,
      ...event,
    },
  };
}

export const createCalendarEventCallable = onCall(async request => {
  const authRequired =
    (process.env.INTEGRATION_AUTH_REQUIRED || 'true').trim().toLowerCase() !==
    'false';

  if (authRequired && !request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  try {
    return buildCalendarEventResponse(request.data);
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('Callable calendar event error:', error);
    throw new HttpsError('internal', 'Failed to create calendar event');
  }
});

export const verifyPremiumPurchase = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const { productId, purchaseId, verificationData, source } =
    (request.data as {
      productId?: string;
      purchaseId?: string;
      verificationData?: string;
      source?: string;
    }) ?? {};

  if (productId !== 'premium_ad_free') {
    throw new HttpsError('invalid-argument', 'Unsupported premium productId');
  }

  const receipt = (verificationData || '').trim();
  if (!receipt) {
    throw new HttpsError(
      'invalid-argument',
      'verificationData is required for premium verification'
    );
  }

  const receiptHash = createHash('sha256').update(receipt).digest('hex');
  const purchaseSource = (source || 'unknown').toString();

  const verification = await verifyPremiumReceipt({
    productId,
    source: purchaseSource,
    receipt,
  });

  const strictVerification =
    (process.env.PREMIUM_VERIFICATION_REQUIRED || 'false')
      .trim()
      .toLowerCase() === 'true';

  if (strictVerification && !verification.verified) {
    throw new HttpsError(
      'failed-precondition',
      verification.reason ||
        'Premium receipt verification failed in strict verification mode'
    );
  }

  const db = admin.firestore();
  const receiptRef = db.doc(`premiumReceipts/${receiptHash}`);
  const entitlementRef = db.doc(`users/${uid}/entitlements/premium`);

  await db.runTransaction(async tx => {
    const receiptSnap = await tx.get(receiptRef);
    if (receiptSnap.exists) {
      const existingUid = (receiptSnap.data()?.uid || '').toString();
      if (existingUid && existingUid !== uid) {
        throw new HttpsError(
          'permission-denied',
          'Receipt is already linked to another account'
        );
      }
    }

    tx.set(
      receiptRef,
      {
        uid,
        productId,
        source: purchaseSource,
        purchaseId: (purchaseId || '').toString(),
        receiptHash,
        verified: verification.verified,
        verificationState: verification.verificationState,
        verificationProvider: verification.provider,
        verificationReason: (verification.reason || '').toString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      entitlementRef,
      {
        active: true,
        productId,
        source: purchaseSource,
        purchaseId: (purchaseId || '').toString(),
        receiptHash,
        verificationState: verification.verificationState,
        verified: verification.verified,
        verificationProvider: verification.provider,
        verificationReason: (verification.reason || '').toString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return {
    success: true,
    entitlement: {
      premium: true,
      verified: verification.verified,
      verificationState: verification.verificationState,
    },
  };
});

export const getPremiumEntitlement = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const entitlementSnap = await admin
    .firestore()
    .doc(`users/${uid}/entitlements/premium`)
    .get();

  const data = entitlementSnap.data() || {};
  return {
    success: true,
    entitlement: {
      premium: data.active === true,
      verified: data.verified === true,
      verificationState: (data.verificationState || 'none').toString(),
      productId: (data.productId || '').toString(),
      updatedAt: data.updatedAt || null,
    },
  };
});
