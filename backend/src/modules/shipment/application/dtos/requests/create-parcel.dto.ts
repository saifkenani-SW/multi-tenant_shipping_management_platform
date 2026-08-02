import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { ParcelCondition } from '../../../domain/enums/parcel-condition.enum';

export class CreateParcelDto {
  @ApiProperty({ description: 'Actual weight of the parcel in kg' })
  @IsNumber()
  @Min(0.01)
  actualWeightKg: number;

  @ApiProperty({ description: 'Length of the parcel in cm' })
  @IsNumber()
  @Min(1)
  lengthCm: number;

  @ApiProperty({ description: 'Width of the parcel in cm' })
  @IsNumber()
  @Min(1)
  widthCm: number;

  @ApiProperty({ description: 'Height of the parcel in cm' })
  @IsNumber()
  @Min(1)
  heightCm: number;

  @ApiProperty({ enum: ParcelCondition, default: ParcelCondition.NORMAL })
  @IsEnum(ParcelCondition)
  condition: ParcelCondition;
}
