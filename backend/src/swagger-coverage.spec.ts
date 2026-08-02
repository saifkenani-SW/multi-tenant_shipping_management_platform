import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';

import { EmployeeController } from './modules/employee/employee.controller';
import { GlobalLocationController } from './modules/global-location/global-location.controller';
import { OrganizationUnitController } from './modules/organization-unit/organization-unit.controller';
import { PermissionController } from './modules/authorization/permission.controller';
import { RoleController } from './modules/authorization/role.controller';
import { RoleService } from './modules/authorization/services/role.service';
import { PermissionService } from './modules/authorization/services/permission.service';

/**
 * يبني وثيقة OpenAPI فعلياً من الكونترولرات الخمسة.
 *
 * وجود الديكوراتورات في المصدر لا يثبت أن Swagger يقرأها: الفرق يظهر
 * عند توليد الوثيقة.
 */
describe('تغطية Swagger للموديولات الجديدة', () => {
  let app: INestApplication;
  let document: ReturnType<typeof SwaggerModule.createDocument>;

  beforeAll(async () => {
    const noop = {};

    const moduleRef = await Test.createTestingModule({
      controllers: [
        PermissionController,
        RoleController,
        GlobalLocationController,
        OrganizationUnitController,
        EmployeeController,
      ],
      providers: [
        { provide: PermissionService, useValue: noop },
        { provide: RoleService, useValue: noop },
        { provide: 'IGlobalLocationCommandService', useValue: noop },
        { provide: 'IGlobalLocationQueryService', useValue: noop },
        { provide: 'IOrganizationUnitCommandService', useValue: noop },
        { provide: 'IOrganizationUnitQueryService', useValue: noop },
        { provide: 'IEmployeeCommandService', useValue: noop },
        { provide: 'IEmployeeQueryService', useValue: noop },
      ],
    })
      // الحارس يحتاج Reflector وبنية auth كاملة، ولا شأن له بالتوثيق
      .overrideGuard(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./modules/auth/authorization/guards/user-type.guard')
          .UserTypeGuard,
      )
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('coverage check')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    document = SwaggerModule.createDocument(app, config);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('يسجّل كل المسارات الثمانية والعشرين', () => {
    const operationCount = Object.values(document.paths).reduce(
      (total, path) =>
        total +
        Object.keys(path).filter((method) =>
          ['get', 'post', 'put', 'patch', 'delete'].includes(method),
        ).length,
      0,
    );

    expect(operationCount).toBe(28);
  });

  it.each([
    ['/permissions', 'Permissions'],
    ['/roles', 'Roles'],
    ['/global-locations', 'Global Locations'],
    ['/organization-units', 'Organization Units'],
    ['/employees', 'Employees'],
  ])('يسجّل %s تحت وسم %s', (path, tag) => {
    expect(document.paths[path]).toBeDefined();
    expect(document.paths[path].get?.tags).toContain(tag);
  });

  it('يعطي كل عملية summary', () => {
    const missing: string[] = [];

    for (const [path, item] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(item)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          continue;
        }
        if (!(operation as { summary?: string }).summary) {
          missing.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('يولّد مخططات الطلب والاستجابة', () => {
    const schemas = Object.keys(document.components?.schemas ?? {});

    expect(schemas).toEqual(
      expect.arrayContaining([
        'CreateRoleDto',
        'SetRolePermissionsDto',
        'PaginatedRoleListDto',
        'RoleDetailsDto',
        'CreateEmployeeDto',
        'EmployeeDetailsDto',
        'EmployeeAssignmentDto',
        'CreateOrganizationUnitDto',
        'OrganizationUnitDetailsDto',
        'CreateGlobalLocationDto',
        'GlobalLocationDetailsDto',
        'PaginatedPermissionListDto',
      ]),
    );
  });

  it('يظهر التعدادات كقوائم اختيار لا كنص حر', () => {
    const orgType = (
      document.components?.schemas?.CreateOrganizationUnitDto as {
        properties?: Record<string, { enum?: string[] }>;
      }
    )?.properties?.orgType;

    expect(orgType?.enum).toEqual(
      expect.arrayContaining([
        'REGION',
        'HUB',
        'WAREHOUSE',
        'BRANCH',
        'LOCKER',
      ]),
    );
  });

  it('يعلّم الحقول المطلوبة', () => {
    const createEmployee = document.components?.schemas?.CreateEmployeeDto as {
      required?: string[];
    };

    expect(createEmployee.required).toEqual(
      expect.arrayContaining(['email', 'password', 'employeeCode', 'fullName']),
    );
  });

  it('يوثّق معاملات المسار المركّبة للتعيينات', () => {
    const params =
      document.paths['/employees/{id}/assignments/{assignmentId}']?.delete
        ?.parameters ?? [];

    const names = params.map((p) => (p as { name: string }).name);

    expect(names).toEqual(expect.arrayContaining(['id', 'assignmentId']));
  });
});
