import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '../../../core/constants/permissions.enum';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';
import type { ICustomerQueryService } from '../../customer/interfaces/customer.query.service.interface';
import type { IShipmentRequestQueryRepository } from '../interfaces/shipment-request.query.repository.interface';
import { IShipmentRequestQueryService } from '../interfaces/shipment-request.query.service.interface';
import { ShipmentRequestQueryDto } from '../dtos/requests/shipment-request-query.dto';
import {
  PaginatedShipmentRequestListDto,
  ShipmentRequestListItemDto,
} from '../dtos/responses/shipment-request-list.dto';
import { ShipmentRequestDetailsDto } from '../dtos/responses/shipment-request-details.dto';
import { QuotationListItemDto } from '../dtos/responses/quotation-list-item.dto';
import { ShipmentRequest } from '../domain/shipment-request.entity';

@Injectable()
export class ShipmentRequestQueryService
  implements IShipmentRequestQueryService
{
  constructor(
    @Inject('IShipmentRequestQueryRepository')
    private readonly shipmentRequestQueryRepository: IShipmentRequestQueryRepository,
    @Inject('ICustomerQueryService')
    private readonly customerQueryService: ICustomerQueryService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  private async resolveCustomerProfileId(userId: string): Promise<string> {
    const profile = await this.customerQueryService.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }
    return profile.id;
  }

  private async assertEmployeePermission(
    employeeUserId: string,
    permission: Permission,
  ): Promise<void> {
    const roleIds =
      await this.permissionCacheService.getUserRoleIds(employeeUserId);
    const permissions = new Set<string>();
    for (const roleId of roleIds) {
      const rolePermissions =
        await this.permissionCacheService.getRolePermissions(roleId);
      rolePermissions.forEach((p) => permissions.add(p));
    }
    if (!permissions.has(permission)) {
      throw new ForbiddenException(
        'You do not have the necessary permissions',
      );
    }
  }

  private toListItem(entity: ShipmentRequest): ShipmentRequestListItemDto {
    const dto = new ShipmentRequestListItemDto();
    dto.id = entity.id;
    dto.status = entity.status;
    dto.senderName = entity.senderName;
    dto.receiverName = entity.receiverName;
    dto.targetTenantId = entity.targetTenantId;
    dto.createdAt = entity.createdAt;
    return dto;
  }

  private toDetails(entity: ShipmentRequest): ShipmentRequestDetailsDto {
    const dto = new ShipmentRequestDetailsDto();
    dto.id = entity.id;
    dto.status = entity.status;
    dto.senderName = entity.senderName;
    dto.senderPhone = entity.senderPhone;
    dto.senderAddress = entity.senderAddress;
    dto.receiverName = entity.receiverName;
    dto.receiverPhone = entity.receiverPhone;
    dto.receiverAddress = entity.receiverAddress;
    dto.expectedPiecesCount = entity.expectedPiecesCount;
    dto.expectedTotalWeightKg = entity.expectedTotalWeightKg;
    dto.notes = entity.notes;
    dto.targetTenantId = entity.targetTenantId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.cancelledAt = entity.cancelledAt;
    dto.cancellationReason = entity.cancellationReason;
    return dto;
  }

  async findRequestsForCustomer(
    userId: string,
    query: ShipmentRequestQueryDto,
  ): Promise<PaginatedShipmentRequestListDto> {
    const customerProfileId = await this.resolveCustomerProfileId(userId);

    const skip = (query.page - 1) * query.limit;
    const [items, total] =
      await this.shipmentRequestQueryRepository.findManyForCustomer(
        customerProfileId,
        skip,
        query.limit,
        query.status,
      );

    const result = new PaginatedShipmentRequestListDto();
    result.data = items.map((item) => this.toListItem(item));
    result.meta = { page: query.page, limit: query.limit, total };
    return result;
  }

  async findRequestsForEmployee(
    employeeUserId: string,
    tenantId: string,
    query: ShipmentRequestQueryDto,
  ): Promise<PaginatedShipmentRequestListDto> {
    await this.assertEmployeePermission(
      employeeUserId,
      Permission.READ_SHIPMENT_REQUEST,
    );

    const skip = (query.page - 1) * query.limit;
    const [items, total] =
      await this.shipmentRequestQueryRepository.findManyForEmployee(
        tenantId,
        skip,
        query.limit,
        query.status,
      );

    const result = new PaginatedShipmentRequestListDto();
    result.data = items.map((item) => this.toListItem(item));
    result.meta = { page: query.page, limit: query.limit, total };
    return result;
  }

  async getRequestDetailsForCustomer(
    userId: string,
    shipmentRequestId: string,
  ): Promise<ShipmentRequestDetailsDto> {
    const customerProfileId = await this.resolveCustomerProfileId(userId);
    const request =
      await this.shipmentRequestQueryRepository.findById(shipmentRequestId);

    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }
    if (request.customerProfileId !== customerProfileId) {
      throw new ForbiddenException('You do not own this shipment request');
    }

    return this.toDetails(request);
  }

  async getRequestDetailsForEmployee(
    employeeUserId: string,
    tenantId: string,
    shipmentRequestId: string,
  ): Promise<ShipmentRequestDetailsDto> {
    await this.assertEmployeePermission(
      employeeUserId,
      Permission.READ_SHIPMENT_REQUEST,
    );

    const request =
      await this.shipmentRequestQueryRepository.findById(shipmentRequestId);

    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }
    if (request.targetTenantId !== tenantId) {
      throw new ForbiddenException(
        'This request was not assigned to your company',
      );
    }

    return this.toDetails(request);
  }

  async getQuotationsForCustomer(
    userId: string,
    shipmentRequestId: string,
  ): Promise<QuotationListItemDto[]> {
    const customerProfileId = await this.resolveCustomerProfileId(userId);
    const request =
      await this.shipmentRequestQueryRepository.findById(shipmentRequestId);

    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }
    if (request.customerProfileId !== customerProfileId) {
      throw new ForbiddenException('You do not own this shipment request');
    }

    const quotations =
      await this.shipmentRequestQueryRepository.findQuotationsByRequestId(
        shipmentRequestId,
      );

    return quotations.map((q) => {
      const dto = new QuotationListItemDto();
      dto.id = q.id;
      dto.tenantId = q.tenantId;
      dto.tenantName = q.tenantName;
      dto.amount = q.amount;
      dto.status = q.status;
      dto.validUntil = q.validUntil;
      dto.notes = q.notes;
      dto.createdAt = q.createdAt;
      return dto;
    });
  }
}
