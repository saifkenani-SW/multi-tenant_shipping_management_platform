import { RegisterDto } from '../dtos/requests/register.dto';
import { ResendOtpDto } from '../dtos/requests/resend-otp.dto';
import { VerifyOtpDto } from '../dtos/requests/verify-otp.dto';

export interface ICustomerCommandService {
  register(dto: RegisterDto): Promise<{ message: string }>;
  resendOtp(dto: ResendOtpDto): Promise<{ message: string }>;
  verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }>;
}
