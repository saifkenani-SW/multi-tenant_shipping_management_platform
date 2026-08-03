import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerProfileDto } from './customer-profile.dto';
import { UploadProfileImageResponseDto } from './upload-profile-image.dto';

export class MessageDataDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: MessageDataDto })
  data!: MessageDataDto;
}

export class CustomerProfileResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: CustomerProfileDto })
  data!: CustomerProfileDto;
}

export class UploadProfileImageEnvelopeDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: UploadProfileImageResponseDto })
  data!: UploadProfileImageResponseDto;
}

export class CustomerApiErrorResponseDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Invalid or expired OTP' })
  message!: string;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiPropertyOptional({ type: [String] })
  details?: string[];
}
