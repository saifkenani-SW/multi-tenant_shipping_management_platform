/**
 * بناء أسماء Topics موحّدة لتفادي أخطاء الكتابة.
 * Builds consistent topic names to avoid typos.
 *
 * Firebase يرفض المسافات والأحرف الخاصة — نستخدم _ كفاصل.
 *
 * Examples:
 *   buildTopic('tenant', tenantId)           => tenant_<id>
 *   buildTopic('tenant', tenantId, 'admin')  => tenant_<id>_admin
 *   buildTopic('tenant', tenantId, 'branch', branchId) => tenant_<id>_branch_<id>
 */
export function buildTopic(...parts: string[]): string {
  return parts.join('_').replace(/[^a-zA-Z0-9_-]/g, '_');
}
