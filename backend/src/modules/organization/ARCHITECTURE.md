# Organization Module — Architecture & Caching Guide

## 1. قاعدة الفاساد

الفاساد يعتمد على **Services فقط**، لا على Repositories مباشرة.

```
Facade → Service → Repository → DB / Cache
```

لا يجوز للفاساد أن يستدعي `QueryRepository` أو `CommandRepository` مباشرة.

---

## 2. استراتيجية الكاش — `findByIds` مع `CacheStrategy.MANY`

### القاعدة

كل method تجلب عدة عناصر بـ IDs يجب أن تستخدم:

```ts
@Cacheable({
  strategy: CacheStrategy.MANY,
  ttl: MODULE_CACHE_TTL.DETAILS,
  keyPrefix: MODULE_CACHE_KEYS.DETAILS,  // ← نفس prefix الـ findById
  ids: (ids: string[]) => ids,
  loader: (_args, missingIds) => [missingIds],
})
async findByIds(ids: string[]): Promise<ResponseDto[]>
```

### لماذا نفس prefix الـ `findById`؟

الـ `findById` يخزن تحت:
```
DETAILS:{id}  →  كائن كامل
```

الـ `findByIds` مع MANY strategy يقرأ ويكتب تحت:
```
DETAILS:{id}  →  كائن كامل  (نفس المفتاح!)
```

**النتيجة:** أي استدعاء `findById("5")` من أي مسار يسخن الكاش لـ `findByIds(["5", "6"])` لاحقاً، والعكس صحيح.

```
findById("5")         → يخزن DETAILS:5
findByIds(["5","6"])  → 5 = Cache Hit ✅، 6 = Cache Miss → DB → يخزن DETAILS:6
findById("6")         → Cache Hit ✅ (مخزن من الاستدعاء السابق)
validateAllBelongToTenant("A", ["5","6"]) → كلاهما Cache Hit ✅
```

### شرط حتمي: نفس شكل الكائن

`findByIds` **يجب** أن يعيد نفس شكل كائن `findById` تماماً — بما فيه أي sub-queries أو joins.

**❌ خطأ:** `findByIds` يعيد `{ id, tenantId }` فقط بينما `findById` يعيد الكائن الكامل.
في هذه الحالة، لو `findByIds` كتب كائناً ناقصاً تحت `DETAILS:{id}`، سيجد `findById` لاحقاً بيانات ناقصة في الكاش — **تلوث صامت**.

---

## 3. تحويل Map → Array في Service

### المشكلة

الـ `@Cacheable` مع `CacheStrategy.MANY` يعيد `Map<string, T>` وقت التشغيل، لكن TypeScript يرى النوع المعلن `T[]`. هذا **type lie** — لا يكتشف في compile time.

```ts
// وقت التشغيل الفعلي:
const result = await this.queryRepository.findByIds(ids);
// result هو Map<string, ResponseDto> وليس ResponseDto[]

result.length  // ← undefined (Map ليس لها .length)
result.every() // ← TypeError وقت التشغيل
```

### الحل: السيرفيس يعالج التحويل

```ts
async findByIds(ids: string[]): Promise<ResponseDto[]> {
  if (!ids || ids.length === 0) return [];
  const uniqueIds = [...new Set(ids)];
  const result = await this.queryRepository.findByIds(uniqueIds);
  // نعالج كلا الحالتين: Map (من الكاش) أو Array (من DB مباشرة)
  return result instanceof Map ? Array.from(result.values()) : result;
}
```

**القاعدة:** كل service method تستدعي `findByIds` من الريبو **يجب** أن تجري هذا التحويل.

---

## 4. التحقق من ملكية التينانت — `validateAllBelongToTenant`

```ts
async validateAllBelongToTenant(
  tenantId: string,
  ids: string[],
): Promise<boolean> {
  if (!ids || ids.length === 0) return true;
  const uniqueIds = [...new Set(ids)];

  // ← يستخدم this.findByIds() (Service method) لا الريبو مباشرة
  const records = await this.findByIds(uniqueIds);

  if (records.length !== uniqueIds.length) return false;

  return records.every((r) => r.tenantId === tenantId);
}
```

**لماذا `this.findByIds()` وليس `this.queryRepository.findByIds()`؟**
لأن الريبو يعيد Map — فلو استدعينا الريبو مباشرة، `records.length` يعيد `undefined`
والتحقق يفشل صامتاً دائماً.

---

## 5. لماذا لا نضيف `tenantId` في مفتاح الكاش للـ validation؟

**الرغبة الأولى:** `IDS:{tenantId}:{id}` كمفتاح للـ validation.
**المشكلة:** `CacheStrategy.MANY` لا يدعم `keyPrefixBuilder` ديناميكي — الـ prefix ثابت.

**والأهم:** استخدام DETAILS prefix المشترك أفضل لأن:
```
Tenant A جلب ID=5 (أي مسار) → DETAILS:5 محجوز
Tenant B يتحقق من ID=5      → Cache Hit ✅
```
بينما `IDS:A:5` لا يستفيد منه Tenant B — معدل Cache Hit أقل.

**الأمان محفوظ** لأن الكائن المخزن يحتوي `tenantId`، والسيرفيس يتحقق منه وقت الـ validation.

---

## 6. ملخص القواعد

| القاعدة | التفصيل |
|---------|---------|
| الفاساد → Service | لا ريبو مباشرة |
| `findByIds` prefix | نفس `DETAILS` prefix الـ `findById` |
| `findByIds` shape | نفس شكل كائن `findById` تماماً |
| Map → Array | السيرفيس دائماً يحول |
| `validateAllBelongToTenant` | يستخدم `this.findByIds()` لا `this.queryRepository.findByIds()` |
| منطق tenantId | في السيرفيس، لا في الريبو |
| Authorization | في السيرفيس، لا في الريبو |
| جلب متعدد | `WHERE id IN (...)` لا loop من `findById` |

---

## 7. Authorization في السيرفيس لا في الريبو

الريبو مسؤوليته الوحيدة: **جلب البيانات من DB أو الكاش**.
لا يجوز وضع أي منطق authorization أو tenant scoping داخل الريبو.

```ts
// ❌ خطأ — authorization في الريبو
async findByIds(ids: string[], tenantId: string): Promise<ResponseDto[]> {
  return this.kysely
    .selectFrom('organization_unit')
    .where('id', 'in', ids)
    .where('tenant_id', '=', tenantId)  // ← هذا authorization، لا يخص الريبو
    .execute();
}

// ✅ صواب — الريبو يجلب فقط
async findByIds(ids: string[]): Promise<ResponseDto[]> {
  return this.kysely
    .selectFrom('organization_unit')
    .where('id', 'in', ids)
    .execute();
}

// ✅ صواب — السيرفيس يتحقق من التينانت
async validateAllBelongToTenant(tenantId: string, ids: string[]): Promise<boolean> {
  const records = await this.findByIds(ids);
  return records.every((r) => r.tenantId === tenantId);  // ← authorization هنا
}
```

**لماذا؟**
- الريبو يُعاد استخدامه من سياقات مختلفة (admin، tenant، internal).
- لو وضعنا الـ tenantId في الريبو، أصبح غير قابل لإعادة الاستخدام.
- السيرفيس هو من يعرف السياق — هو المكان الصحيح للقرار.

---

## 8. جلب السجلات المتعددة — `IN` لا Loop

```ts
// ❌ خطأ — N استعلام منفصل
const results = await Promise.all(
  ids.map((id) => this.queryRepository.findById(id)),
);

// ✅ صواب — استعلام واحد بـ IN
async findByIds(ids: string[]): Promise<ResponseDto[]> {
  return this.kysely
    .selectFrom('organization_unit')
    .where('id', 'in', ids)  // ← استعلام واحد
    .execute();
}
```

**الاستثناء الوحيد المقبول:** لو كل ID مُكيَّش مستقلاً بـ `@Cacheable` SINGLE، يمكن `Promise.all` لأن معظم الاستدعاءات ستكون Cache Hit لا DB queries — لكن `findByIds` مع `CacheStrategy.MANY` أفضل لأنه يُحقق الـ batching على مستوى الـ Cache Miss أيضاً.

