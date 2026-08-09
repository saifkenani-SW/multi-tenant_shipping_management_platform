import { ShipmentRequestQueryRepository } from './shipment-request.query.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentRequestScopeInterface } from '../../../authorization/scopes/shipment-request-scope.interface';
import { ShipmentRequestQueryDto } from '../../application/dtos/requests/shipment-request-query.dto';

describe('ShipmentRequestQueryRepository', () => {
  let repository: ShipmentRequestQueryRepository;
  let mockKysely: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      selectFrom: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    };

    mockKysely = {
      selectFrom: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentRequestQueryRepository,
        {
          provide: 'KYSELY_INSTANCE',
          useValue: mockKysely,
        },
      ],
    }).compile();

    repository = module.get<ShipmentRequestQueryRepository>(
      ShipmentRequestQueryRepository,
    );
  });

  describe('findMany', () => {
    it('should query globally if isGlobal is true', async () => {
      const scope: ShipmentRequestScopeInterface = { isGlobal: true };
      const criteria: ShipmentRequestQueryDto = {};

      await repository.findMany(criteria, scope);

      expect(mockKysely.selectFrom).toHaveBeenCalledWith(
        'shipment_request as sr',
      );
      expect(mockQueryBuilder.innerJoin).not.toHaveBeenCalled();
    });

    it('should join quotation and filter by tenantId for TENANT_ADMIN', async () => {
      const scope: ShipmentRequestScopeInterface = { tenantId: 'tenant-1' };
      const criteria: ShipmentRequestQueryDto = {};

      await repository.findMany(criteria, scope);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'quotation as q',
        'sr.approved_quotation_id',
        'q.id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'q.tenant_id',
        '=',
        'tenant-1',
      );
    });

    it('should join quotation and filter by orgUnitIds for EMPLOYEE', async () => {
      const scope: ShipmentRequestScopeInterface = {
        tenantId: 'tenant-1',
        orgUnitIds: ['org-1', 'org-2'],
      };
      const criteria: ShipmentRequestQueryDto = {};

      // Mock the callback execution in where
      mockQueryBuilder.where.mockImplementation((cb: any) => {
        if (typeof cb === 'function') {
          const eb: any = jest.fn().mockReturnValue('mock-eb');
          eb.or = jest.fn().mockReturnValue('mock-or');
          cb(eb);
        }
        return mockQueryBuilder;
      });

      await repository.findMany(criteria, scope);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'quotation as q',
        'sr.approved_quotation_id',
        'q.id',
      );
    });

    it('should apply search filters correctly', async () => {
      const scope: ShipmentRequestScopeInterface = { isGlobal: true };
      const criteria: ShipmentRequestQueryDto = {
        senderName: 'John',
        status: 'PENDING',
      };

      await repository.findMany(criteria, scope);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sr.sender_name',
        'ilike',
        'John%',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sr.status',
        '=',
        'PENDING',
      );
    });
  });
});
