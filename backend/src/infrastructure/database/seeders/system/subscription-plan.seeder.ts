import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

const SUBSCRIPTION_PLANS = [
  {
    id: '00000000-0000-7000-8000-000000000001',
    name: 'أساسية',
    description: 'مناسبة لمكاتب الشحن الصغيرة والشركات الناشئة',
    max_branches: 3,
    max_warehouses: 1,
    max_employees: 10,
    max_vehicles: 5,
    max_zones: 2,
    max_monthly_shipments: 500,
    max_monthly_parcels: 1000,
    price_monthly: 49.99,
    price_yearly: 499.99,
  },
  {
    id: '00000000-0000-7000-8000-000000000002',
    name: 'أعمال',
    description: 'لشركات النقل المتوسطة ذات الفروع في أكثر من محافظة',
    max_branches: 10,
    max_warehouses: 5,
    max_employees: 50,
    max_vehicles: 25,
    max_zones: 5,
    max_monthly_shipments: 2000,
    max_monthly_parcels: 5000,
    price_monthly: 149.99,
    price_yearly: 1499.99,
  },
  {
    id: '00000000-0000-7000-8000-000000000003',
    name: 'مؤسسات',
    description: 'للشركات الكبيرة ذات التغطية على مستوى المحافظات',
    max_branches: 50,
    max_warehouses: 20,
    max_employees: 200,
    max_vehicles: 100,
    max_zones: 10,
    max_monthly_shipments: null,
    max_monthly_parcels: null,
    price_monthly: 499.99,
    price_yearly: 4999.99,
  },
] as const;

@Injectable()
export class SubscriptionPlanSeeder implements Seeder {
  private readonly logger = new Logger(SubscriptionPlanSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting...');

    for (const plan of SUBSCRIPTION_PLANS) {
      const { id, ...data } = plan;

      await this.prisma.subscription_plan.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }

    this.logger.log('Completed.');
    this.logger.log(
      `Number of processed records: ${SUBSCRIPTION_PLANS.length}.`,
    );
  }
}
