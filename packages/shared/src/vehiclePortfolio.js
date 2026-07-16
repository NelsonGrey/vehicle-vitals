// Standard document portfolio template for every vehicle record.

const DEFAULT_SCHEMA_VERSION = 1;

function createEntry(id, title, description, required) {
  return {
    id,
    title,
    description,
    required,
    status: 'missing',
    files: [],
    notes: '',
    updatedAt: null,
  };
}

export function createStandardVehiclePortfolio() {
  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    categories: [
      {
        key: 'ownership',
        title: 'Ownership and Legal',
        items: [
          createEntry(
            'title',
            'Vehicle Title',
            'Proof of legal ownership and lien status.',
            true
          ),
          createEntry(
            'registration',
            'Registration Card',
            'Current state/provincial registration document.',
            true
          ),
          createEntry(
            'insurance',
            'Insurance Card and Policy Summary',
            'Current proof of insurance and policy details.',
            true
          ),
          createEntry(
            'bill_of_sale',
            'Bill of Sale / Purchase Agreement',
            'Purchase agreement from dealership or private party.',
            true
          ),
        ],
      },
      {
        key: 'finance',
        title: 'Finance and Tax',
        items: [
          createEntry(
            'loan_or_lease',
            'Loan / Lease Contract',
            'Original financing or lease paperwork.',
            false
          ),
          createEntry(
            'payment_history',
            'Payment History Statements',
            'Monthly statements for financing records.',
            false
          ),
          createEntry(
            'tax_receipts',
            'Tax and Fee Receipts',
            'Sales tax, registration fees, and related receipts.',
            false
          ),
        ],
      },
      {
        key: 'maintenance',
        title: 'Maintenance and Repair',
        items: [
          createEntry(
            'service_history',
            'Service Invoices',
            'Oil changes, inspections, and routine maintenance receipts.',
            true
          ),
          createEntry(
            'repair_invoices',
            'Repair Invoices',
            'Parts and labor records for all repairs.',
            true
          ),
          createEntry(
            'warranty_records',
            'Warranty and Recall Records',
            'Warranty claims, recall completion receipts, and campaign docs.',
            true
          ),
          createEntry(
            'inspection_reports',
            'Inspection and Emissions Reports',
            'State inspection, emissions, and safety checks.',
            false
          ),
        ],
      },
      {
        key: 'reference',
        title: 'Reference and Evidence',
        items: [
          createEntry(
            'owners_manual',
            'Owner Manual and Quick Guides',
            'Digital owner manual, quick start, and feature guides.',
            false
          ),
          createEntry(
            'accident_reports',
            'Accident / Incident Reports',
            'Police reports, claim packets, and repair estimates.',
            false
          ),
          createEntry(
            'photo_log',
            'Photo Log',
            'Condition photos for resale, claims, and maintenance evidence.',
            false
          ),
          createEntry(
            'modifications',
            'Modification and Accessory Receipts',
            'Aftermarket installation records and warranties.',
            false
          ),
        ],
      },
    ],
  };
}
