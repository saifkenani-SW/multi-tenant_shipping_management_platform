import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../core/transaction';
import {
  CreateShipmentRequestData,
  IShipmentRequestCommandRepository,
} from '../interfaces/shipment-request.command.repository.interface';
import { ShipmentRequest } from '../domain/shipment-request.entity';
import { RequestStatus, QuotationStatus, PaymentResponsibility, ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentRequestCommandRepository
  implements IShipmentRequestCommandRepository
{
  constructor(private readonly prisma: TransactionalPrismaService) {}

  private toDomain(row: any): ShipmentRequest {
    return new ShipmentRequest(
      row.id,
      row.customer_profile_id,
      row.target_tenant_id,
      row.sender_name,
      row.sender_phone,
      row.sender_address,
      row.receiver_name,
      row.receiver_phone,
      row.receiver_address,
      row.expected_pieces_count,
      row.expected_total_weight_kg !== null
        ? Number(row.expected_total_weight_kg)
        : null,
      row.notes,
      row.status,
      row.created_at,
      row.updated_at,
      row.cancelled_at,
      row.cancellation_reason,
    );
  }

  async create(data: CreateShipmentRequestData): Promise<ShipmentRequest> {
    const row = await this.prisma.client.shipment_request.create({
      data: {
        customer_profile_id: data.customerProfileId,
        target_tenant_id: data.targetTenantId,
        sender_name: data.senderName,
        sender_phone: data.senderPhone,
        sender_address: data.senderAddress,
        sender_lat: data.senderLat,
        sender_lng: data.senderLng,
        receiver_name: data.receiverName,
        receiver_phone: data.receiverPhone,
        receiver_address: data.receiverAddress,
        receiver_lat: data.receiverLat,
        receiver_lng: data.receiverLng,
        expected_pieces_count: data.expectedPiecesCount,
        expected_total_weight_kg: data.expectedTotalWeightKg,
        notes: data.notes,
      },
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<ShipmentRequest | null> {
    const row = await this.prisma.client.shipment_request.findUnique({
      where: { id },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findCustomerProfileIdByUserId(
    userId: string,
  ): Promise<string | null> {
    const profile = await this.prisma.client.customer_profile.findUnique({
      where: { user_id: userId },
    });
    return profile?.id ?? null;
  }

  async approveQuotation(
    shipmentRequestId: string,
    quotationId: string,
  ): Promise<void> {
    const quotation = await this.prisma.client.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation || quotation.shipment_request_id !== shipmentRequestId) {
      throw new NotFoundException('Quotation not found for this request');
    }

    await this.prisma.client.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.APPROVED },
    });

    await this.prisma.client.quotation.updateMany({
      where: {
        shipment_request_id: shipmentRequestId,
        id: { not: quotationId },
      },
      data: { status: QuotationStatus.REJECTED },
    });

    await this.prisma.client.shipment_request.update({
      where: { id: shipmentRequestId },
      data: {
        status: RequestStatus.CUSTOMER_APPROVED,
        target_tenant_id: quotation.tenant_id,
      },
    });
  }

  async acceptByEmployee(shipmentRequestId: string): Promise<void> {
    const request = await this.prisma.client.shipment_request.findUnique({
      where: { id: shipmentRequestId },
    });
    if (!request) {
      throw new NotFoundException('Shipment request not found');
    }

    const approvedQuotation = await this.prisma.client.quotation.findFirst({
      where: {
        shipment_request_id: shipmentRequestId,
        status: QuotationStatus.APPROVED,
      },
    });
    if (!approvedQuotation || !request.target_tenant_id) {
      throw new NotFoundException(
        'No approved quotation found for this request',
      );
    }

    await this.prisma.client.customer_shipment.create({
      data: {
        tenant_id: request.target_tenant_id,
        customer_profile_id: request.customer_profile_id,
        shipment_request_id: request.id,
        approved_quotation_id: approvedQuotation.id,
        receiver_name: request.receiver_name,
        receiver_phone: request.receiver_phone,
        receiver_address: request.receiver_address,
        payment_responsibility: PaymentResponsibility.SENDER,
        status: ShipmentStatus.PROCESSING,
      },
    });

    await this.prisma.client.shipment_request.update({
      where: { id: shipmentRequestId },
      data: { status: RequestStatus.CONVERTED },
    });
  }

  async reject(id: string, reason?: string): Promise<void> {
    await this.prisma.client.shipment_request.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        cancelled_at: new Date(),
        cancellation_reason: reason,
      },
    });
  }

  async cancel(id: string, reason?: string): Promise<void> {
    await this.prisma.client.shipment_request.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: reason,
      },
    });
  }

  async hasCollectedParcel(shipmentRequestId: string): Promise<boolean> {
    const collected = await this.prisma.client.parcel.findFirst({
      where: {
        current_status: 'COLLECTED',
        customer_shipment: {
          shipment_request_id: shipmentRequestId,
        },
      },
    });
    return !!collected;
  }
}
