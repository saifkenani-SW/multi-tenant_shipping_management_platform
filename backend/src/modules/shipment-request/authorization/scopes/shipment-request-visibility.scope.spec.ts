import { ShipmentRequestVisibilityScope } from './shipment-request-visibility.scope';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';
import { AccessDeniedException } from '../../../../../../packages/authorization';

jest.mock('../../../../../../common/uuid/uuid.helper', () => ({
  generateUuid: jest.fn(() => 'test-uuid'),
}));

describe('ShipmentRequestVisibilityScope', () => {
  let scopeBuilder: ShipmentRequestVisibilityScope;

  beforeEach(() => {
    scopeBuilder = new ShipmentRequestVisibilityScope();
  });

  it('should return global scope for PLATFORM_OWNER', () => {
    const context = {
      principal: {
        subject: { type: SubjectType.PLATFORM_OWNER, id: '1' },
      } as Principal,
    } as any;

    const scope = scopeBuilder.buildScope(context);
    expect(scope).toEqual({ isGlobal: true });
  });

  it('should throw AccessDeniedException if tenantId is missing for TENANT_ADMIN', () => {
    const context = {
      principal: {
        subject: { type: SubjectType.TENANT_ADMIN, id: '2' },
      } as Principal,
    } as any;

    expect(() => scopeBuilder.buildScope(context)).toThrow(
      AccessDeniedException,
    );
  });

  it('should return tenant scope for TENANT_ADMIN', () => {
    const context = {
      principal: {
        subject: { type: SubjectType.TENANT_ADMIN, id: '3' },
        tenantId: 'tenant-1',
      } as Principal,
    } as any;

    const scope = scopeBuilder.buildScope(context);
    expect(scope).toEqual({ tenantId: 'tenant-1' });
  });

  it('should throw AccessDeniedException for EMPLOYEE with no assigned branches or warehouses', () => {
    const context = {
      principal: {
        subject: { type: SubjectType.EMPLOYEE, id: '4' },
        tenantId: 'tenant-1',
        branches: [],
        warehouses: [],
      } as Principal,
    } as any;

    expect(() => scopeBuilder.buildScope(context)).toThrow(
      AccessDeniedException,
    );
  });

  it('should return scope with orgUnitIds for EMPLOYEE with branches', () => {
    const context = {
      principal: {
        subject: { type: SubjectType.EMPLOYEE, id: '5' },
        tenantId: 'tenant-1',
        branches: [{ id: 'branch-1' }, { id: 'branch-2' }],
        warehouses: [{ id: 'warehouse-1' }],
      } as Principal,
    } as any;

    const scope = scopeBuilder.buildScope(context);
    expect(scope).toEqual({
      tenantId: 'tenant-1',
      orgUnitIds: ['branch-1', 'branch-2', 'warehouse-1'],
    });
  });

  it('should throw AccessDeniedException for unsupported subject type', () => {
    const context = {
      principal: {
        subject: { type: SubjectType.CUSTOMER, id: '6' },
        tenantId: 'tenant-1',
      } as Principal,
    } as any;

    expect(() => scopeBuilder.buildScope(context)).toThrow(
      AccessDeniedException,
    );
  });
});
