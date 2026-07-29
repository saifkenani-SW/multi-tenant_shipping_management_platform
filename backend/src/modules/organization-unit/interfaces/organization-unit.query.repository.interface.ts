import { OrganizationUnitQueryCriteria } from '../builders/query/organization-unit-query-criteria';
import { OrganizationUnit } from '../domain/organization-unit.entity';

export interface IOrganizationUnitQueryRepository {
  findMany(
    criteria: OrganizationUnitQueryCriteria,
  ): Promise<[OrganizationUnit[], number]>;

  /** بدون التغطية — للفحوص التي تحتاج ملكية الـ tenant فقط. */
  findById(id: string): Promise<OrganizationUnit | null>;

  /** مع الإحداثيات ومعرّفات التغطية — لشاشة التفاصيل. */
  findByIdWithCoverage(id: string): Promise<OrganizationUnit | null>;

  /** السلسلة من الجذر حتى الأب المباشر. */
  findAncestors(id: string): Promise<OrganizationUnit[]>;

  countChildren(id: string): Promise<number>;

  countActiveAssignments(id: string): Promise<number>;

  /** يتحقق أن كل معرّفات المواقع موجودة في المرجع الجغرافي. */
  findExistingLocationIds(locationIds: readonly string[]): Promise<string[]>;
}
