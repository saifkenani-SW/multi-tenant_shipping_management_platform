import { AccessDeniedException } from '../../../../../packages/authorization';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';
import { TenantVisibilityScope } from './tenant-visibility.scope';

describe('TenantVisibilityScope', () => {
  const scope = new TenantVisibilityScope();

  const createPrincipal = (
    type: SubjectType,
    tenantId?: string,
  ): Principal => ({
    subject: { id: 'user-id', type },
    tenantId,
    branches: [],
    warehouses: [],
  });

  it('should return an unrestricted scope for platform administrators', () => {
    expect(
      scope.buildScope({
        principal: createPrincipal(SubjectType.PLATFORM_ADMIN),
      }),
    ).toEqual({});
  });

  it('should scope non-platform principals to their tenant', () => {
    expect(
      scope.buildScope({
        principal: createPrincipal(SubjectType.EMPLOYEE, 'tenant-id'),
      }),
    ).toEqual({ tenantId: 'tenant-id' });
  });

  it('should deny non-platform principals without a tenant', () => {
    expect(() =>
      scope.buildScope({
        principal: createPrincipal(SubjectType.EMPLOYEE),
      }),
    ).toThrow(AccessDeniedException);
  });
});
