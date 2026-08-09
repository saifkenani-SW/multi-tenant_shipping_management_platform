import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction/services/transactional-prisma.service';
import { CreateShipmentRequestDto } from '../../application/dtos/requests/create-shipment-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class ShipmentRequestCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(
    customerProfileId: string,
    dto: CreateShipmentRequestDto,
    id: string,
  ): Promise<{ id: string }> {
    await this.prisma.client.shipment_request.create({
      data: {
        id,
        target_tenant_id: dto.target_tenant_id,
        customer_profile_id: customerProfileId,
        origin_global_location_id: dto.origin_global_location_id,
        destination_global_location_id: dto.destination_global_location_id,
        sender_name: dto.sender_name,
        sender_phone: dto.sender_phone,
        sender_lat: dto.sender_lat,
        sender_lng: dto.sender_lng,
        receiver_name: dto.receiver_name,
        receiver_phone: dto.receiver_phone,
        receiver_lat: dto.receiver_lat,
        receiver_lng: dto.receiver_lng,
        expected_pieces_count: dto.expected_pieces_count,
        expected_total_weight_kg: dto.expected_total_weight_kg,
        expected_length_cm: dto.expected_length_cm,
        expected_width_cm: dto.expected_width_cm,
        expected_height_cm: dto.expected_height_cm,
        notes: dto.notes,
        status: RequestStatus.PENDING,
      },
    });

    return { id };
  }

  async updateStatusAndQuotation(
    id: string,
    status: RequestStatus,
    quotationId: string,
  ): Promise<void> {
    await this.prisma.client.shipment_request.update({
      where: { id },
      data: {
        status,
        approved_quotation_id: quotationId,
      },
    });
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
  ): Promise<void> {
    await this.prisma.client.shipment_request.update({
      where: { id },
      data: { status },
    });
  }
}
