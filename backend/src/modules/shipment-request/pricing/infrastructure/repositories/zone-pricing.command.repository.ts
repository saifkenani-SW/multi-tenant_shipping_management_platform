import { Injectable } from '@nestjs/common';
import { CreateZonePricingDto } from '../../application/dtos/requests/create-zone-pricing.dto';
import { UpdateZonePricingDto } from '../../application/dtos/requests/update-zone-pricing.dto';
import { TransactionalPrismaService } from 'src/packages/transaction';

@Injectable()
export class ZonePricingCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(
    tenantId: string,
    dto: CreateZonePricingDto,
  ): Promise<{ id: string }> {
    const created = await this.prisma.client.zone_pricing_matrix.create({
      data: {
        tenant_id: tenantId,
        origin_zone_id: dto.originZoneId,
        destination_zone_id: dto.destinationZoneId,
        service_level: dto.serviceLevel,
        base_price: dto.basePrice,
        base_weight_kg: dto.baseWeightKg,
        price_per_extra_kg: dto.pricePerExtraKg ?? 0,
        is_active: dto.isActive ?? true,
      },
      select: { id: true },
    });
    return { id: created.id };
  }

  async createMany(
    tenantId: string,
    dtos: CreateZonePricingDto[],
  ): Promise<void> {
    const data = dtos.map((dto) => ({
      tenant_id: tenantId,
      origin_zone_id: dto.originZoneId,
      destination_zone_id: dto.destinationZoneId,
      service_level: dto.serviceLevel,
      base_price: dto.basePrice,
      base_weight_kg: dto.baseWeightKg,
      price_per_extra_kg: dto.pricePerExtraKg ?? 0,
      is_active: dto.isActive ?? true,
    }));

    await this.prisma.client.zone_pricing_matrix.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async update(id: string, dto: UpdateZonePricingDto): Promise<{ id: string }> {
    const updateData = {
      base_price: dto.basePrice,
      base_weight_kg: dto.baseWeightKg,
      price_per_extra_kg: dto.pricePerExtraKg,
      is_active: dto.isActive,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updated = await this.prisma.client.zone_pricing_matrix.update({
      where: { id },
      data: updateData,
      select: { id: true },
    });

    return { id: updated.id };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.zone_pricing_matrix.delete({
      where: { id },
    });
  }
}
