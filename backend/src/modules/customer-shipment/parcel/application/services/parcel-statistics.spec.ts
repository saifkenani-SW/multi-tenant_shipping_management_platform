import { Test, TestingModule } from '@nestjs/testing';
import { ParcelQueryService } from './parcel.query.service';
import { ParcelQueryRepository } from '../../infrastructure/repositories/parcel.query.repository';
import { AuthorizationFacade } from '../../../../../packages/authorization';
import { ParcelMapper } from '../mappers/parcel.mapper';
import { TrackingFacade } from '../../../../tracking/application/facades/tracking.facade';
import { ProofOfDeliveryQueryService } from '../../../proof-of-delivery/application/services/proof-of-delivery.query.service';
import { ShipmentQueryService } from '../../../shipment/application/services/shipment.query.service';

describe('Parcel Statistics Query Service', () => {
  let queryService: ParcelQueryService;
  let queryRepository: jest.Mocked<ParcelQueryRepository>;
  let authorizationFacade: jest.Mocked<AuthorizationFacade>;

  beforeEach(async () => {
    queryRepository = {
      getStatistics: jest.fn(),
    } as any;

    authorizationFacade = {
      buildScope: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParcelQueryService,
        { provide: ParcelQueryRepository, useValue: queryRepository },
        { provide: AuthorizationFacade, useValue: authorizationFacade },
        { provide: ParcelMapper, useValue: {} },
        { provide: TrackingFacade, useValue: {} },
        { provide: ProofOfDeliveryQueryService, useValue: {} },
        { provide: ShipmentQueryService, useValue: {} },
      ],
    }).compile();

    queryService = module.get<ParcelQueryService>(ParcelQueryService);
  });

  describe('getStatistics', () => {
    it('should calculate statistics with no tenant restriction (Platform Owner)', async () => {
      authorizationFacade.buildScope.mockReturnValue({
        parcel: {},
        shipment: {},
      } as any);

      queryRepository.getStatistics.mockResolvedValue([
        {
          tenantId: 'T1',
          tenantName: 'Tenant 1',
          orgUnitId: 'O1',
          orgUnitName: 'Org 1',
          direction: 'CURRENT',
          status: 'PROCESSING',
          condition: 'NORMAL',
          count: '5',
        },
        {
          tenantId: 'T2',
          tenantName: 'Tenant 2',
          orgUnitId: 'O2',
          orgUnitName: 'Org 2',
          direction: 'CURRENT',
          status: 'IN_TRANSIT',
          condition: 'NORMAL',
          count: 3n as any, // testing bigint
        },
      ]);

      const result = await queryService.getStatistics();

      expect(result.total).toBe(8);
      expect(result.tenants).toHaveLength(2);
      expect(result.tenants.find((t) => t.tenantId === 'T1')?.total).toBe(5);
      expect(result.tenants.find((t) => t.tenantId === 'T2')?.total).toBe(3);
    });

    it('should calculate statistics with specific tenant and org units (Employee)', async () => {
      authorizationFacade.buildScope.mockReturnValue({
        parcel: {
          tenant_id: 'T1',
          org_unit_ids: ['O1', 'O2'],
        },
        shipment: {},
      } as any);

      queryRepository.getStatistics.mockResolvedValue([
        {
          tenantId: 'T1',
          tenantName: 'Tenant 1',
          orgUnitId: 'O1',
          orgUnitName: 'Org 1',
          direction: 'CURRENT',
          status: 'PROCESSING',
          condition: 'NORMAL',
          count: '2',
        },
        {
          tenantId: 'T1',
          tenantName: 'Tenant 1',
          orgUnitId: 'O2',
          orgUnitName: 'Org 2',
          direction: 'INCOMING',
          status: 'IN_TRANSIT',
          condition: 'NORMAL',
          count: '4',
        },
      ]);

      const result = await queryService.getStatistics();

      expect(queryRepository.getStatistics).toHaveBeenCalledWith({
        tenantId: 'T1',
        scopeOrgUnitIds: ['O1', 'O2'],
      });

      expect(result.total).toBe(2); // Only current counts towards total
      expect(result.tenants).toHaveLength(1);

      const t1 = result.tenants[0];
      expect(t1.total).toBe(2);
      expect(t1.orgUnits).toHaveLength(2);

      const o1 = t1.orgUnits.find((o) => o.orgUnitId === 'O1');
      expect(o1?.current.total).toBe(2);
      expect(o1?.incoming.total).toBe(0);

      const o2 = t1.orgUnits.find((o) => o.orgUnitId === 'O2');
      expect(o2?.current.total).toBe(0);
      expect(o2?.incoming.total).toBe(4);
    });

    it('should avoid double counting when a parcel is current in one unit and incoming to another', async () => {
      authorizationFacade.buildScope.mockReturnValue({
        parcel: {
          tenant_id: 'T1',
        },
        shipment: {},
      } as any);

      queryRepository.getStatistics.mockResolvedValue([
        {
          tenantId: 'T1',
          tenantName: 'Tenant 1',
          orgUnitId: 'O1', // current here
          orgUnitName: 'Org 1',
          direction: 'CURRENT',
          status: 'IN_TRANSIT',
          condition: 'NORMAL',
          count: 1,
        },
        {
          tenantId: 'T1',
          tenantName: 'Tenant 1',
          orgUnitId: 'O2', // incoming here
          orgUnitName: 'Org 2',
          direction: 'INCOMING',
          status: 'IN_TRANSIT',
          condition: 'NORMAL',
          count: 1,
        },
      ]);

      const result = await queryService.getStatistics();

      expect(result.total).toBe(1); // 1 current + 1 incoming, but total is only current
      const t1 = result.tenants[0];
      expect(t1.total).toBe(1);

      const o1 = t1.orgUnits.find((o) => o.orgUnitId === 'O1');
      expect(o1?.current.total).toBe(1);
      expect(o1?.incoming.total).toBe(0);

      const o2 = t1.orgUnits.find((o) => o.orgUnitId === 'O2');
      expect(o2?.current.total).toBe(0);
      expect(o2?.incoming.total).toBe(1);
    });
  });
});
