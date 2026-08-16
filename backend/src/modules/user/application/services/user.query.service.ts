import { Injectable } from '@nestjs/common';
import {
  UserQueryRepository,
  UserSummary,
} from '../../infrastructure/repositories/user.query.repository';
import { UserLoginType } from '../../../auth/types/auth.types';

export interface UserProfileInfo {
  type: UserLoginType;
  tenantId?: string;
  isActive: boolean;
  employeeId?: string;
  vehicleId?: string;
  profileId?: string;
}

export interface UserIdentityResult {
  userId: string;
  passwordHash: string;
  profiles: UserProfileInfo[];
}

@Injectable()
export class UserQueryService {
  constructor(private readonly queryRepository: UserQueryRepository) {}

  async existsAndActive(userId: string): Promise<boolean> {
    return this.queryRepository.exists(userId);
  }

  async getUserSummary(userId: string): Promise<UserSummary | null> {
    return this.queryRepository.getUserSummary(userId);
  }

  async getUserSummaryByPhone(phone: string): Promise<UserSummary | null> {
    return this.queryRepository.getUserSummaryByPhone(phone);
  }

  async getIdentityByEmail(email: string): Promise<UserIdentityResult | null> {
    const data = await this.queryRepository.getUserIdentityByEmail(email);

    if (!data) return null;

    const profiles: UserProfileInfo[] = [];

    if (data.platformOwner) {
      profiles.push({
        type: UserLoginType.PLATFORM_OWNER,
        isActive: data.platformOwner.is_active,
      });
    }

    if (data.tenantOwners.length > 0) {
      for (const owner of data.tenantOwners) {
        profiles.push({
          type: UserLoginType.TENANT_ADMIN,
          tenantId: owner.tenant_id,
          isActive: true, // Assuming intrinsic active state
        });
      }
    }

    if (data.employees.length > 0) {
      for (const emp of data.employees) {
        profiles.push({
          type: UserLoginType.EMPLOYEE,
          tenantId: emp.tenant_id,
          isActive: emp.is_active,
          employeeId: emp.id,
        });

        // Check if this employee is also a driver
        const activeVehicleAssignment = data.vehicleAssignments.find(
          (va) => va.employee_id === emp.id,
        );

        if (activeVehicleAssignment) {
          profiles.push({
            type: UserLoginType.DRIVER,
            tenantId: emp.tenant_id,
            isActive: emp.is_active, // Driver is active if employee is active
            employeeId: emp.id,
            vehicleId: activeVehicleAssignment.vehicle_id,
          });
        }
      }
    }

    if (data.customerProfile) {
      profiles.push({
        type: UserLoginType.CUSTOMER,
        isActive: true,
        profileId: data.customerProfile.id,
      });
    }

    return {
      userId: data.user.id,
      passwordHash: data.user.password_hash,
      profiles,
    };
  }
}
