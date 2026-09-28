import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('simulate-error')
  simulateError() {
    throw new InternalServerErrorException(
      'PaymentGatewayTimeout: Failed to process payment for shipment SHP-9921 in tenant logistics-corp',
    );
  }
}
