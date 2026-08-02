import { RegisterDto } from '../dtos/requests/register.dto';
import { ResendOtpDto } from '../dtos/requests/resend-otp.dto';
import { VerifyOtpDto } from '../dtos/requests/verify-otp.dto';
import { UploadProfileImageResponseDto } from '../dtos/responses/upload-profile-image.dto';
import type { StorageFile } from '../../../packages/storage/src/contracts/storage-provider.interface';
import { ForgotPasswordDto } from '../dtos/requests/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/requests/reset-password.dto';
import { ChangePasswordDto } from '../dtos/requests/change-password.dto';

export interface ICustomerCommandService {
  register(dto: RegisterDto): Promise<{ message: string }>;
  resendOtp(dto: ResendOtpDto): Promise<{ message: string }>;
  verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }>;
  uploadProfileImage(
    userId: string,
    file: StorageFile,
  ): Promise<UploadProfileImageResponseDto>;
  forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }>;
  resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }>;
}
