import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentMethod,
  PaymentResponsibility,
  PaymentStatus,
} from '@prisma/client';
import { InvoiceCommandRepository } from '../../infrastructure/repositories/invoice.command.repository';
import { InvoiceQueryRepository } from '../../infrastructure/repositories/invoice.query.repository';
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

  const invoiceAt = (status: InvoiceStatus, totalAmount = 100) =>
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
      currency: 'SYP',
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
  };
  const queryRepository = {
    findRawByShipmentId: jest.fn(),
    findAggregateByShipmentId: jest.fn(),
    findAggregateById: jest.fn(),
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
      queryRepository as unknown as InvoiceQueryRepository,
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
      queryRepository.findRawByShipmentId.mockResolvedValue(null);
      tenantFacade.getTenantSettings.mockResolvedValue({
        pricing: { defaultCurrency: 'SYP' },
        operational: { trackingPrefix: 'DAM' },
      });
      numberGenerator.next.mockResolvedValue('DAM-INV-2026-00001');
      commandRepository.create.mockResolvedValue({ id: invoiceId });

      const result = await service.createForShipment(createCommand);

      expect(numberGenerator.next).toHaveBeenCalledWith(tenantId, 'DAM');
      expect(result.invoiceNumber).toBe('DAM-INV-2026-00001');

      const [data] = commandRepository.create.mock.calls[0] as [
        { currency: string; totalAmount: number; status: InvoiceStatus },
      ];
      expect(data.currency).toBe('SYP');
      expect(data.totalAmount).toBe(45.25);
      expect(data.status).toBe(InvoiceStatus.UNPAID);
    });

    it('refuses a second invoice for the same shipment', async () => {
      queryRepository.findRawByShipmentId.mockResolvedValue({ id: invoiceId });

      await expect(
        service.createForShipment(createCommand),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('gives the invoice a due date', async () => {
      queryRepository.findRawByShipmentId.mockResolvedValue(null);
      tenantFacade.getTenantSettings.mockResolvedValue({
        pricing: { defaultCurrency: 'SYP' },
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
      queryRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID),
      );

      await service.cancelForShipment(shipmentId);

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.CANCELLED,
        2,
      );
    });

    it('stays quiet when the shipment has no invoice', async () => {
      queryRepository.findAggregateByShipmentId.mockResolvedValue(null);

      await expect(
        service.cancelForShipment(shipmentId),
      ).resolves.toBeUndefined();
      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('refuses to cancel money already taken', async () => {
      queryRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );

      await expect(
        service.cancelForShipment(shipmentId),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('is idempotent on an already cancelled invoice', async () => {
      queryRepository.findAggregateByShipmentId.mockResolvedValue(
        invoiceAt(InvoiceStatus.CANCELLED),
      );

      await service.cancelForShipment(shipmentId);

      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('recordPayment', () => {
    const paymentCommand = {
      invoiceId,
      amount: 100,
      paymentMethod: PaymentMethod.CASH,
      collectedByEmployeeId: '01910b80-6e42-7000-8000-00000000000b',
      organizationUnitId: '01910b80-6e42-7000-8000-0000000000f2',
      transactionReference: null,
    };

    it('records the payment then settles the invoice', async () => {
      queryRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 100),
      );
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-1' });
      queryRepository.sumCompletedPayments.mockResolvedValue(100);

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

    it('reads the collected total back rather than trusting the one payment', async () => {
      queryRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 100),
      );
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-2' });
      // Another payment landed in the meantime; together they settle it.
      queryRepository.sumCompletedPayments.mockResolvedValue(100);

      await service.recordPayment({ ...paymentCommand, amount: 40 });

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.PAID,
        2,
      );
    });

    it('marks a part payment as partially paid', async () => {
      queryRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID, 100),
      );
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-3' });
      queryRepository.sumCompletedPayments.mockResolvedValue(40);

      await service.recordPayment({ ...paymentCommand, amount: 40 });

      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        invoiceId,
        InvoiceStatus.PARTIALLY_PAID,
        2,
      );
    });

    it('leaves the status alone when it did not change', async () => {
      queryRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.PARTIALLY_PAID, 100),
      );
      paymentCommandRepository.create.mockResolvedValue({ id: 'pay-4' });
      queryRepository.sumCompletedPayments.mockResolvedValue(40);

      await service.recordPayment({ ...paymentCommand, amount: 10 });

      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('refuses payment on a settled invoice without writing', async () => {
      queryRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.PAID),
      );

      await expect(
        service.recordPayment(paymentCommand),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
    });

    it('refuses a zero or negative amount', async () => {
      queryRepository.findAggregateById.mockResolvedValue(
        invoiceAt(InvoiceStatus.UNPAID),
      );

      await expect(
        service.recordPayment({ ...paymentCommand, amount: 0 }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(paymentCommandRepository.create).not.toHaveBeenCalled();
    });

    it('raises not found for an unknown invoice', async () => {
      queryRepository.findAggregateById.mockResolvedValue(null);

      await expect(
        service.recordPayment(paymentCommand),
      ).rejects.toBeInstanceOf(NotFoundException);
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
