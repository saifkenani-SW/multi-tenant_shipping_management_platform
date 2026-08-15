import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, InvoiceStatus } from '@prisma/client';

/**
 * Which dashboard the caller is looking at.
 *
 * The response shape is the same for everyone; this says how to read it and
 * what `breakdown` is grouped by, so the frontend calls one endpoint and
 * decides the screen from here.
 */
export enum DashboardScope {
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  DRIVER = 'DRIVER',
}

/**
 * The money, for one currency.
 *
 * Reported per currency and never added together. The schema allows SY and
 * USD, and billing enforces a different minimum payment for each, so a single
 * total across both would be a number that means nothing.
 */
export class MoneyTotalsDto {
  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ description: 'Total billed over the period' })
  invoiced: number;

  @ApiProperty({ description: 'Actually collected against those invoices' })
  collected: number;

  @ApiProperty({ description: 'Billed but not yet collected' })
  outstanding: number;

  @ApiProperty({ description: 'Owed on invoices already past due' })
  overdueAmount: number;

  @ApiProperty({ description: 'How many invoices are past due' })
  overdueCount: number;

  @ApiProperty()
  invoiceCount: number;

  @ApiProperty({ description: 'invoiced / invoiceCount, 0 when there are none' })
  averageInvoice: number;
}

export class InvoiceStatusBucketDto {
  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  count: number;

  @ApiProperty()
  amount: number;
}

/**
 * One row of the breakdown. What it names depends on the scope: a workspace
 * for a platform owner, a branch for everyone else.
 */
export class BreakdownRowDto {
  @ApiProperty({ description: 'Tenant id or organization unit id' })
  id: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  invoiced: number;

  @ApiProperty()
  collected: number;

  @ApiProperty()
  invoiceCount: number;
}

export class DateRangeDto {
  @ApiProperty()
  from: Date;

  @ApiProperty()
  to: Date;
}

export class FinancialDashboardResponseDto {
  @ApiProperty({
    enum: DashboardScope,
    description:
      'Whose dashboard this is. Tells the frontend which screen to build and what breakdown is grouped by.',
  })
  scope: DashboardScope;

  @ApiProperty({ type: DateRangeDto })
  range: DateRangeDto;

  @ApiProperty({
    type: [MoneyTotalsDto],
    description:
      'One entry per currency. Always an array, even with a single currency — totals are never added across currencies.',
  })
  money: MoneyTotalsDto[];

  @ApiProperty({ type: [InvoiceStatusBucketDto] })
  byStatus: InvoiceStatusBucketDto[];

  @ApiPropertyOptional({
    type: [BreakdownRowDto],
    description:
      'Per workspace for a platform owner, per branch otherwise. Absent for a driver, who has no financial view.',
  })
  breakdown?: BreakdownRowDto[];
}
