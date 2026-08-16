import { ShipmentRequestQueryService } from './shipment-request.query.service';
import { Test, TestingModule } from '@nestjs/testing';
import { QuotationQueryService } from '../../quotation/application/services/quotation.query.service';
import { GlobalLocationFacade } from '../../../../global-location/application/facades/global-location.facade';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { ShipmentRequestQueryRepository } from '../../infrastructure/repositories/shipment-request.query.repository';
import { AuthorizationFacade } from '../../../../../packages/authorization';
import { AuthorizationContainer } from '../../../../../packages/authorization/authorization.container';
import { ShipmentRequestVisibilityScope } from '../../../authorization/scopes/shipment-request-visibility.scope';
import { ShipmentRequestQueryDto } from '../dtos/requests/shipment-request-query.dto';

jest.mock('../../../../../common/uuid/uuid.helper', () => ({
  generateUuid: jest.fn(() => 'test-uuid'),
}));

describe('ShipmentRequestQueryService', () => {
  let service: ShipmentRequestQueryService;
  let queryRepository: jest.Mocked<ShipmentRequestQueryRepository>;
  let authorizationFacade: jest.Mocked<AuthorizationFacade>;

  beforeEach(async () => {
    authorizationFacade = {
      buildScope: jest.fn(),
    } as any;

    jest
      .spyOn(AuthorizationContainer, 'get')
      .mockReturnValue(authorizationFacade);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentRequestQueryService,
        {
          provide: ShipmentRequestQueryRepository,
          useValue: {
            findMany: jest.fn(),
          },
        },
        {
          provide: AuthorizationFacade,
          useValue: authorizationFacade,
        },
        {
          provide: QuotationQueryService,
          useValue: {},
        },
        {
          provide: GlobalLocationFacade,
          useValue: {},
        },
        {
          provide: TenantFacade,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ShipmentRequestQueryService>(
      ShipmentRequestQueryService,
    );
    queryRepository = module.get(ShipmentRequestQueryRepository);
    authorizationFacade = module.get(AuthorizationFacade);
  });

  describe('findMany', () => {
    it('should build scope and pass it to the repository', async () => {
      const scope = { tenantId: 'tenant-1' };
      authorizationFacade.buildScope.mockReturnValue(scope);
      queryRepository.findMany.mockResolvedValue('paginated-response' as any);

      const criteria: ShipmentRequestQueryDto = {};
      const result = await service.findMany(criteria);

      expect(authorizationFacade.buildScope).toHaveBeenCalledWith({
        builder: ShipmentRequestVisibilityScope,
      });
      expect(queryRepository.findMany).toHaveBeenCalledWith(criteria, scope);
      expect(result).toBe('paginated-response');
    });
  });
});
