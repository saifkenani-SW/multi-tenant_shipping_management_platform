import { ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { EmployeeQueryService } from '../../../employee2/application/services/employee.query.service';
import { UserFacade } from '../../../user/application/facades/user.facade';
import { FleetFacade } from '../../../fleet/facades/fleet.facade';
import { MyProfileResponseDto } from '../dtos/responses/my-profile.response.dto';
import { PROFILE_AVATAR } from '../../constants/profile.constants';

/**
 * Assembles the profile of whoever is making the request.
 *
 * The identity always comes from the request context, never from the request
 * itself. There is no id to tamper with, which is what lets an employee and a
 * driver read this while neither can read anyone else's record.
 */
@Injectable()
export class ProfileQueryService {
  private readonly logger = new Logger(ProfileQueryService.name);

  constructor(
    private readonly requestContext: RequestContextService,
    private readonly employeeQueryService: EmployeeQueryService,
    private readonly userFacade: UserFacade,
    private readonly fleetFacade: FleetFacade,
  ) {}

  async getMyProfile(): Promise<MyProfileResponseDto> {
    const principal = this.requestContext.getPrincipal();
    const employeeId = principal.profileId;
    const tenantId = principal.tenantId;

    // Both are stamped on the token when an employee or a driver signs in.
    // Missing means this login type has no employee record behind it, which is
    // a different situation from "not allowed" — say so rather than 404.
    if (!employeeId || !tenantId) {
      throw new ForbiddenException(
        'This account has no employee profile attached to it.',
      );
    }

    const isDriver = principal.subject.type === SubjectType.DRIVER;

    const employee = await this.employeeQueryService.findById(
      employeeId,
      tenantId,
    );

    const [user, vehicle] = await Promise.all([
      this.userFacade.getUserSummary(employee.userId),
      isDriver ? this.loadVehicle(tenantId, employeeId) : Promise.resolve(null),
    ]);

    return {
      id: employee.id,
      tenantId: employee.tenantId,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      nationalId: employee.nationalId ?? null,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      // A path only when there is actually an image behind it, so the client
      // can treat null as "show the placeholder" without a second request.
      profileImageUrl: user?.profileImageKey
        ? PROFILE_AVATAR.urlFor(employee.userId)
        : null,
      isActive: employee.isActive,
      isDriver,
      assignments: employee.assignments,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            type: vehicle.type,
            capacityKg: vehicle.capacityKg,
            status: vehicle.status,
          }
        : null,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  /**
   * The vehicle lookup must not be able to sink the profile screen. A driver
   * whose vehicle cannot be read still needs their name, branch and contact
   * details, so a failure here degrades to no vehicle rather than an error.
   */
  private async loadVehicle(tenantId: string, employeeId: string) {
    try {
      return await this.fleetFacade.getActiveVehicleForDriver(
        tenantId,
        employeeId,
      );
    } catch (error) {
      this.logger.warn(
        `Could not resolve the vehicle assigned to driver ${employeeId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
