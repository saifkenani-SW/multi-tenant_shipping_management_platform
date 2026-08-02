import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { TransactionalPrismaService } from '../../../packages/transaction';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import {
  CreateShipmentRequestData,
  IShipmentRequestCommandRepository,
} from '../interfaces/shipment-request.command.repository.interface';
import { ShipmentRequest } from '../domain/shipment-request.entity';
import {
  RequestStatus,
  QuotationStatus,
  PaymentResponsibility,
  ShipmentStatus,
} from '@prisma/client';

@Injectable()
export class ShipmentRequestCommandRepository implements IShipmentRequestCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    // مطلوبة بالتحديد لاستعلام PostGIS (نوع "location" مش مدعوم من Prisma)
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

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
      row.origin_org_unit_id,
      row.destination_org_unit_id,
    );
  }

  async findNearestOrgUnit(
    tenantId: string,
    lat: number,
    lng: number,
  ): Promise<string | null> {
    const result = await sql<{ id: string }>`
      SELECT id FROM organization_unit
      WHERE tenant_id = ${tenantId}
        AND is_active = true
        AND org_type = 'BRANCH'
        AND location IS NOT NULL
      ORDER BY location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT 1
    `.execute(this.kysely);

    return result.rows[0]?.id ?? null;
  }

  async create(data: CreateShipmentRequestData): Promise<ShipmentRequest> {
    let originOrgUnitId: string | null = null;
    let destinationOrgUnitId: string | null = null;

    // لو الزبون حدد شركة مباشرة، منقدر نحسب أقرب فرع فوراً
    if (data.targetTenantId) {
      [originOrgUnitId, destinationOrgUnitId] = await Promise.all([
        this.findNearestOrgUnit(
          data.targetTenantId,
          data.senderLat,
          data.senderLng,
        ),
        this.findNearestOrgUnit(
          data.targetTenantId,
          data.receiverLat,
          data.receiverLng,
        ),
      ]);
    }

    const row = await this.prisma.client.shipment_request.create({
      data: {
        customer_profile_id: data.customerProfileId,
        target_tenant_id: data.targetTenantId,
        origin_org_unit_id: originOrgUnitId,
        destination_org_unit_id: destinationOrgUnitId,
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

    const request = await this.prisma.client.shipment_request.findUnique({
      where: { id: shipmentRequestId },
    });
    if (!request) {
      throw new NotFoundException('Shipment request not found');
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

    // بهاي اللحظة بس بنعرف الشركة الفايزة، فمنحسب أقرب فرع لعنوان
    // المُرسِل (origin) وأقرب فرع لعنوان المُستلِم (destination) جوا هاي الشركة
    const [originOrgUnitId, destinationOrgUnitId] = await Promise.all([
      request.sender_lat && request.sender_lng
        ? this.findNearestOrgUnit(
            quotation.tenant_id,
            Number(request.sender_lat),
            Number(request.sender_lng),
          )
        : Promise.resolve(null),
      request.receiver_lat && request.receiver_lng
        ? this.findNearestOrgUnit(
            quotation.tenant_id,
            Number(request.receiver_lat),
            Number(request.receiver_lng),
          )
        : Promise.resolve(null),
    ]);

    await this.prisma.client.shipment_request.update({
      where: { id: shipmentRequestId },
      data: {
        status: RequestStatus.CUSTOMER_APPROVED,
        target_tenant_id: quotation.tenant_id,
        origin_org_unit_id: originOrgUnitId,
        destination_org_unit_id: destinationOrgUnitId,
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
        sender_customer_profile_id: request.customer_profile_id,
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
