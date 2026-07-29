import { GeoPoint } from '../../global-location/domain/geo-point.value-object';
import { OrgType } from '../enums/org-type.enum';

/**
 * OrganizationUnit Domain Entity.
 *
 * وحدة تنظيمية داخل شركة: إقليم أو مركز فرز أو مستودع أو فرع أو خزانة.
 * جذر تجميع يضم تغطيته الجغرافية (org_unit_location_mapping).
 *
 * `coverageLocationIds` تُملأ عند قراءة التفاصيل فقط.
 */
export class OrganizationUnit {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly orgType: OrgType,
    public readonly parentId: string | null = null,
    public readonly zoneId: string | null = null,
    public readonly addressLine: string | null = null,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly point: GeoPoint | null = null,
    public readonly coverageLocationIds: readonly string[] = [],
  ) {}
}
