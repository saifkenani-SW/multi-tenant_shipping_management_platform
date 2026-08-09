import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { QuotationCommandRepository } from '../../infrastructure/repositories/quotation.command.repository';
import { GeneratedQuotation } from './quotation-generation.service';
import { QuotationQueryService } from './quotation.query.service';
import { ShipmentRequestCommandService } from '../../../request/application/services/shipment-request.command.service';
import { Transactional } from '../../../../../packages/transaction';
import { Quotation } from '../../domain/entities/quotation.entity';
import { AuthorizationFacade } from '../../../../../packages/authorization';

import { ShipmentRequestQueryService } from '../../../request/application/services/shipment-request.query.service';

import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { SubmitQuotationPriceDto } from '../dtos/requests/submit-quotation-price.dto';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { QUOTATION_CACHE_KEYS } from '../../constants/quotation.cache.constants';

@Injectable()
export class QuotationCommandService {
  constructor(
    private readonly quotationCommandRepository: QuotationCommandRepository,
    private readonly quotationQueryService: QuotationQueryService,
    @Inject(forwardRef(() => ShipmentRequestCommandService))
    private readonly shipmentRequestCommandService: ShipmentRequestCommandService,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly shipmentRequestQueryService: ShipmentRequestQueryService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @CacheEvict({
    keyPrefix: QUOTATION_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async saveGeneratedQuotations(
    quotations: GeneratedQuotation[],
  ): Promise<number> {
    if (quotations.length === 0) return 0;
    return this.quotationCommandRepository.createMany(quotations);
  }

  @CacheEvict({
    keyPrefix: QUOTATION_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async approveQuotation(id: string): Promise<void> {
    // 1. Fetch raw quotation
    const quotationDto = await this.quotationQueryService.findById(id);

    // 2. Ensure customer owns the parent request
    await this.shipmentRequestQueryService.findById(
      quotationDto.shipmentRequestId,
    );

    // 3. Open transaction for updates
    await this.executeApprovalTransaction(quotationDto);
  }

  @Transactional()
  private async executeApprovalTransaction(quotationDto: any): Promise<void> {
    // Instantiate Domain Entity for Quotation
    const quotation = new Quotation(
      quotationDto.id,
      quotationDto.shipmentRequestId,
      quotationDto.status as any,
      quotationDto.quotationType as 'AUTOMATIC' | 'MANUAL',
    );

    // Domain Logic
    quotation.approve();

    // Persist Quotation
    await this.quotationCommandRepository.updateStatus(
      quotation.id,
      quotation.status,
    );

    // Reject other quotations automatically
    await this.quotationCommandRepository.rejectOtherQuotations(
      quotation.shipmentRequestId,
      quotation.id,
    );

    // Delegate to ShipmentRequest aggregate
    await this.shipmentRequestCommandService.acceptQuotationForRequest(
      quotation.shipmentRequestId,
      quotation.id,
    );
  }

  @CacheEvict({
    keyPrefix: QUOTATION_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async requestManualPricing(id: string): Promise<void> {
    const quotationDto = await this.quotationQueryService.findById(id);

    await this.shipmentRequestQueryService.findById(
      quotationDto.shipmentRequestId,
    );

    const quotation = new Quotation(
      quotationDto.id,
      quotationDto.shipmentRequestId,
      quotationDto.status as any,
      quotationDto.quotationType as 'AUTOMATIC' | 'MANUAL',
    );

    quotation.requestManualPrice();

    await this.quotationCommandRepository.updateStatus(
      quotation.id,
      quotation.status,
    );

    // TODO: Trigger notification to the specific company to price this quotation
  }

  @CacheEvict({
    keyPrefix: QUOTATION_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async submitManualPrice(
    id: string,
    dto: SubmitQuotationPriceDto,
  ): Promise<void> {
    const quotationDto = await this.quotationQueryService.findById(id);

    // Validate access to the parent shipment request using company's scope
    await this.shipmentRequestQueryService.findById(
      quotationDto.shipmentRequestId,
    );

    const quotation = new Quotation(
      quotationDto.id,
      quotationDto.shipmentRequestId,
      quotationDto.status as any,
      quotationDto.quotationType as 'AUTOMATIC' | 'MANUAL',
    );

    quotation.submitPrice(
      dto.amount,
      dto.basePrice,
      dto.weightCharge,
      dto.extraFees,
    );

    const principal = this.requestContextService.getPrincipal();
    const employeeId = principal.profileId || null; // For TENANT_ADMIN, it might be undefined/null

    await this.quotationCommandRepository.submitPrice(
      quotation.id,
      {
        amount: dto.amount,
        basePrice: dto.basePrice,
        weightCharge: dto.weightCharge,
        extraFees: dto.extraFees,
      },
      quotation.status,
      employeeId,
    );

    // TODO: Send notification to the customer that the quotation has been priced
  }
}
