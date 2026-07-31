import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantResponseMapper } from './tenant.response.mapper';

describe('TenantResponseMapper', () => {
  const mapper = new TenantResponseMapper();

  const tenant = new Tenant(
    'tenant-id',
    'Tenant Name',
    TenantStatus.ACTIVE,
    'TAX-123',
    'tenant@example.com',
    new Date('2024-01-01T00:00:00.000Z'),
    new Date('2024-01-02T00:00:00.000Z'),
    null,
    null,
    null,
    null,
    true,
  );

  it('should expose logoUrl in list responses', () => {
    expect(mapper.toListDto(tenant)).toEqual({
      id: 'tenant-id',
      name: 'Tenant Name',
      logoUrl: null,
      status: TenantStatus.ACTIVE,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });

  it('should expose complete details with stable nullable fields', () => {
    const details = mapper.toDetailsDto(tenant);

    expect(details).toMatchObject({
      id: 'tenant-id',
      name: 'Tenant Name',
      email: 'tenant@example.com',
      phone: null,
      logoUrl: null,
      taxNumber: 'TAX-123',
      status: TenantStatus.ACTIVE,
      suspendedAt: null,
      suspendedReason: null,
    });
    expect(JSON.parse(JSON.stringify(details))).toMatchObject({
      phone: null,
      logoUrl: null,
      suspendedAt: null,
      suspendedReason: null,
    });
  });

  it('should serialize nullable email and taxNumber as null', () => {
    const details = mapper.toDetailsDto(
      new Tenant(
        'tenant-id',
        'Tenant Name',
        TenantStatus.ACTIVE,
        null,
        null,
        new Date('2024-01-01T00:00:00.000Z'),
        new Date('2024-01-02T00:00:00.000Z'),
      ),
    );

    expect(JSON.parse(JSON.stringify(details))).toMatchObject({
      taxNumber: null,
      email: null,
      phone: null,
      logoUrl: null,
      suspendedAt: null,
      suspendedReason: null,
    });
  });
});
