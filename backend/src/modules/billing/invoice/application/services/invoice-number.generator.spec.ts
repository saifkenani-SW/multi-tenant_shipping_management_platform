import { InvoiceCommandRepository } from '../../infrastructure/repositories/invoice.command.repository';
import { InvoiceNumberGenerator } from './invoice-number.generator';

describe('InvoiceNumberGenerator', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const year = new Date().getUTCFullYear();

  const commandRepository = {
    nextSequenceNumber: jest.fn(),
  };

  let generator: InvoiceNumberGenerator;

  beforeEach(() => {
    jest.resetAllMocks();
    generator = new InvoiceNumberGenerator(
      commandRepository as unknown as InvoiceCommandRepository,
    );
  });

  it('builds a padded number from the tenant prefix and the current year', async () => {
    commandRepository.nextSequenceNumber.mockResolvedValue(1);

    await expect(generator.next(tenantId, 'DAM')).resolves.toBe(
      `DAM-INV-${year}-00001`,
    );
  });

  it('keeps counting past the padding width', async () => {
    commandRepository.nextSequenceNumber.mockResolvedValue(123456);

    await expect(generator.next(tenantId, 'DAM')).resolves.toBe(
      `DAM-INV-${year}-123456`,
    );
  });

  it('takes the sequence for this tenant and year', async () => {
    commandRepository.nextSequenceNumber.mockResolvedValue(7);

    await generator.next(tenantId, 'DAM');

    expect(commandRepository.nextSequenceNumber).toHaveBeenCalledWith(
      tenantId,
      year,
    );
  });

  describe('prefix handling', () => {
    beforeEach(() => commandRepository.nextSequenceNumber.mockResolvedValue(1));

    it('uppercases and strips punctuation', async () => {
      await expect(generator.next(tenantId, 'dam-co.')).resolves.toBe(
        `DAMCO-INV-${year}-00001`,
      );
    });

    it('falls back when the tenant has no prefix', async () => {
      await expect(generator.next(tenantId, null)).resolves.toBe(
        `SHP-INV-${year}-00001`,
      );
    });

    it('falls back when the prefix is only punctuation', async () => {
      await expect(generator.next(tenantId, '---')).resolves.toBe(
        `SHP-INV-${year}-00001`,
      );
    });
  });
});
