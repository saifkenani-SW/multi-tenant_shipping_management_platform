import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  Currency,
  InvoiceStatus,
  PaymentMethod,
  PaymentResponsibility,
  PaymentStatus,
  ShipmentStatus,
} from '@prisma/client';
import { InvoiceCommandRepository } from '../../infrastructure/repositories/invoice.command.repository';
import { PaymentCommandRepository } from '../../../payment/infrastructure/repositories/payment.command.repository';
import { InvoiceNumberGenerator } from './invoice-number.generator';
import { Invoice } from '../../domain/entities/invoice.entity';
import { InvoiceCommandService } from './invoice.command.service';
import { installTransactionTestContainer } from '../../../../../packages/transaction/testing/transaction-test-container';

/**
 * Importing TenantFacade here would pull the uuid package into jest through its
 * transitive imports, which the current jest setup cannot parse. The spec only
 * needs the one method it calls, so the shape is declared locally instead.
 */
type TenantFacadeLike = {
  getTenantSettings: (tenantId: string) => Promise<any>;
};

describe('InvoiceCommandService', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const shipmentId = '01910b80-6e42-7000-8000-000000000001';
  const invoiceId = '01910b80-6e42-7000-8000-000000000901';

  const invoiceAt = (
    status: InvoiceStatus,
    totalAmount = 5000,
    currency: Currency = Currency.SY,
  ) =>
    Invoice.restore({
      id: invoiceId,
      version: 2,
      tenantId,
      senderName: 'Sender',
      senderPhone: '+963900000000',
      receiverName: 'Receiver',
      receiverPhone: '+963911111111',
      customerShipmentId: shipmentId,
      originOrgUnitId: '01910b80-6e42-7000-8000-0000000000f1',
      destinationOrgUnitId: '01910b80-6e42-7000-8000-0000000000f2',
      invoiceNumber: 'DAM-INV-2026-00001',
      subtotal: totalAmount,
      handlingFees: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      paymentResponsibility: 'SENDER',
      currency,
      status,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const commandRepository = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    markOverdueBefore: jest.fn(),
    nextSequenceNumber: jest.fn(),
    existsForShipment: jest.fn(),
    findAggregateById: jest.fn(),
    findAggregateByShipmentId: jest.fn(),
    sumCompletedPayments: jest.fn(),
  };
  const paymentCommandRepository = {
    create: jest.fn(),
  };
  const numberGenerator = {
    next: jest.fn(),
  };
  const tenantFacade = {
    getTenantSettings: jest.fn(),
  };

  let service: InvoiceCommandService;

  beforeAll(() => {
    installTransactionTestContainer();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new InvoiceCommandService(
      commandRepository as unknown as InvoiceCommandRepository,
      paymentCommandRepository as unknown as PaymentCommandRepository,
      numberGenerator as unknown as InvoiceNumberGenerator,
      tenantFacade as unknown as TenantFacadeLike as never,
    );
  });

  const createCommand = {
    tenantId,
    customerShipmentId: shipmentId,
    senderName: 'Sender',
    senderPhone: '+963900000000',
    receiverName: 'Receiver',
    receiverPhone: '+963911111111',
    originOrgUnitId: '01910b80-6e42-7000-8000-0000000000f1',
    destinationOrgUnitId: '01910b80-6e42-7000-8000-0000000000f2',
    paymentResponsibility: PaymentResponsibility.SENDER,
    subtotal: 35,
    handlingFees: 5,
    taxAmount: 5.25,
    discountAmount: 0,
  };

  describe('createForShipment', () => {
    it('takes the currency and prefix from tenant settings, not from the caller', async () => {
      commandRepository.existsForShipment.mockResolvedValue(false);
      tenantFacade.getTenantSettings.mockResolvedValue({
        pricing: { defaultCurrency: Currency.SY },
        operational: { trackingPrefix: 'DAM' },
      });
      numberGenerator.next.mockResolvedValue('DAM-INV-2026-00001');
      commandRepository.create.mockResolvedValue({ id: invoiceId });

      const result = await service.createForShipment(createCommand);

      expect(numberGenerator.next).toHaveBeenCalledWith(tenantId, 'DAM');
      expect(result.invoiceNumber).toBe('DAM-INV-2026-00001');

      const [data] = commandRepository.create.mock.calls[0] as [
        { currency: Currency; totalAmount: number; status: InvoiceStatus },
      ];
      expect(data.currency).toBe(Currency.SY);
      expect(data.totalAmount).toBe(45.25);
      expect(data.status).toBe(InvoiceStatus.UNPAID);
    });

    it('maps legacy currency codes onto SY or USD', async () => {
      commandRepository.existsForShipment.mockResolvedValue(false);
      tenantFacade.getTenantSettings.mockResolvedValue({
        pricing: { defaultCurrency: 'SYP' },
        operational: { trackingPrefix: 'DAM' },
      });
      numberGenerator.next.mockResolvedValue('DAM-INV-2026-00001');
      commandRepository.create.mockResolvedValue({ id: invoiceId });

      await service.createForShipment(createCommand);

      const [data] = commandRepository.create.mock.calls[0] as [
        { currency: Currency },
      ];
      expect(data.currency).toBe(Currency.SY);
    });

    it('refuses a second invoice for the same shipment', async () => {
      commandRepository.existsForShipment.mockResolvedValue(true);

      await expect(
        service.createForShipment(createCommand),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('gives the invoice a due date', async () => {
      commandRepository.existsForShipment.mockResolvedValue(false);
      tenantFacade.getTenantSettings.mockResolvedValue({
        pricing: { defaultCurrency: Currency.SY },
        operational: { trackingPrefix: 'DAM' },
      });
      numberGenerator.next.mockResolvedValue('DAM-INV-2026-00001');
      commandRepository.create.mockResolvedValue({ id: invoiceId });

      await service.createForShipment(createCommand);

      const [data] = commandRepository.create.mock.calls[0] as [
        { dueDate: Date | null },
      ];
      expect(data.dueDate).toBeInstanceOf(Date);
      expect(data.dueDate!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('cancelForShipment', () => {
    it('cancels an unpaid invoice under its version', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(0);

      await service.cancelForShipment(shipmentId, ShipmentStatus.PENDING);

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.CANCELLED,
        2,
      );
    });

    it('stays quiet when the shipment has no invoice', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(null);

      await expect(
        service.cancelForShipment(shipmentId, ShipmentStatus.PENDING),
      ).resolves.toBeUndefined();
      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('refunds a paid invoice when the shipment is still pending', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(5000);
      paymentCommandRepository.create.mockResolvedValue({ id: 'refund-1' });

      await service.cancelForShipment(shipmentId, ShipmentStatus.PENDING);

      expect(paymentCommandRepository.create).toHaveBeenCalledTimes(1);
      expect(paymentCommandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId,
          amount: 5000,
          status: PaymentStatus.REFUNDED,
          transactionReference: 'REFUND:DAM-INV-2026-00001',
        }),
      );
      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.CANCELLED,
        2,
      );
    });

    it('refunds a partially paid invoice when the shipment is still pending', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.PARTIALLY_PAID),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(1000);
      paymentCommandRepository.create.mockResolvedValue({ id: 'refund-2' });

      await service.cancelForShipment(shipmentId, ShipmentStatus.PENDING);

      expect(paymentCommandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          status: PaymentStatus.REFUNDED,
        }),
      );
      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.CANCELLED,
        2,
      );
    });

    it('does not refund once the shipment has left pending', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(5000);

      await expect(
        service.cancelForShipment(shipmentId, ShipmentStatus.PROCESSING),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('does not refund a returned shipment', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );

      await expect(
        service.cancelForShipment(shipmentId, ShipmentStatus.RETURNED),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(commandRepository.sumCompletedPayments).not.toHaveBeenCalled();
      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('is idempotent on an already cancelled invoice', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.CANCELLED),
      );

      await service.cancelForShipment(shipmentId, ShipmentStatus.PENDING);

      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('recordPayment', () => {
    const paymentCommand = {
      invoiceId,
      amount: 1000,
      paymentMethod: PaymentMethod.CASH,
      collectedByEmployeeId: '01910b80-6e42-7000-8000-00000000000b',
      organizationUnitId: '01910b80-6e42-7000-8000-0000000000f2',
      transactionReference: null,
    };

    it('records the payment then settles the invoice', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 1000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(0);
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-1' });

      const result = await service.recordPayment(paymentCommand);

      expect(result.id).toBe('pay-1');
      expect(paymentCommandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.COMPLETED }),
      );
      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.PAID,
        2,
      );
    });

    it('adds the new payment to the total already collected', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.PARTIALLY_PAID, 5000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(4000);
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-2' });

      await service.recordPayment(paymentCommand);

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.PAID,
        2,
      );
    });

    it('marks a part payment as partially paid', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 5000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(0);
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-3' });

      await service.recordPayment(paymentCommand);

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.PARTIALLY_PAID,
        2,
      );
    });

    it('still bumps the version when the status did not change', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.PARTIALLY_PAID, 5000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(1000);
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-4' });

      await service.recordPayment(paymentCommand);

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.PARTIALLY_PAID,
        2,
      );
    });

    it('refuses an overpayment without writing', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 5000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(4500);

      await expect(
        service.recordPayment(paymentCommand),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
    });

    it('refuses a payment below the currency minimum', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 5000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(0);

      await expect(
        service.recordPayment({ ...paymentCommand, amount: 500 }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
    });

    it('refuses payment on a settled invoice without writing', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(5000);

      await expect(
        service.recordPayment(paymentCommand),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
    });

    it('refuses a zero or negative amount', async () => {
      commandRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(0);

      await expect(
        service.recordPayment({ ...paymentCommand, amount: 0 }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
    });

    it('raises not found for an unknown invoice', async () => {
      commandRepository.findAggregateById.mockResolvedValue(null);

      await expect(
        service.recordPayment(paymentCommand),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('records a payment looked up from the shipment rather than the invoice id', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 1000),
      );
      commandRepository.sumCompletedPayments.mockResolvedValue(0);
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-ship-1' });

      const result = await service.recordPaymentForShipment(shipmentId, {
        amount: paymentCommand.amount,
        paymentMethod: paymentCommand.paymentMethod,
        collectedByEmployeeId: paymentCommand.collectedByEmployeeId,
        organizationUnitId: paymentCommand.organizationUnitId,
        transactionReference: paymentCommand.transactionReference,
      });

      expect(result.id).toBe('pay-ship-1');
      expect(paymentCommandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId,
          status: PaymentStatus.COMPLETED,
        }),
      );
    });
  });

  describe('assertSettledForDelivery', () => {
    it('allows delivery when the invoice is paid', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );

      await expect(
        service.assertSettledForDelivery(shipmentId),
      ).resolves.toBeUndefined();
    });

    it('refuses delivery while the invoice is unpaid', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID),
      );

      await expect(
        service.assertSettledForDelivery(shipmentId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses delivery when the shipment has no invoice', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(null);

      await expect(
        service.assertSettledForDelivery(shipmentId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses delivery after the invoice was cancelled and refunded', async () => {
      commandRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.CANCELLED),
      );

      await expect(
        service.assertSettledForDelivery(shipmentId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('markOverdueInvoices', () => {
    it('delegates the sweep to the repository', async () => {
      commandRepository.markOverdueBefore.mockResolvedValue(3);

      await expect(service.markOverdueInvoices()).resolves.toBe(3);
      expect(commandRepository.markOverdueBefore).toHaveBeenCalled();
    });
  });
});
