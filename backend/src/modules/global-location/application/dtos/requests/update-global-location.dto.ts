import { PartialType } from '@nestjs/swagger';
import { CreateGlobalLocationDto } from './create-global-location.dto';

export class UpdateGlobalLocationDto extends PartialType(CreateGlobalLocationDto) {}
