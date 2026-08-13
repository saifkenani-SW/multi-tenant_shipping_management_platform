import { Injectable, Logger } from '@nestjs/common';
import {
  QuotationStatus,
  QuotationType,
  RequestStatus,
  ShipmentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';
import { SEEDED_GLOBAL_LOCATIONS } from '../system/global-location.seeder';

@Injectable()
export class ShipmentRequestSeeder implements Seeder {
  private readonly logger = new Logger(ShipmentRequestSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ShipmentRequestSeeder...');

    const tenant1 = SEEDED_TENANTS[0];
    const customer = await this.prisma.customer_profile.findFirst();
    const orgUnit = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const employee = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant1.id },
    });

    if (!customer || !orgUnit || !employee) {
      this.logger.warn(
        'Skipping ShipmentRequestSeeder: missing customer/orgUnit/employee',
      );
      return;
    }

    const reqId = '00000000-0000-7000-8000-000000000801';
    const request = await this.prisma.shipment_request.upsert({
      where: { id: reqId },
      update: {
        status: RequestStatus.CONVERTED,
      },
      create: {
        id: reqId,
        customer_profile_id: customer.id,
        target_tenant_id: tenant1.id,
        origin_global_location_id: SEEDED_GLOBAL_LOCATIONS[2].id,
        destination_global_location_id: SEEDED_GLOBAL_LOCATIONS[2].id,
        sender_name: 'John Sender',
        sender_phone: '+123456789',
        receiver_name: 'Jane Receiver',
        receiver_phone: '+987654321',
        expected_pieces_count: 2,
        expected_total_weight_kg: 5.5,
        status: RequestStatus.CONVERTED,
        created_by_employee_id: employee.id,
      },
    });

    const quoteId = '00000000-0000-7000-8000-000000000811';
    const quotation = await this.prisma.quotation.upsert({
      where: { id: quoteId },
      update: {
        status: QuotationStatus.APPROVED,
      },
      create: {
        id: quoteId,
        tenant_id: tenant1.id,
        shipment_request_id: request.id,
        origin_org_unit_id: orgUnit.id,
        destination_org_unit_id: orgUnit.id,
        quotation_type: QuotationType.AUTOMATIC,
        base_price: 25.0,
        weight_charge: 10.0,
        extra_fees: 0.0,
        amount: 35.0,
        status: QuotationStatus.APPROVED,
        submitted_by_employee_id: employee.id,
      },
    });

    const shipmentId = '00000000-0000-7000-8000-000000000821';
    await this.prisma.customer_shipment.upsert({
      where: { id: shipmentId },
      update: {
        status: ShipmentStatus.PROCESSING,
      },
      create: {
        id: shipmentId,
        tenant_id: tenant1.id,
        shipment_request_id: request.id,
        origin_org_unit_id: orgUnit.id,
        destination_org_unit_id: orgUnit.id,
        sender_name: 'John Sender',
        sender_phone: '+123456789',
        receiver_name: 'Jane Receiver',
        receiver_phone: '+987654321',
        total_chargeable_weight_kg: 5.5,
        status: ShipmentStatus.PROCESSING,
      },
    });

    this.logger.log('ShipmentRequestSeeder completed.');
  }
}
