import { ConflictException, Injectable } from '@nestjs/common';
import {
  PaymentResponsibility,
  ServiceLevel,
  ShipmentStatus,
} from '@prisma/client';
import { TransactionalPrismaService } from '../../../../../packages/transaction';

export interface CreateShipmentData {
  tenantId: string;
  senderName: string;
  senderPhone: string;
  senderNationalId: string | null;
  shipmentRequestId: string | null;
  originOrgUnitId: string;
  destinationOrgUnitId: string;
  serviceLevel: ServiceLevel;
  receiverName: string;
  receiverPhone: string;
  paymentResponsibility: PaymentResponsibility;
  totalChargeableWeightKg: number;
  status: ShipmentStatus;
  createdByEmployeeId?: string | null;
  createdByEmployeeName?: string | null;
}

@Injectable()
export class ShipmentCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreateShipmentData): Promise<{ id: string }> {
    const created = await this.prisma.client.customer_shipment.create({
      data: {
        tenant_id: data.tenantId,
        sender_name: data.senderName,
        sender_phone: data.senderPhone,
        sender_national_id: data.senderNationalId,
        shipment_request_id: data.shipmentRequestId,
        origin_org_unit_id: data.originOrgUnitId,
        destination_org_unit_id: data.destinationOrgUnitId,
        service_level: data.serviceLevel,
        receiver_name: data.receiverName,
        receiver_phone: data.receiverPhone,
        payment_responsibility: data.paymentResponsibility,
        total_chargeable_weight_kg: data.totalChargeableWeightKg,
        status: data.status,
        created_by_employee_id: data.createdByEmployeeId,
        created_by_employee_name: data.createdByEmployeeName,
      },
      select: { id: true },
    });

    return created;
  }

  /**
   * Writes a status already approved by the aggregate, guarded by the version
   * the aggregate was loaded with. A concurrent write bumps that version, the
   * WHERE stops matching, and the caller is told to retry rather than
   * overwriting the other change.
   */
  async updateStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    currentVersion: number,
  ): Promise<void> {
    const result = await this.prisma.client.customer_shipment.updateMany({
      where: { id: shipmentId, version: currentVersion },
      data: { status: newStatus, version: { increment: 1 } },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Shipment was modified by another process. Please retry.',
      );
    }
  }
}
