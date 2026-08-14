import { ConflictException } from '@nestjs/common';
import { ParcelCondition, ParcelStatus } from '@prisma/client';
import { Parcel } from './parcel.entity';

const parcelAt = (
  status: ParcelStatus,
  condition: ParcelCondition = ParcelCondition.NORMAL,
) =>
  Parcel.restore({
    id: '01910b80-6e42-7000-8000-0000000000b1',
    version: 3,
    tenantId: '01910b80-6e42-7000-8000-000000000000',
    customerShipmentId: '01910b80-6e42-7000-8000-000000000001',
    trackingNumber: 'SHP-1-ABC',
    currentStatus: status,
    currentCondition: condition,
    currentOrgUnitId: null,
    destinationOrgUnitId: null,
    labelKey: null,
  });

describe('Parcel', () => {
  describe('lifecycle', () => {
    it('moves forward through the allowed chain', () => {
      const parcel = parcelAt(ParcelStatus.PROCESSING);

      parcel.transitionTo(ParcelStatus.READY_FOR_DISPATCH);
      parcel.transitionTo(ParcelStatus.IN_TRANSIT);
      parcel.transitionTo(ParcelStatus.ARRIVED_AT_UNIT);
      parcel.transitionTo(ParcelStatus.READY_FOR_COLLECTION);
      parcel.transitionTo(ParcelStatus.COLLECTED);

      expect(parcel.currentStatus).toBe(ParcelStatus.COLLECTED);
    });

    it('refuses to skip a step', () => {
      const parcel = parcelAt(ParcelStatus.PROCESSING);

      expect(() => parcel.transitionTo(ParcelStatus.COLLECTED)).toThrow(
        ConflictException,
      );
    });

    it('refuses to repeat the current state', () => {
      const parcel = parcelAt(ParcelStatus.IN_TRANSIT);

      expect(() => parcel.transitionTo(ParcelStatus.IN_TRANSIT)).toThrow(
        ConflictException,
      );
    });

    it('treats collected as terminal', () => {
      const parcel = parcelAt(ParcelStatus.COLLECTED);

      expect(() => parcel.transitionTo(ParcelStatus.IN_TRANSIT)).toThrow(
        ConflictException,
      );
    });

    it('refuses to cancel once in transit', () => {
      const parcel = parcelAt(ParcelStatus.IN_TRANSIT);

      expect(() => parcel.transitionTo(ParcelStatus.CANCELLED)).toThrow(
        ConflictException,
      );
    });
  });

  describe('condition', () => {
    it('is independent of the lifecycle', () => {
      const parcel = parcelAt(ParcelStatus.IN_TRANSIT);

      parcel.changeCondition(ParcelCondition.DAMAGED);

      expect(parcel.currentCondition).toBe(ParcelCondition.DAMAGED);
      expect(parcel.currentStatus).toBe(ParcelStatus.IN_TRANSIT);
    });

    it('can be set on a terminal parcel without reopening it', () => {
      const parcel = parcelAt(ParcelStatus.COLLECTED);

      parcel.changeCondition(ParcelCondition.OPENED);

      expect(parcel.currentStatus).toBe(ParcelStatus.COLLECTED);
    });
  });

  describe('assertCollectable', () => {
    it('accepts a parcel waiting at the destination', () => {
      const parcel = parcelAt(ParcelStatus.READY_FOR_COLLECTION);

      expect(() => parcel.assertCollectable()).not.toThrow();
    });

    it('accepts an already collected parcel so proof can be filed late', () => {
      const parcel = parcelAt(ParcelStatus.COLLECTED);

      expect(() => parcel.assertCollectable()).not.toThrow();
      expect(parcel.isCollected()).toBe(true);
    });

    it('refuses a parcel that is still travelling', () => {
      const parcel = parcelAt(ParcelStatus.IN_TRANSIT);

      expect(() => parcel.assertCollectable()).toThrow(ConflictException);
    });
  });

  it('carries the version used for optimistic locking', () => {
    expect(parcelAt(ParcelStatus.PROCESSING).version).toBe(3);
  });
});
