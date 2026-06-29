// TypeScript declarations for @vehicle-vitals/shared

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  vin: string;
  vehicleStatus?: 'active' | 'stored';
  vehicleType?: string;
  photoUrl?: string;
  photoPath?: string;
  photoSource?: string;
  photoAttributionUrl?: string;
  photoAttributionText?: string;
  mileage: string;
  purchaseDate: string;
  nextDueByMiles?: string;
  nextDueByDate?: string;
  services?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  serviceType: string;
  description: string;
  date: string;
  mileage: string;
  cost?: number;
  provider: string;
  performedBy?: 'self' | 'mechanic' | 'business';
  coverage?: 'parts_only' | 'parts_and_labor';
  notes: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDraft {
  orgId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  amountDue?: number;
  amountPaid?: number;
  status?: 'draft' | 'sent' | 'partial' | 'paid' | 'void';
  notes?: string;
  lineItems?: InvoiceLineItem[];
}

export interface PayableDraft {
  orgId: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  currency: string;
  amountDue?: number;
  amountPaid?: number;
  status?: 'draft' | 'approved' | 'scheduled' | 'paid' | 'void';
  category?: string;
  notes?: string;
}
