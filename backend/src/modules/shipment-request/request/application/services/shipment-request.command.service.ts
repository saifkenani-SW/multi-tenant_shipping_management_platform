import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { ShipmentRequestCommandRepository } from '../../infrastructure/repositories/shipment-request.command.repository';
import { CreateShipmentRequestDto } from '../dtos/requests/create-shipment-request.dto';
import { GlobalLocationFacade } from '../../../../global-location/facades/global-location.facade';
import { QuotationGenerationService } from '../../../quotation/application/services/quotation-generation.service';
import { QuotationCommandService } from '../../../quotation/application/services/quotation.command.service';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { generateUuid } from '../../../../../common/uuid';
import { ShipmentRequest } from '../../domain/entities/shipment-request.entity';
import { ShipmentRequestQueryRepository } from '../../infrastructure/repositories/shipment-request.query.repository';
import { ShipmentRequestQueryService } from './shipment-request.query.service';
import { RequestStatus } from '@prisma/client';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { SHIPMENT_REQUEST_CACHE_KEYS } from '../../constants/shipment-request.cache.constants';
import { UserFacade } from '../../../../user/application/facades/user.facade';
import { NotificationFacade } from '../../../../notification/facades/notification.facade';

@Injectable()
export class ShipmentRequestCommandService {
  constructor(
    private readonly commandRepository: ShipmentRequestCommandRepository,
    private readonly globalLocationFacade: GlobalLocationFacade,
    private readonly quotationGenerationService: QuotationGenerationService,
    @Inject(forwardRef(() => QuotationCommandService))
    private readonly quotationCommandService: QuotationCommandService,
    private readonly tenantFacade: TenantFacade,
    private readonly queryService: ShipmentRequestQueryService,
    private readonly userFacade: UserFacade,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async create(customerProfileId: string, dto: CreateShipmentRequestDto) {
    if (dto.target_tenant_id) {
      const tenants = await this.tenantFacade.getTenantsByIds([
        dto.target_tenant_id,
      ]);
      const tenant = tenants[0];
      if (!tenant || tenant.status !== 'ACTIVE') {
        throw new BadRequestException(
          'The requested shipping company is inactive or not found.',
        );
      }
    }

    const allExist = await this.globalLocationFacade.validateLocationsExist([
      dto.origin_global_location_id,
      dto.destination_global_location_id,
    ]);

    if (!allExist) {
      throw new BadRequestException(
        'One or more global location IDs provided are invalid.',
      );
    }

    // Generate ID for the shipment request beforehand
    const shipmentRequestId = generateUuid();

    // Generate Quotations in memory
    const quotations = await this.quotationGenerationService.generateQuotations(
      dto,
      shipmentRequestId,
    );

    // Save everything in a single, short-lived database transaction
    await this.persistShipmentRequestData(
      customerProfileId,
      dto,
      shipmentRequestId,
      quotations,
    );

    return { id: shipmentRequestId, quotations };
  }

  @Transactional()
  private async persistShipmentRequestData(
    customerProfileId: string,
    dto: CreateShipmentRequestDto,
    shipmentRequestId: string,
    quotations: any[],
  ) {
    await this.commandRepository.create(
      customerProfileId,
      dto,
      shipmentRequestId,
    );
    await this.quotationCommandService.saveGeneratedQuotations(quotations);
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async acceptQuotationForRequest(requestId: string, quotationId: string) {
    const rawRequest = await this.queryService.findById(requestId);

    // Instantiate Domain Entity
    const requestEntity = new ShipmentRequest(
      rawRequest.id,
      rawRequest.status as RequestStatus,
      rawRequest.approvedQuotationId,
    );

    // Domain Logic
    requestEntity.acceptQuotation(quotationId);

    // Persist
    await this.commandRepository.updateStatusAndQuotation(
      requestEntity.id,
      requestEntity.status,
      requestEntity.approvedQuotationId!,
    );
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async acceptByCompany(requestId: string) {
    const rawRequest = await this.queryService.findById(requestId);

    const requestEntity = new ShipmentRequest(
      rawRequest.id,
      rawRequest.status as RequestStatus,
      rawRequest.approvedQuotationId,
    );

    requestEntity.acceptByCompany();

    await this.commandRepository.updateStatus(
      requestEntity.id,
      requestEntity.status,
    );

    const userSummary = await this.userFacade.getUserSummaryByPhone(
      rawRequest.senderPhone,
    );
    if (userSummary) {
      await this.notificationFacade.notifyUser(userSummary.id, {
        title: 'تمت الموافقة على طلب الشحن',
        body: `تم الموافقة على طلب الشحن الخاص بك، تستطيع الآن التوجه للشحن. رقم الطلب: ${rawRequest.id}`,
      });
    }
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async rejectByCompany(requestId: string) {
    const rawRequest = await this.queryService.findById(requestId);

    const requestEntity = new ShipmentRequest(
      rawRequest.id,
      rawRequest.status as RequestStatus,
      rawRequest.approvedQuotationId,
    );

    requestEntity.rejectByCompany();

    await this.commandRepository.updateStatus(
      requestEntity.id,
      requestEntity.status,
    );
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async cancel(requestId: string) {
    const rawRequest = await this.queryService.findById(requestId);

    const requestEntity = new ShipmentRequest(
      rawRequest.id,
      rawRequest.status as RequestStatus,
      rawRequest.approvedQuotationId,
    );

    requestEntity.cancel();

    await this.commandRepository.updateStatus(
      requestEntity.id,
      requestEntity.status,
    );
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async convert(requestId: string) {
    const rawRequest = await this.queryService.findById(requestId);

    const requestEntity = new ShipmentRequest(
      rawRequest.id,
      rawRequest.status as RequestStatus,
      rawRequest.approvedQuotationId,
    );

    requestEntity.convert();

    await this.commandRepository.updateStatus(
      requestEntity.id,
      requestEntity.status,
    );
  }
}
