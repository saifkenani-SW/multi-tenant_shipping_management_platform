import { Inject, Injectable } from '@nestjs/common';
import type { ITenantCommandRepository } from '../interfaces/tenant.command.repository.interface';
import { ITenantCommandService } from '../interfaces/tenant.command.service.interface';
import { CreateTenantDto } from '../dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/requests/update-tenant.dto';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { CacheEvict } from '../../../../infrastructure/cache/decorators/CacheEvict';
import { TENANT_CACHE_KEYS } from '../../constants/tenant.cache.constants';
import { TenantAction, TenantPolicy } from '../../domain/authorization';
import { Authorize } from '../../../../packages/authorization';
import { TENANT_COMMAND_REPOSITORY_TOKEN } from '../../tokens/tenant-repository.tokens';
import { Policy } from '../../../../packages/authorization/policy';
import { TenantNotFoundException } from '../../domain/exceptions/tenant-not-found.exception';
import { AssignSubscriptionDto } from '../dtos/requests/assign-subscription.dto';
import { RenewSubscriptionDto } from '../dtos/requests/renew-subscription.dto';
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
export class TenantCommandService implements ITenantCommandService {
  constructor(
    @Inject(TENANT_COMMAND_REPOSITORY_TOKEN)
    private readonly tenantRepository: ITenantCommandRepository,
    @Inject(SUBSCRIPTION_PLAN_QUERY_SERVICE)
    private readonly planQueryService: ISubscriptionPlanQueryService,
  ) {}

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
    const tenant = await this.tenantRepository.create({
      name: dto.name,
      taxNumber: dto.taxNumber,
      email: dto.email,
      phone: dto.phone,
      logoUrl: null,
    });

    return tenant.id;
  }

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
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

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
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

  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: TENANT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
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
}
