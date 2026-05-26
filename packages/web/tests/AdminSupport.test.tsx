import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminSupport from '../src/pages/AdminSupport';

const mockUseAuth = vi.fn();
const mockBootstrapEnterpriseContext = vi.fn();
const mockSearchSupportUsers = vi.fn();
const mockGetOrganizationMembers = vi.fn();
const mockApplyRetentionPolicy = vi.fn();
const mockSetOrganizationMemberRole = vi.fn();
const mockGetFinanceDrafts = vi.fn();
const mockCreateInvoiceDraft = vi.fn();
const mockCreatePayableDraft = vi.fn();

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../src/shared/entitlementsService', () => ({
  bootstrapEnterpriseContext: () => mockBootstrapEnterpriseContext(),
}));

vi.mock('../src/utils/supportAdminService', () => ({
  applyRetentionPolicy: (...args: unknown[]) =>
    mockApplyRetentionPolicy(...args),
  createInvoiceDraft: (...args: unknown[]) => mockCreateInvoiceDraft(...args),
  createPayableDraft: (...args: unknown[]) => mockCreatePayableDraft(...args),
  getFinanceDrafts: (...args: unknown[]) => mockGetFinanceDrafts(...args),
  getOrganizationMembers: (...args: unknown[]) =>
    mockGetOrganizationMembers(...args),
  searchSupportUsers: (...args: unknown[]) => mockSearchSupportUsers(...args),
  setOrganizationMemberRole: (...args: unknown[]) =>
    mockSetOrganizationMemberRole(...args),
}));

describe('AdminSupport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { email: 'admin@example.com' },
      supportAccess: {
        isSuperAdmin: true,
        accessReason: 'support enabled',
      },
    });

    mockBootstrapEnterpriseContext.mockResolvedValue({
      orgId: 'org-123',
      entitlements: {},
    });

    mockSearchSupportUsers.mockResolvedValue({ results: [] });
    mockGetOrganizationMembers.mockResolvedValue({ members: [] });
    mockApplyRetentionPolicy.mockResolvedValue({
      orgId: 'org-123',
      retentionDays: 365,
    });
    mockSetOrganizationMemberRole.mockResolvedValue({
      orgId: 'org-123',
      targetUid: 'user-1',
      role: 'read_only',
    });
    mockCreateInvoiceDraft.mockResolvedValue({
      orgId: 'org-123',
      invoiceId: 'invoice-new',
      status: 'draft',
    });
    mockCreatePayableDraft.mockResolvedValue({
      orgId: 'org-123',
      payableId: 'payable-new',
      status: 'draft',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders finance drafts and refreshes after creating an invoice draft', async () => {
    const initialDrafts = [
      {
        id: 'invoice-1',
        kind: 'invoice',
        counterparty: 'Acme Fleet',
        amountDue: 123.45,
        currency: 'USD',
        dueDate: '2026-06-01',
        status: 'draft',
        createdAt: '2026-05-23T12:00:00.000Z',
      },
      {
        id: 'payable-1',
        kind: 'payable',
        counterparty: 'Northwind Garage',
        amountDue: 88,
        currency: 'USD',
        dueDate: '2026-06-05',
        status: 'draft',
        createdAt: '2026-05-22T12:00:00.000Z',
      },
    ];
    const refreshedDrafts = [
      {
        id: 'invoice-new',
        kind: 'invoice',
        counterparty: 'Northwind Logistics',
        amountDue: 245.5,
        currency: 'USD',
        dueDate: '2026-06-15',
        status: 'draft',
        createdAt: '2026-05-23T13:00:00.000Z',
      },
      ...initialDrafts,
    ];

    mockGetFinanceDrafts
      .mockResolvedValueOnce({ orgId: 'org-123', drafts: initialDrafts })
      .mockResolvedValueOnce({ orgId: 'org-123', drafts: refreshedDrafts });

    const user = userEvent.setup();

    render(<AdminSupport />);

    await screen.findByRole('heading', { name: /support console/i });
    expect(screen.getByText(/finance drafts/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetFinanceDrafts).toHaveBeenCalled();
    });
    await screen.findByText('Acme Fleet');
    await screen.findByText('Northwind Garage');

    await user.type(
      screen.getByLabelText(/customer name/i),
      'Northwind Logistics'
    );
    await user.type(screen.getByLabelText(/invoice due date/i), '2026-06-15');
    await user.type(screen.getByLabelText(/invoice amount due/i), '245.50');
    await user.click(
      screen.getByRole('button', { name: /create invoice draft/i })
    );

    await waitFor(() => {
      expect(mockCreateInvoiceDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          customerName: 'Northwind Logistics',
          dueDate: '2026-06-15',
          currency: 'USD',
          amountDue: 245.5,
          lineItems: [],
        })
      );
    });

    await screen.findByText(/invoice draft invoice-new created/i);
    await screen.findByText('Northwind Logistics');
  });
});
