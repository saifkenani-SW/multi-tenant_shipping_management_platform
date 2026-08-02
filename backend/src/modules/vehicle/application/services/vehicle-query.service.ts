import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { MissingTenantContextException } from '../../domain/exceptions/missing-tenant-context.exception';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VehicleQueryCriteriaBuilder } from '../builders/query/vehicle-query-criteria.builder';
import { VehicleQueryDto } from '../dtos/requests/vehicle-query.dto';
import { VehicleDetailsDto } from '../dtos/responses/vehicle-details.dto';
import { PaginatedVehicleListDto } from '../dtos/responses/vehicle-list.dto';
import { VehicleResponseMapper } from '../mappers/vehicle-response.mapper';

@Injectable()
export class VehicleQueryService {
  constructor(
    private readonly vehicleQueryRepository: VehicleQueryRepository,
    private readonly vehicleQueryCriteriaBuilder: VehicleQueryCriteriaBuilder,
    private readonly vehicleResponseMapper: VehicleResponseMapper,
    private readonly requestContext: RequestContextService,
  ) {}

  async findVehicles(query: VehicleQueryDto): Promise<PaginatedVehicleListDto> {
    const criteria = this.vehicleQueryCriteriaBuilder.build(
      query,
      this.resolveTenantId(),
    );
    const [vehicles, total] =
      await this.vehicleQueryRepository.findMany(criteria);

    return this.vehicleResponseMapper.toPaginatedListDto(
      vehicles,
      total,
      criteria.pagination,
    );
  }

  async getVehicleDetails(id: string): Promise<VehicleDetailsDto> {
    const vehicle = await this.vehicleQueryRepository.findById(
      this.resolveTenantId(),
      id,
    );

    if (!vehicle) {
      throw new VehicleNotFoundException();
    }

    return this.vehicleResponseMapper.toDetailsDto(vehicle);
  }

  private resolveTenantId(): string {
    const tenantId = this.requestContext.getPrincipal()?.tenantId;

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
