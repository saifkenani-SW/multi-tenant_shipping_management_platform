import { Injectable, Logger } from '@nestjs/common';
import { CustomerShipmentQueryRepository } from '../../infrastructure/repositories/customer-shipment.query.repository';
import { CustomerShipmentQueryDto } from '../dtos/requests/customer-shipment-query.dto';
import { CustomerShipmentListDto } from '../dtos/responses/customer-shipment-list.dto';
import { CustomerShipmentDetailsDto } from '../dtos/responses/customer-shipment-details.dto';
import { CustomerShipmentQueryCriteriaBuilder } from '../builders/query/customer-shipment-query-criteria.builder';
import { CustomerShipmentResponseMapper } from '../mappers/customer-shipment.response.mapper';
import { CustomerShipmentNotFoundException } from '../../domain/exceptions/customer-shipment-not-found.exception';

@Injectable()
export class CustomerShipmentQueryService {
  private readonly logger = new Logger(CustomerShipmentQueryService.name);

  constructor(
    private readonly queryRepository: CustomerShipmentQueryRepository,
  ) {}

  async getShipmentDetails(id: string): Promise<CustomerShipmentDetailsDto> {
    this.logger.log(`Fetching details for shipment ${id}`);

    const shipment = await this.queryRepository.findById(id);
    if (!shipment) {
      throw new CustomerShipmentNotFoundException(id);
    }

    return CustomerShipmentResponseMapper.toDetailsDto(shipment);
  }

  async findShipments(dto: CustomerShipmentQueryDto): Promise<CustomerShipmentListDto> {
    this.logger.log(`Finding shipments with query criteria`);

    const criteria = CustomerShipmentQueryCriteriaBuilder.fromDto(dto).build();
    const paginatedShipments = await this.queryRepository.findMany(criteria);

    return new CustomerShipmentListDto(
      paginatedShipments.data.map(s => CustomerShipmentResponseMapper.toDetailsDto(s)),
      paginatedShipments.meta
    );
  }
}
