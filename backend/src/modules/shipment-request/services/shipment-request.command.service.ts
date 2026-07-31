import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { Transactional } from '../../../packages/transaction';

import type { ICustomerQueryService } from '../../customer/interfaces/customer.query.service.interface';
import { CreateShipmentRequestDto } from '../dtos/requests/create-shipment-request.dto';
import { RejectShipmentRequestDto } from '../dtos/requests/reject-shipment-request.dto';
import { CancelShipmentRequestDto } from '../dtos/requests/cancel-shipment-request.dto';
import type { IShipmentRequestCommandRepository } from '../interfaces/shipment-request.command.repository.interface';
import { IShipmentRequestCommandService } from '../interfaces/shipment-request.command.service.interface';
import { SHIPMENT_REQUEST_CACHE_KEYS } from '../constants/shipment-request.cache.constants';
import { ShipmentRequestAccessPolicy } from '../policies/shipment-request-access.policy';
import { Permission } from '../../../core/security/Permission';

const CANCELLABLE_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.CUSTOMER_APPROVED,
  RequestStatus.CONVERTED,
];

@Injectable()
export class ShipmentRequestCommandService implements IShipmentRequestCommandService {
  constructor(
    @Inject('IShipmentRequestCommandRepository')
    private readonly shipmentRequestRepository: IShipmentRequestCommandRepository,
    @Inject('ICustomerQueryService')
    private readonly customerQueryService: ICustomerQueryService,
    private readonly accessPolicy: ShipmentRequestAccessPolicy,
  ) {}

  private async resolveCustomerProfileId(userId: string): Promise<string> {
    const profile = await this.customerQueryService.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }
    return profile.id;
  }

  @CacheEvict({ keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.LIST, allEntries: true })
  async createRequest(
    userId: string,
    dto: CreateShipmentRequestDto,
  ): Promise<{ id: string }> {
    const customerProfileId = await this.resolveCustomerProfileId(userId);

    const request = await this.shipmentRequestRepository.create({
      customerProfileId,
      senderName: dto.senderName,
      senderPhone: dto.senderPhone,
      senderAddress: dto.senderAddress,
      senderLat: dto.senderLat,
      senderLng: dto.senderLng,
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
      receiverAddress: dto.receiverAddress,
      receiverLat: dto.receiverLat,
      receiverLng: dto.receiverLng,
      expectedPiecesCount: dto.expectedPiecesCount ?? 1,
      expectedTotalWeightKg: dto.expectedTotalWeightKg,
      notes: dto.notes,
      targetTenantId: dto.targetTenantId,
    });

    return { id: request.id };
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  @Transactional()
  async approveQuotation(
    userId: string,
    shipmentRequestId: string,
    quotationId: string,
  ): Promise<void> {
    const request =
      await this.shipmentRequestRepository.findById(shipmentRequestId);
    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }

    const customerProfileId = await this.resolveCustomerProfileId(userId);
    if (customerProfileId !== request.customerProfileId) {
      throw new ForbiddenException('You do not own this shipment request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Only pending requests can have a quotation approved',
      );
    }

    await this.shipmentRequestRepository.approveQuotation(
      shipmentRequestId,
      quotationId,
    );
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  @Transactional()
  async acceptByEmployee(
    employeeUserId: string,
    shipmentRequestId: string,
  ): Promise<void> {
    const request =
      await this.shipmentRequestRepository.findById(shipmentRequestId);
    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }

    await this.accessPolicy.assertCanAct(
      employeeUserId,
      request,
      Permission.MANAGE_SHIPMENT_REQUEST,
    );

    if (request.status !== RequestStatus.CUSTOMER_APPROVED) {
      throw new BadRequestException(
        'Only customer-approved requests can be accepted',
      );
    }

    await this.shipmentRequestRepository.acceptByEmployee(shipmentRequestId);
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async reject(
    employeeUserId: string,
    shipmentRequestId: string,
    dto: RejectShipmentRequestDto,
  ): Promise<void> {
    const request =
      await this.shipmentRequestRepository.findById(shipmentRequestId);
    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }

    await this.accessPolicy.assertCanAct(
      employeeUserId,
      request,
      Permission.MANAGE_SHIPMENT_REQUEST,
    );

    if (request.status !== RequestStatus.CUSTOMER_APPROVED) {
      throw new BadRequestException(
        'Only customer-approved requests can be rejected',
      );
    }

    await this.shipmentRequestRepository.reject(shipmentRequestId, dto.reason);
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_REQUEST_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async cancel(
    userId: string,
    shipmentRequestId: string,
    dto: CancelShipmentRequestDto,
  ): Promise<void> {
    const request =
      await this.shipmentRequestRepository.findById(shipmentRequestId);
    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }

    const customerProfileId = await this.resolveCustomerProfileId(userId);
    if (customerProfileId !== request.customerProfileId) {
      throw new ForbiddenException('You do not own this shipment request');
    }

    if (!CANCELLABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException('This request can no longer be cancelled');
    }

    const hasCollectedParcel =
      await this.shipmentRequestRepository.hasCollectedParcel(
        shipmentRequestId,
      );
    if (hasCollectedParcel) {
      throw new ConflictException(
        'Cannot cancel: the parcel has already been collected',
      );
    }

    await this.shipmentRequestRepository.cancel(shipmentRequestId, dto.reason);
  }
}
