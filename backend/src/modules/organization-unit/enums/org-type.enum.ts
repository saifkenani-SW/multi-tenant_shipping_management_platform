/**
 * تطابق enum OrgType في قاعدة البيانات.
 *
 * الترتيب هنا تنظيمي لا هرمي صارم: الشجرة تحددها parent_id، لكن حدود
 * خطة الاشتراك تُحسب لكل نوع على حدة (max_branches, max_warehouses).
 */
export enum OrgType {
  REGION = 'REGION',
  HUB = 'HUB',
  WAREHOUSE = 'WAREHOUSE',
  BRANCH = 'BRANCH',
  LOCKER = 'LOCKER',
}
