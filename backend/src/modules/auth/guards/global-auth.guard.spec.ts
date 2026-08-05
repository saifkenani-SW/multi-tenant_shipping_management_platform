import { ModuleRef, Reflector } from '@nestjs/core';

import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../packages/context/principal/principal/SubjectType';
import { EmployeeFacade } from '../../employee/facades/employee.facade';
import { UserLoginType } from '../types/auth.types';
import { GlobalAuthGuard } from './global-auth.guard';

describe('GlobalAuthGuard tenant context', () => {
  const tenantId = '00000000-0000-7000-8000-000000000101';
  const setPrincipal = jest.fn();
  const employeeFacade = {
    getPrincipalByUserId: jest.fn(),
  };
  const moduleRef = {
    get: jest.fn().mockReturnValue(employeeFacade),
  };

  const guard = new GlobalAuthGuard(
    {} as Reflector,
    { setPrincipal } as unknown as RequestContextService,
    moduleRef as unknown as ModuleRef,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses x-tenant-id for a platform administrator', async () => {
    await (guard as any).populatePrincipal(
      { sub: 'platform-admin-id', type: UserLoginType.PLATFORM_OWNER },
      { headers: { 'x-tenant-id': tenantId } },
    );

    expect(setPrincipal).toHaveBeenCalledWith({
      subject: {
        id: 'platform-admin-id',
        type: SubjectType.PLATFORM_OWNER,
      },
      tenantId,
      branches: [],
      warehouses: [],
    });
  });

  it('uses the selected tenant from an employee token', async () => {
    employeeFacade.getPrincipalByUserId.mockResolvedValue({
      branches: [],
      warehouses: [],
    });

    await (guard as any).populatePrincipal({
      sub: 'employee-user-id',
      type: UserLoginType.EMPLOYEE,
      tenantId,
      profileId: 'employee-profile-id',
    });

    expect(moduleRef.get).toHaveBeenCalledWith(EmployeeFacade, {
      strict: false,
    });
    expect(employeeFacade.getPrincipalByUserId).toHaveBeenCalledWith(
      'employee-user-id',
      tenantId,
    );
    expect(setPrincipal).toHaveBeenCalledWith({
      subject: { id: 'employee-user-id', type: SubjectType.EMPLOYEE },
      tenantId,
      profileId: 'employee-profile-id',
      branches: [],
      warehouses: [],
    });
  });
});
