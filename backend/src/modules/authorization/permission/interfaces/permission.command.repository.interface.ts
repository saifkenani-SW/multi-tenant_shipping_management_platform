import { PermissionCatalogEntry } from '../catalog/permission.catalog';

export interface IPermissionCommandRepository {
  /**
   * يزامن الكتالوج المعرَّف في الكود مع قاعدة البيانات.
   * يُستدعى من PermissionSeeder عند الإقلاع لا من نقطة نهاية HTTP.
   */
  syncCatalog(entries: readonly PermissionCatalogEntry[]): Promise<void>;
}
