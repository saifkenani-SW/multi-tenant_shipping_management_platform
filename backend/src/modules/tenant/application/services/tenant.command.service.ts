import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TenantCommandRepository } from '../../infrastructure/repositories/tenant.command.repository';
import { TenantSettingsCommandRepository } from '../../infrastructure/repositories/tenant-settings.command.repository';
import { UserFacade } from '../../../user/application/facades/user.facade';
import { TenantDeliverySettings } from '../../domain/entities/tenant-delivery-settings.entity';
import { TenantOperationalSettings } from '../../domain/entities/tenant-operational-settings.entity';
import { TenantPricingSettings } from '../../domain/entities/tenant-pricing-settings.entity';

import { CreateTenantDto } from '../dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/requests/update-tenant.dto';
import { UpdateTenantDeliverySettingsDto } from '../dtos/requests/update-tenant-delivery-settings.dto';
import { UpdateTenantOperationalSettingsDto } from '../dtos/requests/update-tenant-operational-settings.dto';
import { UpdateTenantPricingSettingsDto } from '../dtos/requests/update-tenant-pricing-settings.dto';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { CacheEvict } from '../../../../infrastructure/cache/decorators/CacheEvict';
import { TENANT_CACHE_KEYS } from '../../constants/tenant.cache.constants';
import { TenantAction, TenantPolicy } from '../../domain/authorization';
import { Authorize } from '../../../../packages/authorization';

import { Policy } from '../../../../packages/authorization/policy';
import { TenantNotFoundException } from '../../domain/exceptions/tenant-not-found.exception';
import { STORAGE_PROVIDER } from '../../../../packages/storage/src';
import type { IStorageProvider } from '../../../../packages/storage/src';
import { AssignSubscriptionDto } from '../dtos/requests/assign-subscription.dto';
import {
  CancelSubscriptionDto,
  ReasonDto,
  SuspendSubscriptionDto,
} from '../dtos/requests/subscription-action.dto';
import { SUBSCRIPTION_PLAN_QUERY_SERVICE } from '../../../subscription-plan/tokens/subscription-plan-service.tokens';
import type { ISubscriptionPlanQueryService } from '../../../subscription-plan/interfaces/subscription-plan.query.service.interface';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { generateUuid } from '../../../../common/uuid';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';
import { Transactional } from '../../../../packages/transaction';

@Injectable()
export class TenantCommandService {
  constructor(
    private readonly tenantRepository: TenantCommandRepository,
    private readonly settingsCommandRepository: TenantSettingsCommandRepository,
    private readonly userFacade: UserFacade,
    @Inject(SUBSCRIPTION_PLAN_QUERY_SERVICE)
    private readonly planQueryService: ISubscriptionPlanQueryService,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  private async validateOwnerUserExistsAndActive(
    userId: string,
  ): Promise<void> {
    const isUserValid = await this.userFacade.existsAndActive(userId);
    if (!isUserValid) {
      throw new BadRequestException('Owner user must exist and be active');
    }
  }

  @Transactional()
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Create),
    payloadResolver: (dto: CreateTenantDto) => ({
      dto,
    }),
  })
  async createTenant(dto: CreateTenantDto): Promise<string> {
    const hasUserId = !!dto.ownerUserId;
    const hasUserDetails = !!(dto.ownerEmail && dto.ownerPassword);

    if (hasUserId && hasUserDetails) {
      throw new BadRequestException(
        'يرجى توفير إما معرف المستخدم أو بيانات المستخدم الجديد، وليس كلاهما',
      );
    }

    if (!hasUserId && !hasUserDetails) {
      throw new BadRequestException(
        'يجب توفير معرف المستخدم أو بيانات المستخدم الجديد',
      );
    }

    let finalUserId = dto.ownerUserId;

    if (hasUserDetails) {
      finalUserId = await this.userFacade.createUser({
        email: dto.ownerEmail!,
        password: dto.ownerPassword!,
        phone: dto.ownerPhone,
      });
    }

    // 1. Guardrail Check: Validate owner user via UserFacade
    await this.validateOwnerUserExistsAndActive(finalUserId!);

    // 2. Create Core Tenant Entity
    const tenant = await this.tenantRepository.create({
      name: dto.name,
      taxNumber: dto.taxNumber,
      email: dto.email,
      phone: dto.phone,
      logoUrl: null,
    });

    // 3. Seed Default Configurations
    await this.settingsCommandRepository.upsertDeliverySettings(
      new TenantDeliverySettings(tenant.id),
    );

    await this.settingsCommandRepository.upsertOperationalSettings(
      new TenantOperationalSettings(tenant.id),
    );

    await this.settingsCommandRepository.upsertPricingSettings(
      new TenantPricingSettings(tenant.id),
    );

    // 4. Assign Primary Owner
    await this.settingsCommandRepository.assignOwner(
      tenant.id,
      finalUserId!,
      true,
    );

    return tenant.id;
  }

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Update),
    payloadResolver: (tenantId: string, dto: UpdateTenantDto) => ({
      tenantId,
      dto,
    }),
  })
  async updateTenant(id: string, dto: UpdateTenantDto): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    await this.tenantRepository.update(id, {
      name: dto.name,
      taxNumber: dto.taxNumber,
      email: dto.email,
    });
  }

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Suspend),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async suspendTenant(id: string, reason?: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
    }
    await this.tenantRepository.updateStatus(
      id,
      TenantStatus.SUSPENDED,
      reason,
    );
  }

  @CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Activate),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async activateTenant(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new TenantNotFoundException();
    }
    await this.tenantRepository.updateStatus(id, TenantStatus.ACTIVE);
  }

  @Transactional()
  @CacheEvict({ keyPrefix: 'tenant:subscription', allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.ManageSubscription),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  async assignSubscription(
    tenantId: string,
    dto: AssignSubscriptionDto,
    performedBy: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();

    const plan = await this.planQueryService.getPlanDetails(dto.planId);
    if (!plan) throw new Error('Subscription plan not found');

    await this.tenantRepository.deactivateActiveSubscription(tenantId);

    const subscriptionId = generateUuid();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.tenantRepository.createSubscription({
      id: subscriptionId,
      tenantId: tenantId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      expiresAt: expiresAt,
      snapshotMaxBranches: plan.max_branches,
      snapshotMaxWarehouses: plan.max_warehouses,
      snapshotMaxEmployees: plan.max_employees,
      snapshotMaxVehicles: plan.max_vehicles,
      snapshotMaxZones: plan.max_zones,
      snapshotMaxMonthlyShipments: plan.max_monthly_shipments ?? null,
      snapshotMaxMonthlyParcels: plan.max_monthly_parcels ?? null,
      snapshotFeatures: {},
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      cancellationReason: null,
    });

    const history = new TenantSubscriptionHistory(
      generateUuid(),
      tenantId,
      subscriptionId,
      plan.id,
      'ASSIGN',
      now,
      null,
      'Initial subscription assignment',
      performedBy,
    );
    await this.tenantRepository.createSubscriptionHistory(history);
  }

  @CacheEvict({ keyPrefix: 'tenant:subscription', allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.ManageSubscription),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  async suspendSubscription(
    tenantId: string,
    dto: SuspendSubscriptionDto,
    performedBy: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();

    const currentSub =
      await this.tenantRepository.findActiveSubscription(tenantId);
    if (!currentSub) throw new Error('No active subscription found');

    await this.tenantRepository.updateSubscriptionStatus(
      currentSub.id,
      SubscriptionStatus.SUSPENDED,
      dto.reason,
    );

    const now = new Date();
    const history = new TenantSubscriptionHistory(
      generateUuid(),
      tenantId,
      currentSub.id,
      currentSub.planId,
      'SUSPEND',
      now,
      currentSub.planId,
      dto.reason ?? null,
      performedBy,
    );
    await this.tenantRepository.createSubscriptionHistory(history);
  }

  @CacheEvict({ keyPrefix: 'tenant:subscription', allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.ManageSubscription),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  async resumeSubscription(
    tenantId: string,
    dto: ReasonDto,
    performedBy: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();

    const sub = await this.tenantRepository.findLatestSubscription(tenantId);
    if (!sub || sub.status !== SubscriptionStatus.SUSPENDED)
      throw new Error('No suspended subscription found');

    await this.tenantRepository.updateSubscriptionStatus(
      sub.id,
      SubscriptionStatus.ACTIVE,
      dto.reason,
    );

    const now = new Date();
    const history = new TenantSubscriptionHistory(
      generateUuid(),
      tenantId,
      sub.id,
      sub.planId,
      'RESUME',
      now,
      sub.planId,
      dto.reason ?? null,
      performedBy,
    );
    await this.tenantRepository.createSubscriptionHistory(history);
  }

  @CacheEvict({ keyPrefix: 'tenant:subscription', allEntries: true })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.ManageSubscription),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  async cancelSubscription(
    tenantId: string,
    dto: CancelSubscriptionDto,
    performedBy: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();

    const sub = await this.tenantRepository.findActiveSubscription(tenantId);
    if (!sub) throw new Error('No active subscription found');

    await this.tenantRepository.updateSubscriptionStatus(
      sub.id,
      SubscriptionStatus.CANCELLED,
      dto.reason,
    );

    const now = new Date();
    const history = new TenantSubscriptionHistory(
      generateUuid(),
      tenantId,
      sub.id,
      sub.planId,
      'CANCEL',
      now,
      sub.planId,
      dto.reason ?? null,
      performedBy,
    );
    await this.tenantRepository.createSubscriptionHistory(history);
  }

  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Update),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.SETTINGS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.SETTINGS, id],
  })
  async updateDeliverySettings(
    tenantId: string,
    dto: UpdateTenantDeliverySettingsDto,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();
    await this.settingsCommandRepository.updateDeliverySettings(tenantId, dto);
  }

  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Update),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.SETTINGS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.SETTINGS, id],
  })
  async updateOperationalSettings(
    tenantId: string,
    dto: UpdateTenantOperationalSettingsDto,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();
    await this.settingsCommandRepository.updateOperationalSettings(
      tenantId,
      dto,
    );
  }

  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.Update),
    payloadResolver: (tenantId: string) => ({ tenantId }),
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.SETTINGS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.SETTINGS, id],
  })
  async updatePricingSettings(
    tenantId: string,
    dto: UpdateTenantPricingSettingsDto,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();
    await this.settingsCommandRepository.updatePricingSettings(tenantId, dto);
  }

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
  async uploadLogo(tenantId: string, file: any): Promise<{ url: string }> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new TenantNotFoundException();

    // Map Express.Multer.File to StorageFile interface
    const storageFile = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
      path: file.path,
    };

    // Slugify tenant name to use as folder name
    const companyNameFolder = tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { storage_key } = await this.storage.save(storageFile, companyNameFolder, 'logos');
    
    await this.tenantRepository.updateLogoUrl(tenantId, storage_key);
    
    return { url: storage_key };
  }
}
