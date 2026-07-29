import { Inject, Injectable } from '@nestjs/common';

import { Transactional } from '../../../core/transaction';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Authorize } from '../../../packages/authorization';
import { Policy } from '../../../packages/authorization/policy';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import {
  OrganizationUnitAction,
  OrganizationUnitPolicy,
} from '../authorization';
import { ORGANIZATION_UNIT_CACHE_KEYS } from '../constants/organization-unit.cache.constants';
import { CreateOrganizationUnitDto } from '../dtos/requests/create-organization-unit.dto';
import { SetCoverageDto } from '../dtos/requests/set-coverage.dto';
import { UpdateOrganizationUnitDto } from '../dtos/requests/update-organization-unit.dto';
import { CrossTenantParentException } from '../exceptions/cross-tenant-parent.exception';
import { MissingTenantContextException } from '../exceptions/missing-tenant-context.exception';
import { OrganizationUnitHasChildrenException } from '../exceptions/organization-unit-has-children.exception';
import { OrganizationUnitInUseException } from '../exceptions/organization-unit-in-use.exception';
import { OrganizationUnitNotFoundException } from '../exceptions/organization-unit-not-found.exception';
import { UnknownCoverageLocationException } from '../exceptions/unknown-coverage-location.exception';
import type { IOrganizationUnitCommandRepository } from '../interfaces/organization-unit.command.repository.interface';
import { IOrganizationUnitCommandService } from '../interfaces/organization-unit.command.service.interface';
import type { IOrganizationUnitQueryRepository } from '../interfaces/organization-unit.query.repository.interface';
import {
  ORGANIZATION_UNIT_COMMAND_REPOSITORY_TOKEN,
  ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN,
} from '../tokens/organization-unit-repository.tokens';

@Injectable()
export class OrganizationUnitCommandService implements IOrganizationUnitCommandService {
  constructor(
    @Inject(ORGANIZATION_UNIT_COMMAND_REPOSITORY_TOKEN)
    private readonly commandRepository: IOrganizationUnitCommandRepository,
    @Inject(ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN)
    private readonly queryRepository: IOrganizationUnitQueryRepository,
    private readonly requestContext: RequestContextService,
    // مطلوب بهذا الاسم تحديداً لأن @Transactional() يبحث عن this.prisma
    private readonly prisma: PrismaService,
  ) {}

  @CacheEvict({
    keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @Authorize({
    policy: Policy(OrganizationUnitPolicy, OrganizationUnitAction.Create),
    payloadResolver: (dto: CreateOrganizationUnitDto) => ({ dto }),
  })
  @Transactional()
  async createUnit(dto: CreateOrganizationUnitDto): Promise<string> {
    const tenantId = this.resolveTenantId();

    await this.assertParentBelongsToTenant(dto.parentId, tenantId);

    // TODO: حدود خطة الاشتراك (max_branches / max_warehouses / max_zones)
    // مؤجلة باتفاق: تحتاج قراءة tenant_subscription واحتساب النوع.

    const id = await this.commandRepository.create({
      tenantId,
      name: dto.name,
      orgType: dto.orgType,
      parentId: dto.parentId ?? null,
      zoneId: dto.zoneId ?? null,
      addressLine: dto.addressLine ?? null,
      longitude: dto.longitude ?? null,
      latitude: dto.latitude ?? null,
    });

    if (dto.coverageLocationIds?.length) {
      await this.assertLocationsExist(dto.coverageLocationIds);
      await this.commandRepository.setCoverage(
        id,
        tenantId,
        dto.coverageLocationIds,
      );
    }

    return id;
  }

  @CacheEvict({
    keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [ORGANIZATION_UNIT_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(OrganizationUnitPolicy, OrganizationUnitAction.Update),
    payloadResolver: (unitId: string, dto: UpdateOrganizationUnitDto) => ({
      unitId,
      dto,
    }),
  })
  async updateUnit(
    id: string,
    dto: UpdateOrganizationUnitDto,
  ): Promise<void> {
    const unit = await this.queryRepository.findById(id);

    if (!unit) {
      throw new OrganizationUnitNotFoundException();
    }

    await this.commandRepository.update(id, {
      name: dto.name,
      zoneId: dto.zoneId,
      addressLine: dto.addressLine,
      isActive: dto.isActive,
      longitude: dto.longitude,
      latitude: dto.latitude,
    });
  }

  @CacheEvict({
    keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [ORGANIZATION_UNIT_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(OrganizationUnitPolicy, OrganizationUnitAction.Delete),
    payloadResolver: (unitId: string) => ({ unitId }),
  })
  async deleteUnit(id: string): Promise<void> {
    const unit = await this.queryRepository.findById(id);

    if (!unit) {
      throw new OrganizationUnitNotFoundException();
    }

    const childCount = await this.queryRepository.countChildren(id);

    if (childCount > 0) {
      throw new OrganizationUnitHasChildrenException(childCount);
    }

    // employee_assignment مرتبطة بـ cascade: الحذف يلغي تعيينات قائمة.
    const assignmentCount =
      await this.queryRepository.countActiveAssignments(id);

    if (assignmentCount > 0) {
      throw new OrganizationUnitInUseException(assignmentCount);
    }

    await this.commandRepository.delete(id);
  }

  @CacheEvict({
    keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [ORGANIZATION_UNIT_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(
      OrganizationUnitPolicy,
      OrganizationUnitAction.ManageCoverage,
    ),
    payloadResolver: (unitId: string, dto: SetCoverageDto) => ({ unitId, dto }),
  })
  @Transactional()
  async setCoverage(id: string, dto: SetCoverageDto): Promise<void> {
    const unit = await this.queryRepository.findById(id);

    if (!unit) {
      throw new OrganizationUnitNotFoundException();
    }

    await this.assertLocationsExist(dto.locationIds);

    // tenant_id يؤخذ من الوحدة نفسها لا من سياق الطلب: مدير المنصة قد
    // يعدّل تغطية وحدة لا ينتمي إلى شركتها.
    await this.commandRepository.setCoverage(
      id,
      unit.tenantId,
      dto.locationIds,
    );
  }

  /**
   * أب من شركة أخرى يربط شجرتين ويسرّب بيانات عبر أي استعلام هرمي.
   * المفتاح الأجنبي وحده لا يمنع ذلك لأنه لا يقارن tenant_id.
   */
  private async assertParentBelongsToTenant(
    parentId: string | undefined,
    tenantId: string,
  ): Promise<void> {
    if (!parentId) {
      return;
    }

    const parent = await this.queryRepository.findById(parentId);

    if (!parent) {
      throw new OrganizationUnitNotFoundException();
    }

    if (parent.tenantId !== tenantId) {
      throw new CrossTenantParentException();
    }
  }

  private async assertLocationsExist(
    locationIds: readonly string[],
  ): Promise<void> {
    const existing =
      await this.queryRepository.findExistingLocationIds(locationIds);

    const existingSet = new Set(existing);
    const missing = locationIds.filter((id) => !existingSet.has(id));

    if (missing.length > 0) {
      throw new UnknownCoverageLocationException(missing);
    }
  }

  private resolveTenantId(): string {
    const tenantId = this.requestContext.getPrincipal()?.tenantId;

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
