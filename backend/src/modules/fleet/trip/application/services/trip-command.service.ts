import { Injectable } from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { NotificationType } from '../../../../../packages/firebase-notifications';
import { EmployeeFacade } from '../../../../employee2/facades/employee.facade';
import { NotificationFacade } from '../../../../notification/facades/notification.facade';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { TripCommandRepository } from '../../infrastructure/repositories/trip-command.repository';
import { TripQueryService } from './trip-query.service';
import { ManifestCommandService } from '../../../transport_manifest/application/services/manifest-command.service';
import { VehicleQueryService } from '../../../vehicle/application/services/vehicle-query.service';
import { VehicleNotOperableException } from '../../../vehicle/domain/exceptions/vehicle-not-operable.exception';
import { Trip } from '../../domain/entities/trip.entity';
import { DriverNotFoundException } from '../../../vehicle/domain/exceptions/driver-not-found.exception';
import { DriverHasNoVehicleException } from '../../domain/exceptions/driver-has-no-vehicle.exception';
import { InvalidTripOrgUnitsException } from '../../domain/exceptions/invalid-trip-org-units.exception';
import { CreateTripDto } from '../dtos/requests/create-trip.dto';
import { UpdateTripDto } from '../dtos/requests/update-trip.dto';

@Injectable()
export class TripCommandService {
  constructor(
    private readonly tripCommandRepository: TripCommandRepository,
    private readonly tripQueryService: TripQueryService,
    private readonly manifestCommandService: ManifestCommandService,
    private readonly vehicleQueryService: VehicleQueryService,
    private readonly employeeFacade: EmployeeFacade,
    private readonly organizationFacade: OrganizationFacade,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  /**
   * Creates a SCHEDULED trip and tells the driver about it.
   *
   * The push is deliberately outside the transaction: notifying a driver about
   * a trip that then failed to commit is worse than a missed notification, and
   * a driver who never opens the app has no other way to learn a trip was
   * assigned to them.
   */
  async createTrip(
    tenantId: string,
    creatorId: string | undefined,
    dto: CreateTripDto,
  ): Promise<string> {
    let creatorName: string | null = null;
    if (creatorId) {
      creatorName = await this.employeeFacade.getEmployeeName(creatorId);
    }

    const id = await this.persistNewTrip(tenantId, creatorId, creatorName, dto);

    await this.notifyDriverOfAssignment(tenantId, dto.driverId, id);

    return id;
  }

  /**
   * External references are verified through facades only: the driver through
   * EmployeeFacade and both organization units through OrganizationFacade.
   * The vehicle lives inside Fleet, so it is read through the sibling
   * vehicle query service.
   */
  @Transactional()
  private async persistNewTrip(
    tenantId: string,
    creatorId: string | undefined,
    creatorName: string | null,
    dto: CreateTripDto,
  ): Promise<string> {
    Trip.assertRouteIsValid(dto.originOrgUnitId, dto.destinationOrgUnitId);

    const assignedVehicleId = await this.assertDriverExists(
      tenantId,
      dto.driverId,
    );
    await this.assertOrgUnitsExist(tenantId, [
      dto.originOrgUnitId,
      dto.destinationOrgUnitId,
    ]);

    await this.assertVehicleIsOperable(tenantId, assignedVehicleId);

    const trip = Trip.create({
      tenantId,
      driverId: dto.driverId,
      vehicleId: assignedVehicleId,
      originOrgUnitId: dto.originOrgUnitId,
      destinationOrgUnitId: dto.destinationOrgUnitId,
      scheduledAt: dto.scheduledAt ?? null,
      notes: dto.notes ?? null,
      createdByEmployeeId: creatorId ?? null,
      createdByEmployeeName: creatorName ?? null,
    });

    const created = await this.tripCommandRepository.create(trip);

    // Optionally link pre-existing READY_FOR_DISPATCH manifests to this trip
    if (dto.manifestIds?.length) {
      await this.manifestCommandService.assignManifestsToTrip(
        tenantId,
        created.id,
        dto.manifestIds,
      );
    }

    return created.id;
  }

  /**
   * Updates a trip that has not departed yet, and notifies the new driver if
   * the trip changed hands. The previous driver is not told: dispatchers
   * reassign freely while a trip is still SCHEDULED, and a "no longer yours"
   * push for a trip the driver never saw is noise.
   */
  async updateTrip(
    tenantId: string,
    id: string,
    dto: UpdateTripDto,
  ): Promise<void> {
    const reassignedTo = await this.persistTripUpdate(tenantId, id, dto);

    if (reassignedTo) {
      await this.notifyDriverOfAssignment(tenantId, reassignedTo, id);
    }
  }

  /** Returns the new driver id when the trip was reassigned, otherwise null. */
  @Transactional()
  private async persistTripUpdate(
    tenantId: string,
    id: string,
    dto: UpdateTripDto,
  ): Promise<string | null> {
    const trip = await this.tripQueryService.findTripOrThrow(tenantId, id);

    trip.assertEditable();

    const originOrgUnitId = dto.originOrgUnitId ?? trip.originOrgUnitId;
    const destinationOrgUnitId =
      dto.destinationOrgUnitId ?? trip.destinationOrgUnitId;

    Trip.assertRouteIsValid(originOrgUnitId, destinationOrgUnitId);

    const reassignedTo =
      dto.driverId && dto.driverId !== trip.driverId ? dto.driverId : null;

    let newVehicleId = trip.vehicleId;

    if (reassignedTo) {
      newVehicleId = await this.assertDriverExists(tenantId, reassignedTo);
      await this.assertVehicleIsOperable(tenantId, newVehicleId);
    }

    const changedOrgUnits: string[] = [];
    if (dto.originOrgUnitId && dto.originOrgUnitId !== trip.originOrgUnitId) {
      changedOrgUnits.push(dto.originOrgUnitId);
    }
    if (
      dto.destinationOrgUnitId &&
      dto.destinationOrgUnitId !== trip.destinationOrgUnitId
    ) {
      changedOrgUnits.push(dto.destinationOrgUnitId);
    }
    if (changedOrgUnits.length > 0) {
      await this.assertOrgUnitsExist(tenantId, changedOrgUnits);
    }

    await this.tripCommandRepository.update(id, {
      driverId: dto.driverId,
      vehicleId: reassignedTo ? (newVehicleId ?? undefined) : undefined,
      originOrgUnitId: dto.originOrgUnitId,
      destinationOrgUnitId: dto.destinationOrgUnitId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
    });

    return reassignedTo;
  }

  /**
   * SCHEDULED -> IN_PROGRESS.
   *
   * The manifest count is fetched here and handed to the aggregate, which
   * enforces the "a trip cannot depart empty" invariant.
   *
   * Departure also carries every attached manifest to IN_TRANSIT, in the same
   * transaction, so a departed trip can never leave a manifest still open for
   * loading.
   */
  @Transactional()
  async startTrip(tenantId: string, id: string): Promise<void> {
    const trip = await this.tripQueryService.findTripOrThrow(tenantId, id);
    const manifestCount = await this.tripQueryService.countManifests(
      tenantId,
      id,
    );

    trip.start(manifestCount);

    await this.tripCommandRepository.updateStatus(id, trip.status, {
      startedAt: trip.startedAt,
    });

    await this.manifestCommandService.markTripManifestsInTransit(tenantId, id);
  }

  /** IN_PROGRESS → COMPLETED. Also completes all IN_TRANSIT manifests. */
  @Transactional()
  async completeTrip(tenantId: string, id: string): Promise<void> {
    const trip = await this.tripQueryService.findTripOrThrow(tenantId, id);

    trip.complete();

    await this.tripCommandRepository.updateStatus(id, trip.status, {
      endedAt: trip.endedAt,
    });

    await this.manifestCommandService.markTripManifestsCompleted(tenantId, id);
  }

  /** SCHEDULED → CANCELLED. */
  @Transactional()
  async cancelTrip(tenantId: string, id: string): Promise<void> {
    const trip = await this.tripQueryService.findTripOrThrow(tenantId, id);

    trip.cancel();

    await this.tripCommandRepository.updateStatus(id, trip.status, {
      endedAt: trip.endedAt,
    });
  }

  /**
   * Links one or more READY_FOR_DISPATCH manifests to an existing SCHEDULED trip.
   * Delegates all validation to ManifestCommandService.
   */
  @Transactional()
  async assignManifestsToTrip(
    tenantId: string,
    tripId: string,
    manifestIds: string[],
  ): Promise<void> {
    const trip = await this.tripQueryService.findTripOrThrow(tenantId, tripId);
    trip.assertEditable(); // trip must still be SCHEDULED

    await this.manifestCommandService.assignManifestsToTrip(
      tenantId,
      tripId,
      manifestIds,
    );
  }

  /**
   * Tells a driver a trip is now theirs.
   *
   * Tokens are registered against user accounts, so the employee id the trip
   * carries has to be resolved through EmployeeFacade first. Both facades
   * absorb their own failures, so nothing here can break trip creation.
   */
  private async notifyDriverOfAssignment(
    tenantId: string,
    driverId: string,
    tripId: string,
  ): Promise<void> {
    const userId = await this.employeeFacade.getUserId(driverId, tenantId);
    if (!userId) return;

    await this.notificationFacade.notifyUser(userId, {
      title: 'رحلة جديدة',
      body: 'تم إسناد رحلة جديدة إليك. افتح التطبيق لمراجعة تفاصيلها.',
      data: {
        type: NotificationType.TRIP_ASSIGNED,
        tripId,
      },
    });
  }

  private async assertDriverExists(
    tenantId: string,
    driverId: string,
  ): Promise<string> {
    const exists = await this.employeeFacade.validateEmployeeExists(
      driverId,
      tenantId,
    );

    if (!exists) {
      throw new DriverNotFoundException();
    }

    const vehicleId =
      await this.vehicleQueryService.getActiveVehicleIdForDriver(
        tenantId,
        driverId,
      );
    if (!vehicleId) {
      throw new Error('DriverHasNoVehicleException'); // Replaced below in the import
    }

    return vehicleId;
  }

  private async assertOrgUnitsExist(
    tenantId: string,
    orgUnitIds: string[],
  ): Promise<void> {
    const allExist =
      await this.organizationFacade.validateOrganizationUnitsExist(
        tenantId,
        orgUnitIds,
      );

    if (!allExist) {
      throw new InvalidTripOrgUnitsException();
    }
  }

  private async assertVehicleIsOperable(
    tenantId: string,
    vehicleId: string,
  ): Promise<void> {
    const vehicle = await this.vehicleQueryService.findVehicleOrThrow(
      tenantId,
      vehicleId,
    );

    if (!vehicle.isOperable()) {
      throw new VehicleNotOperableException();
    }
  }
}
