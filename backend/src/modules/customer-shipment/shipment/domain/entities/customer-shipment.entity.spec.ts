import { ConflictException } from '@nestjs/common';
import { ParcelStatus, ShipmentStatus } from '@prisma/client';
import { CustomerShipment } from './customer-shipment.entity';

const shipmentAt = (status: ShipmentStatus) =>
  CustomerShipment.restore({
    id: '01910b80-6e42-7000-8000-000000000001',
    version: 1,
    tenantId: '01910b80-6e42-7000-8000-000000000000',
    senderNationalId: null,
    shipmentRequestId: null,
    originOrgUnitId: '01910b80-6e42-7000-8000-0000000000f1',
    destinationOrgUnitId: '01910b80-6e42-7000-8000-0000000000f2',
    serviceLevel: 'STANDARD',
    receiverName: 'Receiver',
    receiverPhone: '+962790000000',
    paymentResponsibility: 'SENDER',
    totalChargeableWeightKg: 10,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByEmployeeId: '01910b80-6e42-7000-8000-0000000000e1',
    createdByEmployeeName: 'John Doe',
  });

describe('CustomerShipment', () => {
  describe('lifecycle', () => {
    it('moves forward through the allowed chain', () => {
      const shipment = shipmentAt(ShipmentStatus.PENDING);

      shipment.transitionTo(ShipmentStatus.PROCESSING);
      expect(shipment.status).toBe(ShipmentStatus.PROCESSING);

      shipment.transitionTo(ShipmentStatus.READY_FOR_DISPATCH);
      shipment.transitionTo(ShipmentStatus.IN_TRANSIT);
      shipment.transitionTo(ShipmentStatus.READY_FOR_COLLECTION);
      shipment.transitionTo(ShipmentStatus.DELIVERED);

      expect(shipment.status).toBe(ShipmentStatus.DELIVERED);
    });

    it('refuses to skip a step', () => {
      const shipment = shipmentAt(ShipmentStatus.PENDING);

      expect(() => shipment.transitionTo(ShipmentStatus.DELIVERED)).toThrow(
        ConflictException,
      );
    });

    it('cancels before dispatch', () => {
      const shipment = shipmentAt(ShipmentStatus.PROCESSING);

      shipment.cancel();

      expect(shipment.status).toBe(ShipmentStatus.CANCELLED);
    });

    it('refuses to cancel once in transit', () => {
      const shipment = shipmentAt(ShipmentStatus.IN_TRANSIT);

      expect(() => shipment.cancel()).toThrow(ConflictException);
    });

    it('treats delivered as terminal', () => {
      const shipment = shipmentAt(ShipmentStatus.DELIVERED);

      expect(() => shipment.transitionTo(ShipmentStatus.IN_TRANSIT)).toThrow(
        ConflictException,
      );
    });
  });

  describe('recalculateStatus', () => {
    it('becomes DELIVERED once every parcel is collected', () => {
      const shipment = shipmentAt(ShipmentStatus.READY_FOR_COLLECTION);

      const result = shipment.recalculateStatus([
        ParcelStatus.COLLECTED,
        ParcelStatus.COLLECTED,
      ]);

      expect(result).toBe(ShipmentStatus.DELIVERED);
      expect(shipment.status).toBe(ShipmentStatus.DELIVERED);
    });

    it('becomes READY_FOR_COLLECTION once every parcel reached the destination', () => {
      const shipment = shipmentAt(ShipmentStatus.IN_TRANSIT);

      const result = shipment.recalculateStatus([
        ParcelStatus.READY_FOR_COLLECTION,
        ParcelStatus.READY_FOR_COLLECTION,
      ]);

      expect(result).toBe(ShipmentStatus.READY_FOR_COLLECTION);
    });

    it('becomes IN_TRANSIT as soon as any parcel is moving', () => {
      const shipment = shipmentAt(ShipmentStatus.READY_FOR_DISPATCH);

      const result = shipment.recalculateStatus([
        ParcelStatus.IN_TRANSIT,
        ParcelStatus.READY_FOR_DISPATCH,
      ]);

      expect(result).toBe(ShipmentStatus.IN_TRANSIT);
    });

    it('stays put when the parcels do not agree on a new state', () => {
      const shipment = shipmentAt(ShipmentStatus.IN_TRANSIT);

      const result = shipment.recalculateStatus([
        ParcelStatus.READY_FOR_COLLECTION,
        ParcelStatus.COLLECTED,
      ]);

      expect(result).toBeNull();
      expect(shipment.status).toBe(ShipmentStatus.IN_TRANSIT);
    });

    it('ignores cancelled and returned parcels', () => {
      const shipment = shipmentAt(ShipmentStatus.READY_FOR_COLLECTION);

      const result = shipment.recalculateStatus([
        ParcelStatus.COLLECTED,
        ParcelStatus.CANCELLED,
        ParcelStatus.RETURNED,
      ]);

      expect(result).toBe(ShipmentStatus.DELIVERED);
    });

    it('does nothing when every parcel is cancelled', () => {
      const shipment = shipmentAt(ShipmentStatus.PROCESSING);

      const result = shipment.recalculateStatus([
        ParcelStatus.CANCELLED,
        ParcelStatus.CANCELLED,
      ]);

      expect(result).toBeNull();
      expect(shipment.status).toBe(ShipmentStatus.PROCESSING);
    });

    it('never drags a shipment backwards from an out-of-order parcel scan', () => {
      const shipment = shipmentAt(ShipmentStatus.DELIVERED);

      const result = shipment.recalculateStatus([ParcelStatus.IN_TRANSIT]);

      expect(result).toBeNull();
      expect(shipment.status).toBe(ShipmentStatus.DELIVERED);
    });
  });
});
