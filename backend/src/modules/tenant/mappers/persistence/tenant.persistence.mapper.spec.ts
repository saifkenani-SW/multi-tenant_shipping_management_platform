import { TenantStatus } from '../../enums/tenant-status.enum';
import { TenantPersistenceMapper } from './tenant.persistence.mapper';

describe('TenantPersistenceMapper', () => {
  const mapper = new TenantPersistenceMapper();

  it('should map every tenant scalar field into the domain entity', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const updatedAt = new Date('2024-01-02T00:00:00.000Z');
    const suspendedAt = new Date('2024-01-03T00:00:00.000Z');

    const tenant = mapper.toDomain({
      id: 'tenant-id',
      name: 'Tenant Name',
      is_active: false,
      tax_number: 'TAX-123',
      email: 'tenant@example.com',
      phone: '+963123456789',
      logo_url: 'https://example.com/logo.png',
      created_at: createdAt,
      updated_at: updatedAt,
      suspended_at: suspendedAt,
      suspended_reason: 'Fraud review',
    });

    expect(tenant).toMatchObject({
      id: 'tenant-id',
      name: 'Tenant Name',
      status: TenantStatus.SUSPENDED,
      taxNumber: 'TAX-123',
      email: 'tenant@example.com',
      phone: '+963123456789',
      logoUrl: 'https://example.com/logo.png',
      isActive: false,
      createdAt,
      updatedAt,
      suspendedAt,
      suspendedReason: 'Fraud review',
    });
  });

  it('should preserve nullable scalar fields as null', () => {
    const tenant = mapper.toDomain({
      id: 'tenant-id',
      name: 'Tenant Name',
      is_active: true,
      tax_number: null,
      email: null,
      phone: null,
      logo_url: null,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-02T00:00:00.000Z'),
      suspended_at: null,
      suspended_reason: null,
    });

    expect(tenant.taxNumber).toBeNull();
    expect(tenant.email).toBeNull();
    expect(tenant.phone).toBeNull();
    expect(tenant.logoUrl).toBeNull();
    expect(tenant.suspendedAt).toBeNull();
    expect(tenant.suspendedReason).toBeNull();
  });
});
