import { Permission } from '../../../../core/security/Permission';
import {
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_ENTRIES,
} from './permission.catalog';

describe('PERMISSION_CATALOG', () => {
  it('يغطي كل عضو في enum Permission', () => {
    const enumValues = Object.values(Permission);
    const catalogNames = PERMISSION_CATALOG_ENTRIES.map((entry) => entry.name);

    expect(catalogNames.sort()).toEqual([...enumValues].sort());
  });

  it('يطابق مفتاح كل مدخل اسمه', () => {
    for (const [key, entry] of Object.entries(PERMISSION_CATALOG)) {
      expect(entry.name).toBe(key);
    }
  });

  it('لا يكرر الأسماء لأن العمود unique في قاعدة البيانات', () => {
    const names = PERMISSION_CATALOG_ENTRIES.map((entry) => entry.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it('يملأ resource و action و description لكل مدخل', () => {
    for (const entry of PERMISSION_CATALOG_ENTRIES) {
      expect(entry.resource).toBeTruthy();
      expect(entry.action).toBeTruthy();
      expect(entry.description).toBeTruthy();
    }
  });
});
