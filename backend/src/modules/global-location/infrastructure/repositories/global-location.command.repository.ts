import { Injectable, HttpStatus } from '@nestjs/common';
import { ApiError } from '../../../../common/errors/api.error';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { generateUuid } from '../../../../common/uuid';
import { CreateGlobalLocationDto } from '../../application/dtos/requests/create-global-location.dto';
import { UpdateGlobalLocationDto } from '../../application/dtos/requests/update-global-location.dto';
import { GeoPoint } from '../../domain/geo-point.value-object';

@Injectable()
export class GlobalLocationCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateGlobalLocationDto): Promise<string> {
    const id = generateUuid();

    if (data.location) {
      await this.prisma.$executeRaw`
        INSERT INTO global_location (id, name, type, parent_id, location )
        VALUES (
          ${id}::uuid, 
          ${data.name}, 
          ${data.type}::"LocationType", 
          ${data.parentId ? data.parentId : null}::uuid, 
          ${Prisma.raw(new GeoPoint(data.location.longitude, data.location.latitude).toPostGisPoint())}
        )
      `;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO global_location (id, name, type, parent_id, location)
        VALUES (
          ${id}::uuid, 
          ${data.name}, 
          ${data.type}::"LocationType", 
          ${data.parentId ? data.parentId : null}::uuid, 
          NULL
        )
      `;
    }

    return id;
  }

  async update(id: string, data: UpdateGlobalLocationDto): Promise<void> {
    // For update, we'll build the SET clause dynamically using Prisma.sql
    const updates: Prisma.Sql[] = [];

    if (data.name !== undefined) {
      updates.push(Prisma.sql`name = ${data.name}`);
    }

    if (data.type !== undefined) {
      updates.push(Prisma.sql`type = ${data.type}::"LocationType"`);
    }

    if (data.parentId !== undefined) {
      updates.push(
        Prisma.sql`parent_id = ${data.parentId ? data.parentId : null}::uuid`,
      );
    }

    if (data.location !== undefined) {
      if (data.location === null) {
        updates.push(Prisma.sql`location = NULL`);
      } else {
        const geoPoint = new GeoPoint(
          data.location.longitude,
          data.location.latitude,
        );
        updates.push(
          Prisma.sql`location = ${Prisma.raw(geoPoint.toPostGisPoint())}`,
        );
      }
    }

    if (updates.length === 0) return;
    const setQuery = Prisma.join(updates, ', ');

    const rowsAffected = await this.prisma.$executeRaw`
      UPDATE global_location
      SET ${setQuery}
      WHERE id = ${id}::uuid
    `;

    if (rowsAffected === 0) {
      throw new ApiError(
        'الموقع الجغرافي المطلوب غير موجود',
        HttpStatus.NOT_FOUND,
        'موقع_غير_موجود',
      );
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.global_location.delete({
      where: { id },
    });
  }
}
