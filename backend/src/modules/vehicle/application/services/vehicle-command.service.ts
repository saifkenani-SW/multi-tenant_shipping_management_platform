import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { VehicleCommandRepository } from '../../infrastructure/repositories/vehicle-command.repository';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { DuplicateVehiclePlateException } from '../../domain/exceptions/duplicate-vehicle-plate.exception';
import { MissingTenantContextException } from '../../domain/exceptions/missing-tenant-context.exception';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { CreateVehicleDto } from '../dtos/requests/create-vehicle.dto';
import { UpdateVehicleDto } from '../dtos/requests/update-vehicle.dto';

@Injectable()
export class VehicleCommandService {
  constructor(
    private readonly vehicleCommandRepository: VehicleCommandRepository,
    private readonly vehicleQueryRepository: VehicleQueryRepository,
    private readonly requestContext: RequestContextService,
  ) {}

  async createVehicle(dto: CreateVehicleDto): Promise<string> {
    const tenantId = this.resolveTenantId();

    if (
      await this.vehicleQueryRepository.existsByPlateNumber(
        tenantId,
        dto.plateNumber,
      )
    ) {
      throw new DuplicateVehiclePlateException(dto.plateNumber);
    }

    const vehicle = await this.vehicleCommandRepository.create({
      tenantId,
      plateNumber: dto.plateNumber,
      type: dto.type ?? null,
      capacityKg: dto.capacityKg ?? null,
      status: dto.status ?? VehicleStatus.ACTIVE,
    });

    return vehicle.id;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<void> {
    const tenantId = this.resolveTenantId();
    const vehicle = await this.vehicleQueryRepository.findById(tenantId, id);

    if (!vehicle) {
      throw new VehicleNotFoundException();
    }

    if (
      dto.plateNumber &&
      dto.plateNumber !== vehicle.plateNumber &&
      (await this.vehicleQueryRepository.existsByPlateNumber(
        tenantId,
        dto.plateNumber,
        id,
      ))
    ) {
      throw new DuplicateVehiclePlateException(dto.plateNumber);
    }

    await this.vehicleCommandRepository.update(id, {
      plateNumber: dto.plateNumber,
      type: dto.type,
      capacityKg: dto.capacityKg,
      status: dto.status,
    });
  }

  private resolveTenantId(): string {
    const tenantId = this.requestContext.getPrincipal()?.tenantId;

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
