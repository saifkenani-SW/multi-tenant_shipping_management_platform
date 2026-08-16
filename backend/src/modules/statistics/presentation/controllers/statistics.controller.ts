import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../authorization/domain/enums/role.enum';
import { FinancialStatisticsService } from '../../application/services/financial-statistics.service';
import { OrganizationUnitStatisticsService } from '../../application/services/organization-unit-statistics.service';
import { DashboardQueryDto } from '../../application/dtos/requests/dashboard-query.dto';
import { OrganizationUnitStatsQueryDto } from '../../application/dtos/requests/organization-unit-stats-query.dto';
import { FinancialDashboardResponseDto } from '../../application/dtos/responses/financial-dashboard.response.dto';
import { OrganizationUnitStatisticsResponseDto } from '../../application/dtos/responses/organization-unit-statistics.response.dto';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly financialStatisticsService: FinancialStatisticsService,
    private readonly organizationUnitStatisticsService: OrganizationUnitStatisticsService,
  ) {}

  /**
   * One endpoint for every role. The response shape is always the same; the
   * `scope` field says which dashboard it is and what `breakdown` groups by,
   * so the frontend makes one call and decides the screen from the answer.
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @ApiOperation({
    summary:
      'Financial dashboard for the signed-in user. A platform owner sees every workspace, a tenant admin their own, an employee their branches, and a driver no figures.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FinancialDashboardResponseDto })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'A tenant admin asked for a workspace other than their own, or has no workspace attached',
  })
  async dashboard(
    @Query() query: DashboardQueryDto,
  ): Promise<FinancialDashboardResponseDto> {
    return this.financialStatisticsService.getFinancialDashboard(query);
  }

  /**
   * Organization-unit dashboard. Companies stay apart: a platform owner
   * sees every company (or one, if they pass tenantId), a tenant admin
   * their own, and an employee only the units they are assigned to.
   */
  @Get('organization-units')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Organization unit statistics. Grouped by company. A platform owner sees every company, a tenant admin their own, an employee their assigned units.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationUnitStatisticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'A tenant admin asked for a company other than their own, or the caller has no workspace attached',
  })
  async organizationUnits(
    @Query() query: OrganizationUnitStatsQueryDto,
  ): Promise<OrganizationUnitStatisticsResponseDto> {
    return this.organizationUnitStatisticsService.getOrganizationUnitStatistics(
      query,
    );
  }
}
