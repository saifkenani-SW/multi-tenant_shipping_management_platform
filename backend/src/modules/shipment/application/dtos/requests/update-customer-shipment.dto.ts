import { PartialType } from '@nestjs/swagger';
import { CreateCustomerShipmentDto } from './create-customer-shipment.dto';

export class UpdateCustomerShipmentDto extends PartialType(CreateCustomerShipmentDto) {}
