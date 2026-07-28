import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TransactionalPrismaService } from '../../../core/transaction';
import {
  CreateGlobalLocationRepositoryData,
  UpdateGlobalLocationRepositoryData,
} from '../contracts/persistence/global-location-repository-data.types';
import { IGlobalLocationCommandRepository } from '../interfaces/global-location.command.repository.interface';

/**
 * `location` من نوع geometry(Point, 4326)، وهو Unsupported في Prisma:
 * لا يمكن قراءته ولا كتابته عبر الـ client المولّد. لذلك تمر كل عملية
 * كتابة تلمس الإحداثيات عبر SQL خام.
 *
 * الاستعلامات مبنية بـ Prisma.sql مع قيم مُمَعلمة، فلا مجال للحقن.
 */
@Injectable()
export class GlobalLocationCommandRepository implements IGlobalLocationCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreateGlobalLocationRepositoryData): Promise<string> {
    const rows = await this.prisma.client.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        INSERT INTO global_location (id, name, type, parent_id, location)
        VALUES (
          gen_random_uuid(),
          ${data.name},
          ${data.type}::"LocationType",
          ${data.parentId}::uuid,
          ${this.pointExpression(data.longitude, data.latitude)}
        )
        RETURNING id
      `,
    );

    return rows[0].id;
  }

  async update(
    id: string,
    data: UpdateGlobalLocationRepositoryData,
  ): Promise<void> {
    const assignments: Prisma.Sql[] = [];

    if (data.name !== undefined) {
      assignments.push(Prisma.sql`name = ${data.name}`);
    }

    // الإحداثيات تُحدَّث كوحدة واحدة: نصف نقطة ليس حالة صحيحة.
    if (data.longitude !== undefined || data.latitude !== undefined) {
      assignments.push(
        Prisma.sql`location = ${this.pointExpression(
          data.longitude ?? null,
          data.latitude ?? null,
        )}`,
      );
    }

    if (assignments.length === 0) {
      return;
    }

    await this.prisma.client.$executeRaw(
      Prisma.sql`
        UPDATE global_location
        SET ${Prisma.join(assignments, ', ')}
        WHERE id = ${id}::uuid
      `,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.global_location.delete({ where: { id } });
  }

  /**
   * NULL صريح عند غياب الإحداثيات، وإلا فشل ST_SetSRID على قيم فارغة.
   */
  private pointExpression(
    longitude: number | null,
    latitude: number | null,
  ): Prisma.Sql {
    if (longitude === null || latitude === null) {
      return Prisma.sql`NULL`;
    }

    return Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  }
}
