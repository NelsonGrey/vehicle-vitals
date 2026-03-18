/**
 * demoPdfGenerator.ts
 *
 * Generates realistic-looking demo PDF documents for each vehicle record type
 * using jsPDF (already a project dependency).  The produced PDFs contain real
 * text content — vehicle VIN, make/model/year, dollar amounts, dates, mileage —
 * so the attachment-analysis callable can extract structured data from them.
 *
 * Document types modelled after their real-world counterparts:
 *   Bill of Sale, Bank Financing Statement, Service/Repair Invoice,
 *   Oil Change Receipt, Fuel Receipt, Registration Certificate,
 *   Insurance Declarations Page, Safety Inspection Report.
 */

import jsPDF from 'jspdf';

// ─── shared types ──────────────────────────────────────────────────────────

export interface VehicleInfo {
  vin: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  purchaseDate: string;
  licensePlate?: string;
  nickname?: string;
  fuelType?: string;
}

export interface GeneratedDoc {
  blob: Blob;
  fileName: string;
  type: string;
  /** Maps to a portfolio item id (e.g. 'bill_of_sale', 'service_history') */
  portfolioItemId: string;
  /** Key text lines the backend callable can parse as OCR text */
  extractedText: string;
}

// ─── internal layout helpers ───────────────────────────────────────────────

function headerBar(doc: jsPDF, title: string, subtitle?: string): void {
  doc.setFillColor(30, 64, 120);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 10, 10);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 10, 17);
  }
  doc.setTextColor(30, 30, 30);
}

function sectionLabel(doc: jsPDF, label: string, y: number): void {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(label.toUpperCase(), 10, y);
  doc.setDrawColor(180, 180, 180);
  doc.line(10, y + 1, 200, y + 1);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
}

function row(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  indent = 10
): void {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label}:`, indent, y);
  doc.setFont('helvetica', 'normal');
  doc.text(value, indent + 55, y);
}

function footerLine(doc: jsPDF, text: string): void {
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(text, 10, pageH - 8);
  doc.setTextColor(30, 30, 30);
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ─── individual document generators ───────────────────────────────────────

export function generateBillOfSale(
  vehicle: VehicleInfo,
  purchasePrice: number,
  dealer: string
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'VEHICLE BILL OF SALE', dealer);

  let y = 30;
  sectionLabel(doc, 'Seller / Dealer', y);
  y += 7;
  row(doc, 'Dealer Name', dealer, y);
  y += 6;
  row(doc, 'Address', '1200 Auto Row Blvd, Chicago IL 60601', y);
  y += 6;
  row(doc, 'License #', 'IL-DLR-48291', y);

  y += 10;
  sectionLabel(doc, 'Vehicle Identification', y);
  y += 7;
  row(
    doc,
    'Year / Make / Model',
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    y
  );
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);
  y += 6;
  row(doc, 'License Plate', vehicle.licensePlate ?? 'N/A', y);
  y += 6;
  row(
    doc,
    'Odometer',
    `${parseInt(vehicle.mileage, 10).toLocaleString()} miles`,
    y
  );

  y += 10;
  sectionLabel(doc, 'Sale Terms', y);
  y += 7;
  row(doc, 'Sale Date', vehicle.purchaseDate, y);
  y += 6;
  row(
    doc,
    'Sale Price',
    `$${purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    y
  );
  y += 6;
  row(doc, 'Sales Tax (8.25%)', `$${(purchasePrice * 0.0825).toFixed(2)}`, y);
  y += 6;
  row(doc, 'Title & Doc Fees', '$395.00', y);
  y += 6;
  const total = purchasePrice + purchasePrice * 0.0825 + 395;
  row(doc, 'TOTAL DUE', `$${total.toFixed(2)}`, y);

  y += 14;
  doc.setFontSize(8);
  doc.text(
    'Seller Signature: __________________________   Date: ___________',
    10,
    y
  );
  y += 8;
  doc.text(
    'Buyer Signature:  __________________________   Date: ___________',
    10,
    y
  );

  footerLine(
    doc,
    `Bill of Sale · VIN ${vehicle.vin} · ${vehicle.purchaseDate} · Page 1 of 1`
  );
  return doc.output('blob');
}

export function generateFinancingStatement(
  vehicle: VehicleInfo,
  lender: string,
  loanBalance: number,
  monthlyPayment: number,
  statementDate: string,
  paymentsMade: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'AUTO LOAN MONTHLY STATEMENT', lender);

  let y = 30;
  sectionLabel(doc, 'Account Summary', y);
  y += 7;
  row(doc, 'Statement Date', statementDate, y);
  y += 6;
  row(doc, 'Account #', `AUTO-${vehicle.vin.slice(-6)}`, y);
  y += 6;
  row(doc, 'Vehicle', `${vehicle.year} ${vehicle.make} ${vehicle.model}`, y);
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);

  y += 10;
  sectionLabel(doc, 'Payment Information', y);
  y += 7;
  row(doc, 'Monthly Payment', `$${monthlyPayment.toFixed(2)}`, y);
  y += 6;
  row(doc, 'Payment Due Date', `${statementDate.slice(0, 7)}-01`, y);
  y += 6;
  row(doc, 'Payments Made', `${paymentsMade} of 60`, y);
  y += 6;
  row(doc, 'Remaining Balance', `$${loanBalance.toFixed(2)}`, y);
  y += 6;
  row(
    doc,
    'Principal Paid',
    `$${(monthlyPayment * paymentsMade * 0.62).toFixed(2)}`,
    y
  );
  y += 6;
  row(
    doc,
    'Interest Paid',
    `$${(monthlyPayment * paymentsMade * 0.38).toFixed(2)}`,
    y
  );

  y += 10;
  sectionLabel(doc, 'Loan Details', y);
  y += 7;
  row(
    doc,
    'Original Loan Amount',
    `$${(loanBalance + monthlyPayment * paymentsMade).toFixed(2)}`,
    y
  );
  y += 6;
  row(doc, 'Interest Rate (APR)', '6.49%', y);
  y += 6;
  row(doc, 'Loan Term', '60 months', y);
  y += 6;
  row(doc, 'Origination Date', vehicle.purchaseDate, y);

  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'Please include your account number on your check. Online payments accepted at lender website.',
    10,
    y,
    { maxWidth: 190 }
  );

  footerLine(
    doc,
    `Loan Statement · ${lender} · Account AUTO-${vehicle.vin.slice(-6)} · ${statementDate}`
  );
  return doc.output('blob');
}

export function generateServiceInvoice(
  vehicle: VehicleInfo,
  shopName: string,
  serviceDate: string,
  mileage: number,
  services: Array<{ description: string; cost: number }>,
  laborCost: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'SERVICE & REPAIR INVOICE', shopName);

  let y = 30;
  sectionLabel(doc, 'Customer / Vehicle', y);
  y += 7;
  row(doc, 'Service Date', serviceDate, y);
  y += 6;
  row(doc, 'Vehicle', `${vehicle.year} ${vehicle.make} ${vehicle.model}`, y);
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);
  y += 6;
  row(doc, 'Odometer In', `${mileage.toLocaleString()} miles`, y);
  y += 6;
  row(doc, 'License', vehicle.licensePlate ?? 'N/A', y);

  y += 10;
  sectionLabel(doc, 'Services Performed', y);
  y += 7;

  let partsTotal = 0;
  for (const svc of services) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`• ${svc.description}`, 12, y);
    doc.text(`$${svc.cost.toFixed(2)}`, 175, y, { align: 'right' });
    partsTotal += svc.cost;
    y += 6;
  }

  y += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(10, y, 200, y);
  y += 6;
  row(doc, 'Parts Total', `$${partsTotal.toFixed(2)}`, y);
  y += 6;
  row(doc, 'Labor', `$${laborCost.toFixed(2)}`, y);
  y += 6;
  const tax = (partsTotal + laborCost) * 0.0825;
  row(doc, 'Tax', `$${tax.toFixed(2)}`, y);
  y += 6;
  const total = partsTotal + laborCost + tax;
  doc.setFont('helvetica', 'bold');
  row(doc, 'TOTAL', `$${total.toFixed(2)}`, y);
  doc.setFont('helvetica', 'normal');

  y += 10;
  sectionLabel(doc, 'Technician Notes', y);
  y += 7;
  doc.setFontSize(8);
  doc.text(
    `Vehicle inspected, all safety items within spec. Next service recommended at ${(mileage + 5000).toLocaleString()} miles or 6 months.`,
    10,
    y,
    { maxWidth: 190 }
  );

  footerLine(
    doc,
    `Invoice · ${shopName} · ${serviceDate} · VIN ${vehicle.vin}`
  );
  return doc.output('blob');
}

export function generateOilChangeReceipt(
  vehicle: VehicleInfo,
  shopName: string,
  serviceDate: string,
  mileage: number,
  oilType: string,
  totalCost: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'OIL CHANGE & LUBE SERVICE', shopName);

  let y = 30;
  sectionLabel(doc, 'Vehicle Information', y);
  y += 7;
  row(doc, 'Date', serviceDate, y);
  y += 6;
  row(doc, 'Vehicle', `${vehicle.year} ${vehicle.make} ${vehicle.model}`, y);
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);
  y += 6;
  row(doc, 'Odometer', `${mileage.toLocaleString()} miles`, y);

  y += 10;
  sectionLabel(doc, 'Services', y);
  y += 7;
  const oilCost = totalCost * 0.55;
  const filterCost = totalCost * 0.2;
  const laborCost = totalCost * 0.18;
  const taxCost = totalCost * 0.07;

  row(doc, `${oilType} Motor Oil (5 qt)`, `$${oilCost.toFixed(2)}`, y);
  y += 6;
  row(doc, 'Oil Filter', `$${filterCost.toFixed(2)}`, y);
  y += 6;
  row(doc, 'Labor', `$${laborCost.toFixed(2)}`, y);
  y += 6;
  row(doc, 'Tax', `$${taxCost.toFixed(2)}`, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  row(doc, 'TOTAL', `$${totalCost.toFixed(2)}`, y);
  doc.setFont('helvetica', 'normal');

  y += 10;
  sectionLabel(doc, 'Next Service', y);
  y += 7;
  row(doc, 'Due Mileage', `${(mileage + 5000).toLocaleString()} miles`, y);
  y += 6;
  row(doc, 'Due Date', addMonths(serviceDate, 6), y);

  footerLine(
    doc,
    `Oil Change Receipt · ${shopName} · ${serviceDate} · VIN ${vehicle.vin}`
  );
  return doc.output('blob');
}

export function generateFuelReceipt(
  vehicle: VehicleInfo,
  station: string,
  date: string,
  gallons: number,
  pricePerGallon: number,
  mileage: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'FUEL RECEIPT', station);

  const total = gallons * pricePerGallon;
  const isPremium =
    vehicle.fuelType?.toLowerCase().includes('premium') ?? false;

  let y = 30;
  sectionLabel(doc, 'Transaction', y);
  y += 7;
  row(doc, 'Date / Time', date, y);
  y += 6;
  row(doc, 'Station', station, y);
  y += 6;
  row(doc, 'Pump #', '3', y);
  y += 6;
  row(
    doc,
    'Fuel Grade',
    isPremium ? 'Super Premium (91)' : 'Regular Unleaded (87)',
    y
  );

  y += 10;
  sectionLabel(doc, 'Fuel Details', y);
  y += 7;
  row(doc, 'Gallons', gallons.toFixed(3), y);
  y += 6;
  row(doc, 'Price / Gallon', `$${pricePerGallon.toFixed(3)}`, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  row(doc, 'TOTAL AMOUNT', `$${total.toFixed(2)}`, y);
  doc.setFont('helvetica', 'normal');

  y += 10;
  sectionLabel(doc, 'Vehicle', y);
  y += 7;
  row(doc, 'Vehicle', `${vehicle.year} ${vehicle.make} ${vehicle.model}`, y);
  y += 6;
  row(doc, 'Odometer', `${mileage.toLocaleString()} miles`, y);

  footerLine(doc, `Fuel Receipt · ${station} · ${date}`);
  return doc.output('blob');
}

export function generateRegistration(
  vehicle: VehicleInfo,
  expiryDate: string,
  registrationFee: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(
    doc,
    'STATE OF ILLINOIS — VEHICLE REGISTRATION',
    'Secretary of State · Vehicle Services Dept.'
  );

  let y = 30;
  sectionLabel(doc, 'Registration Certificate', y);
  y += 7;
  row(doc, 'License Plate', vehicle.licensePlate ?? 'N/A', y);
  y += 6;
  row(doc, 'Registration #', `REG-${vehicle.vin.slice(-8)}`, y);
  y += 6;
  row(doc, 'Effective Date', vehicle.purchaseDate, y);
  y += 6;
  row(doc, 'Expiration Date', expiryDate, y);

  y += 10;
  sectionLabel(doc, 'Vehicle', y);
  y += 7;
  row(doc, 'Year', vehicle.year, y);
  y += 6;
  row(doc, 'Make / Model', `${vehicle.make} ${vehicle.model}`, y);
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);
  y += 6;
  row(doc, 'Fuel Type', vehicle.fuelType ?? 'Gasoline', y);

  y += 10;
  sectionLabel(doc, 'Fees Paid', y);
  y += 7;
  row(doc, 'Registration Fee', `$${registrationFee.toFixed(2)}`, y);
  y += 6;
  row(doc, 'State Tax', `$${(registrationFee * 0.12).toFixed(2)}`, y);
  y += 6;
  row(doc, 'TOTAL PAID', `$${(registrationFee * 1.12).toFixed(2)}`, y);

  footerLine(
    doc,
    `Registration Certificate · Illinois SOS · VIN ${vehicle.vin} · Exp ${expiryDate}`
  );
  return doc.output('blob');
}

export function generateInsuranceCard(
  vehicle: VehicleInfo,
  insurer: string,
  policyNumber: string,
  effectiveDate: string,
  expiryDate: string,
  annualPremium: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'INSURANCE DECLARATIONS PAGE', insurer);

  let y = 30;
  sectionLabel(doc, 'Policy Summary', y);
  y += 7;
  row(doc, 'Policy Number', policyNumber, y);
  y += 6;
  row(doc, 'Effective Date', effectiveDate, y);
  y += 6;
  row(doc, 'Expiration Date', expiryDate, y);
  y += 6;
  row(doc, 'Annual Premium', `$${annualPremium.toFixed(2)}`, y);

  y += 10;
  sectionLabel(doc, 'Insured Vehicle', y);
  y += 7;
  row(
    doc,
    'Year / Make / Model',
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    y
  );
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);
  y += 6;
  row(doc, 'License Plate', vehicle.licensePlate ?? 'N/A', y);

  y += 10;
  sectionLabel(doc, 'Coverage', y);
  y += 7;
  row(doc, 'Liability (Bodily)', '$100,000 / $300,000', y);
  y += 6;
  row(doc, 'Liability (Property)', '$100,000', y);
  y += 6;
  row(doc, 'Collision', '$500 deductible', y);
  y += 6;
  row(doc, 'Comprehensive', '$250 deductible', y);
  y += 6;
  row(doc, 'Roadside Assistance', 'Included', y);

  footerLine(
    doc,
    `Insurance Declarations · ${insurer} · Policy ${policyNumber} · Exp ${expiryDate}`
  );
  return doc.output('blob');
}

export function generateInspectionReport(
  vehicle: VehicleInfo,
  shopName: string,
  inspectionDate: string,
  mileage: number,
  passed: boolean,
  inspectionFee: number
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  headerBar(doc, 'VEHICLE SAFETY INSPECTION REPORT', shopName);

  let y = 30;
  sectionLabel(doc, 'Vehicle / Inspection', y);
  y += 7;
  row(doc, 'Inspection Date', inspectionDate, y);
  y += 6;
  row(doc, 'Vehicle', `${vehicle.year} ${vehicle.make} ${vehicle.model}`, y);
  y += 6;
  row(doc, 'VIN', vehicle.vin, y);
  y += 6;
  row(doc, 'Odometer', `${mileage.toLocaleString()} miles`, y);
  y += 6;
  row(doc, 'License Plate', vehicle.licensePlate ?? 'N/A', y);

  y += 10;
  sectionLabel(doc, 'Checklist Results', y);
  y += 7;
  const checkItems: [string, string][] = [
    ['Brakes', 'Pass'],
    ['Tires / Tread Depth', 'Pass'],
    ['Lights / Signals', 'Pass'],
    ['Windshield / Wipers', 'Pass'],
    ['Suspension', 'Pass'],
    ['Emissions (OBD)', passed ? 'Pass' : 'Fail — codes pending'],
    ['Horn', 'Pass'],
    ['Mirrors', 'Pass'],
  ];
  for (const [item, result] of checkItems) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`• ${item}`, 12, y);
    const isFail = result.startsWith('Fail');
    doc.setFont('helvetica', isFail ? 'bold' : 'normal');
    doc.setTextColor(isFail ? 180 : 30, 30, 30);
    doc.text(result, 120, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    y += 6;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`OVERALL RESULT: ${passed ? 'PASS' : 'FAIL'}`, 10, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  y += 10;
  row(doc, 'Inspection Fee', `$${inspectionFee.toFixed(2)}`, y);

  footerLine(
    doc,
    `Inspection Report · ${shopName} · ${inspectionDate} · VIN ${vehicle.vin}`
  );
  return doc.output('blob');
}

// ─── batch generator ───────────────────────────────────────────────────────

/**
 * Generate the full set of realistic demo PDFs for a vehicle.
 * The caller uploads each blob to Firebase Storage, then invokes the
 * analysis callable with `extractedText` as the `ocrText` hint so the
 * backend can produce structured analysis results immediately.
 */
export function generateAllDemoDocs(vehicle: VehicleInfo): GeneratedDoc[] {
  const mileageNum = parseInt(vehicle.mileage, 10) || 40000;
  const purchaseYear = parseInt(vehicle.purchaseDate.slice(0, 4), 10);
  const vinLast =
    parseInt(vehicle.vin.replace(/\D/g, '').slice(-4), 10) || 1234;
  const purchasePrice = 18000 + (vinLast % 20000);
  const dealer = `${vehicle.make} of Metro Chicago`;
  const insurer = ['State Farm', 'GEICO', 'Progressive', 'Allstate'][
    vinLast % 4
  ];
  const lender = [
    'Chase Auto Finance',
    'Capital One Auto',
    'Bank of America Auto',
    'Wells Fargo Auto',
  ][vinLast % 4];
  const shop1 = `${vehicle.make} Certified Service Center`;
  const shop2 = `${['Midas', 'Jiffy Lube', 'Firestone', 'Pep Boys'][vinLast % 4]} Auto`;
  const quickLube = `Quick Lube & Oil #${(vinLast % 9) + 1}`;
  const gasStation = `Shell #${(vinLast % 90) + 10}`;

  const docs: GeneratedDoc[] = [];

  // 1 ── Bill of Sale
  docs.push({
    blob: generateBillOfSale(vehicle, purchasePrice, dealer),
    fileName: `${vehicle.year}_${vehicle.make}_bill_of_sale.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'bill_of_sale',
    extractedText:
      `Bill of Sale ${vehicle.purchaseDate} ${vehicle.year} ${vehicle.make} ${vehicle.model} ` +
      `VIN ${vehicle.vin} Sale Price $${purchasePrice.toFixed(2)} ` +
      `Total $${(purchasePrice * 1.0825 + 395).toFixed(2)}`,
  });

  // 2 ── Financing statement (month 1)
  const loanBalance = purchasePrice * 0.85;
  const monthlyPayment = (loanBalance / 60) * 1.065;
  const stmt1Date = addMonths(vehicle.purchaseDate, 1);
  docs.push({
    blob: generateFinancingStatement(
      vehicle,
      lender,
      loanBalance,
      monthlyPayment,
      stmt1Date,
      1
    ),
    fileName: `${vehicle.year}_${vehicle.make}_loan_statement_1.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'loan_or_lease',
    extractedText:
      `Auto Loan Monthly Statement ${stmt1Date} ${lender} Account AUTO-${vehicle.vin.slice(-6)} ` +
      `Monthly Payment $${monthlyPayment.toFixed(2)} Remaining Balance $${loanBalance.toFixed(2)}`,
  });

  // 3 ── Financing statement (month 18 — shows balance reduction)
  const stmt2Date = addMonths(vehicle.purchaseDate, 18);
  const loanBalance2 = loanBalance * 0.6;
  docs.push({
    blob: generateFinancingStatement(
      vehicle,
      lender,
      loanBalance2,
      monthlyPayment,
      stmt2Date,
      18
    ),
    fileName: `${vehicle.year}_${vehicle.make}_loan_statement_18.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'payment_history',
    extractedText:
      `Auto Loan Monthly Statement ${stmt2Date} ${lender} ` +
      `Monthly Payment $${monthlyPayment.toFixed(2)} Remaining Balance $${loanBalance2.toFixed(2)}`,
  });

  // 4 ── Service invoice — first scheduled service
  const svc1Date = addMonths(vehicle.purchaseDate, 10);
  docs.push({
    blob: generateServiceInvoice(
      vehicle,
      shop1,
      svc1Date,
      Math.round(mileageNum * 0.35),
      [
        { description: 'Tire Rotation', cost: 29.95 },
        { description: 'Multi-Point Inspection', cost: 0 },
        { description: 'Cabin Air Filter Replacement', cost: 34.5 },
      ],
      89
    ),
    fileName: `${vehicle.year}_${vehicle.make}_service_invoice_1.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'service_history',
    extractedText:
      `Service Invoice ${svc1Date} ${shop1} ${vehicle.year} ${vehicle.make} ${vehicle.model} ` +
      `VIN ${vehicle.vin} Odometer ${Math.round(mileageNum * 0.35).toLocaleString()} ` +
      `Tire Rotation Cabin Air Filter Labor $89.00 ` +
      `Total $${(29.95 + 34.5 + 89 + (29.95 + 34.5 + 89) * 0.0825).toFixed(2)}`,
  });

  // 5 ── Service invoice — brake service
  const svc2Date = addMonths(vehicle.purchaseDate, 20);
  docs.push({
    blob: generateServiceInvoice(
      vehicle,
      shop2,
      svc2Date,
      Math.round(mileageNum * 0.72),
      [
        { description: 'Front Brake Pads (OEM)', cost: 89.95 },
        { description: 'Brake Rotor Resurface (2)', cost: 60 },
        { description: 'Brake Fluid Flush', cost: 49.99 },
      ],
      145
    ),
    fileName: `${vehicle.year}_${vehicle.make}_brake_service_invoice.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'repair_invoices',
    extractedText:
      `Repair Invoice ${svc2Date} ${shop2} Brake Service ` +
      `${vehicle.year} ${vehicle.make} ${vehicle.model} VIN ${vehicle.vin} ` +
      `Odometer ${Math.round(mileageNum * 0.72).toLocaleString()} ` +
      `Front Brake Pads Rotor Resurface Brake Fluid Flush Labor $145.00 ` +
      `Total $${(89.95 + 60 + 49.99 + 145 + (89.95 + 60 + 49.99 + 145) * 0.0825).toFixed(2)}`,
  });

  // 6 ── Oil change — first
  const oil1Date = addMonths(vehicle.purchaseDate, 14);
  docs.push({
    blob: generateOilChangeReceipt(
      vehicle,
      quickLube,
      oil1Date,
      Math.round(mileageNum * 0.5),
      'Full Synthetic 5W-30',
      74.95
    ),
    fileName: `${vehicle.year}_${vehicle.make}_oil_change_1.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'service_history',
    extractedText:
      `Oil Change Service ${oil1Date} ${quickLube} ` +
      `${vehicle.year} ${vehicle.make} VIN ${vehicle.vin} ` +
      `Odometer ${Math.round(mileageNum * 0.5).toLocaleString()} ` +
      `Full Synthetic 5W-30 Oil Filter Labor Total $74.95`,
  });

  // 7 ── Oil change — second
  const oil2Date = addMonths(vehicle.purchaseDate, 22);
  docs.push({
    blob: generateOilChangeReceipt(
      vehicle,
      quickLube,
      oil2Date,
      Math.round(mileageNum * 0.88),
      'Full Synthetic 5W-30',
      79.95
    ),
    fileName: `${vehicle.year}_${vehicle.make}_oil_change_2.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'service_history',
    extractedText:
      `Oil Change Service ${oil2Date} ${quickLube} ` +
      `${vehicle.year} ${vehicle.make} VIN ${vehicle.vin} ` +
      `Odometer ${Math.round(mileageNum * 0.88).toLocaleString()} ` +
      `Full Synthetic 5W-30 Oil Filter Total $79.95`,
  });

  // 8 ── Fuel receipt — early
  const fuel1Date = addMonths(vehicle.purchaseDate, 2);
  docs.push({
    blob: generateFuelReceipt(
      vehicle,
      gasStation,
      fuel1Date,
      12.4,
      3.459,
      Math.round(mileageNum * 0.08)
    ),
    fileName: `${vehicle.year}_${vehicle.make}_fuel_receipt_1.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'service_history',
    extractedText:
      `Fuel Receipt ${fuel1Date} ${gasStation} ` +
      `${vehicle.year} ${vehicle.make} Gallons 12.400 Price $3.459 ` +
      `Total $${(12.4 * 3.459).toFixed(2)} Odometer ${Math.round(mileageNum * 0.08).toLocaleString()}`,
  });

  // 9 ── Fuel receipt — recent
  const fuel2Date = addMonths(vehicle.purchaseDate, 24);
  docs.push({
    blob: generateFuelReceipt(
      vehicle,
      gasStation,
      fuel2Date,
      11.8,
      3.849,
      Math.round(mileageNum * 0.95)
    ),
    fileName: `${vehicle.year}_${vehicle.make}_fuel_receipt_2.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'service_history',
    extractedText:
      `Fuel Receipt ${fuel2Date} ${gasStation} ` +
      `${vehicle.year} ${vehicle.make} Gallons 11.800 Price $3.849 ` +
      `Total $${(11.8 * 3.849).toFixed(2)} Odometer ${Math.round(mileageNum * 0.95).toLocaleString()}`,
  });

  // 10 ── Registration certificate
  const regExpiry = `${purchaseYear + 1}-${vehicle.purchaseDate.slice(5, 7)}-01`;
  docs.push({
    blob: generateRegistration(vehicle, regExpiry, 151),
    fileName: `${vehicle.year}_${vehicle.make}_registration.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'registration',
    extractedText:
      `Vehicle Registration ${vehicle.purchaseDate} Illinois VIN ${vehicle.vin} ` +
      `${vehicle.year} ${vehicle.make} ${vehicle.model} Expiration ${regExpiry} Fee $151.00`,
  });

  // 11 ── Insurance declarations
  const policyStart = vehicle.purchaseDate;
  const policyEnd = addMonths(policyStart, 12);
  const policyNum = `${insurer.slice(0, 3).toUpperCase()}-${vinLast}-AUTO`;
  const annualPremium = 1248 + (vinLast % 400);
  docs.push({
    blob: generateInsuranceCard(
      vehicle,
      insurer,
      policyNum,
      policyStart,
      policyEnd,
      annualPremium
    ),
    fileName: `${vehicle.year}_${vehicle.make}_insurance_card.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'insurance',
    extractedText:
      `Insurance Declarations ${insurer} Policy ${policyNum} Effective ${policyStart} ` +
      `Expiration ${policyEnd} ${vehicle.year} ${vehicle.make} ${vehicle.model} ` +
      `VIN ${vehicle.vin} Annual Premium $${annualPremium.toFixed(2)}`,
  });

  // 12 ── Safety inspection
  const inspDate = addMonths(vehicle.purchaseDate, 12);
  docs.push({
    blob: generateInspectionReport(
      vehicle,
      shop2,
      inspDate,
      Math.round(mileageNum * 0.42),
      true,
      55
    ),
    fileName: `${vehicle.year}_${vehicle.make}_inspection_report.pdf`,
    type: 'application/pdf',
    portfolioItemId: 'inspection_reports',
    extractedText:
      `Safety Inspection ${inspDate} ${shop2} ` +
      `${vehicle.year} ${vehicle.make} ${vehicle.model} VIN ${vehicle.vin} ` +
      `Odometer ${Math.round(mileageNum * 0.42).toLocaleString()} PASS Inspection Fee $55.00`,
  });

  return docs;
}
