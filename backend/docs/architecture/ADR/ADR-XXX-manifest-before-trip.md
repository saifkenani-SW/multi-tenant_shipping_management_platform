# ADR: إنشاء Manifest قبل Trip وربط Manifestات جاهزة بالرحلة

* **Status:** Accepted
* **Date:** 2026-08-15
* **Decision:** Manifest-first, Trip-then-Assignment

---

## 1. السياق

منصة الشحن تحتوي على مفهومين مختلفين في المسؤولية:

* **Manifest:** يمثل مجموعة طرود تم تجميعها في فرع معين، وفق مسار Origin → Destination.
* **Trip:** يمثل عملية النقل الفعلية التي يديرها Fleet، وتشمل الرحلة والسائق والمركبة وحالتها التشغيلية.

في التصميم الأول كان `transport_manifest.trip_id` إلزاميًا، وبالتالي كان إنشاء Manifest يتطلب وجود Trip مسبقًا.

هذا يربط عمليتي **تجميع الطرود** و**تخطيط الرحلة** ببعضهما بشكل غير ضروري.

---

## 2. القرار

نعتمد التصميم التالي:

> **يتم إنشاء وتجهيز Manifest أولًا بواسطة موظف الفرع، ثم يقوم Fleet بإنشاء Trip أو استخدام Trip موجود، وبعد ذلك يتم إسناد Manifestات الجاهزة إلى الـ Trip.**

أي أن العلاقة الزمنية الأساسية تصبح:

```text
Parcels Ready
      ↓
Branch Employee
      ↓
Create Manifest
      ↓
OPEN
      ↓
Add / Remove Manifest Items
      ↓
Finalize
      ↓
READY_FOR_DISPATCH
      ↓
Fleet
      ↓
Assign Manifest → Trip
      ↓
Start Trip
      ↓
IN_TRANSIT
      ↓
Complete Trip
      ↓
COMPLETED
```

---

## 3. لماذا Manifest أولًا؟

### 3.1 التجميع مرتبط بوصول الطرود وليس بتوفر الأسطول

عملية تجميع الطرود تحدث عندما تصبح الطرود جاهزة في الفرع.

أما توفر:

* السائق
* المركبة
* وقت الانطلاق
* Trip مناسب

فهو قرار منفصل تديره Fleet.

لذلك لا ينبغي أن نمنع موظف الفرع من إنشاء Manifest فقط لأن Fleet لم تنشئ Trip بعد.

هذا يفصل:

```text
Parcel Consolidation
```

عن:

```text
Transport Planning
```

ويمنع إنشاء اعتماد مصطنع بين العمليتين.

---

## 4. مسؤولية كل Actor

### Branch Employee

مسؤوليته:

```text
Create Manifest
      ↓
Add / Remove Items
      ↓
Finalize Manifest
```

وينتقل Manifest من:

```text
OPEN
```

إلى:

```text
READY_FOR_DISPATCH
```

بعد تحقق وجود عنصر واحد على الأقل.

موظف الفرع لا يقرر:

* السائق
* المركبة
* الرحلة
* توقيت الانطلاق

---

### Fleet / Dispatcher

مسؤوليته:

```text
Find READY_FOR_DISPATCH manifests
      ↓
Select compatible manifests
      ↓
Assign them to Trip
      ↓
Start Trip
      ↓
Complete Trip
```

وبالتالي Fleet هي صاحبة قرار **Transport Assignment**.

---

## 5. لماذا لا نجعل Trip هو الذي ينشئ Manifest؟

هذا التصميم يسبب coupling بين مرحلتين مستقلتين.

في التصميم:

```text
Create Trip
    ↓
Create Manifest
    ↓
Add Parcels
```

يصبح وجود Trip شرطًا لتجميع الطرود.

وهذا يعني أن موظف الفرع يحتاج إلى انتظار Fleet حتى:

```text
Trip exists
+ Driver exists
+ Vehicle exists
```

قبل أن يستطيع تجهيز الشحنة.

وهذا يعكس اتجاه العملية الواقعي بشكل غير صحيح.

---

## 6. لماذا Trip يقوم بإسناد Manifestات موجودة؟

لأن Trip يمثل **قرار النقل** وليس **عملية التجميع**.

عندما تكون Manifestات جاهزة:

```text
READY_FOR_DISPATCH
```

يمكن لـ Fleet اختيار Manifestات متوافقة مع مسار الرحلة:

```text
Manifest.origin_org_unit_id
        =
Trip.origin_org_unit_id

Manifest.destination_org_unit_id
        =
Trip.destination_org_unit_id
```

ثم يتم الربط:

```text
Manifest.trip_id = Trip.id
```

وبذلك تصبح عملية إنشاء الـ Trip وعملية إسناد الـ Manifest عمليتين منفصلتين منطقيًا.

---

## 7. `trip_id` يجب أن يكون Nullable

يجب أن يكون:

```prisma
trip_id String?
```

وليس:

```prisma
trip_id String
```

لأن Manifest صالح للوجود قبل Trip.

الحالات الممكنة:

```text
trip_id = NULL
status = OPEN
```

يعني:

> Manifest يتم تجهيزه في الفرع.

ثم:

```text
trip_id = NULL
status = READY_FOR_DISPATCH
```

يعني:

> Manifest جاهز للحجز من Fleet.

بعد الإسناد:

```text
trip_id = <trip-id>
status = READY_FOR_DISPATCH
```

يعني:

> Manifest تم حجزه لرحلة محددة، لكن الرحلة لم تبدأ بعد.

بعد بدء الرحلة:

```text
trip_id = <trip-id>
status = IN_TRANSIT
```

ثم:

```text
trip_id = <trip-id>
status = COMPLETED
```

---

## 8. لماذا لا نضيف حالة `BOOKED`؟

لا نحتاج إلى:

```text
BOOKED
```

لأن حالة الحجز ممثلة أصلًا بواسطة:

```text
trip_id IS NOT NULL
```

مع:

```text
status = READY_FOR_DISPATCH
```

وبالتالي:

```text
trip_id = NULL
+
READY_FOR_DISPATCH
```

تعني:

> متاح للحجز.

بينما:

```text
trip_id != NULL
+
READY_FOR_DISPATCH
```

تعني:

> محجوز لرحلة ولم تبدأ بعد.

إضافة `BOOKED` ستكرر نفس المعلومة في مكانين:

```text
status = BOOKED
trip_id = NULL
```

وقد تؤدي إلى حالات غير متسقة.

لذلك نستخدم:

> **State = lifecycle state**
> **trip_id = assignment relationship**

ولا نخلط بين المفهومين.

---

## 9. هل Trip يجب أن يُنشأ قبل Manifest؟

ليس شرطًا.

التصميم النهائي يدعم السيناريوهين:

### السيناريو A — الطبيعي

```text
Manifest
   ↓
READY_FOR_DISPATCH
   ↓
Trip
   ↓
Assign Manifest
```

### السيناريو B — Trip مخطط مسبقًا

```text
Trip
   ↓
SCHEDULED
   ↓
Manifest يصبح READY_FOR_DISPATCH
   ↓
Assign Manifest
```

إذن القرار المعماري ليس:

> "Trip يجب أن يأتي دائمًا بعد Manifest."

بل:

> **لا يوجد dependency وجودي بين إنشاء Trip وإنشاء Manifest.**

الـ dependency الوحيد هو أن:

> **Manifest يجب أن يكون READY_FOR_DISPATCH قبل أن يتم إسناده إلى Trip.**

وهذه نقطة مهمة في الـ ADR.

---

## 10. State Machine

الحالات المعتمدة:

```text
OPEN
  │
  │ Finalize
  │ شرط: يوجد manifest_item واحد على الأقل
  ▼
READY_FOR_DISPATCH
  │
  │ Assign to Trip
  │ ثم Start Trip
  ▼
IN_TRANSIT
  │
  │ Complete Trip
  ▼
COMPLETED
```

والانتقالات المسموحة فقط:

| From                 | To                   | Actor           | شرط                      |
| -------------------- | -------------------- | --------------- | ------------------------ |
| `—`                  | `OPEN`               | System          | عند الإنشاء              |
| `OPEN`               | `READY_FOR_DISPATCH` | Branch Employee | يوجد item واحد على الأقل |
| `READY_FOR_DISPATCH` | `OPEN`               | Branch Employee | `trip_id IS NULL`        |
| `READY_FOR_DISPATCH` | `IN_TRANSIT`         | Fleet           | Start Trip               |
| `IN_TRANSIT`         | `COMPLETED`          | Fleet           | Complete Trip            |

لا توجد انتقالات أخرى.

---

## 11. لماذا لا يستطيع Manifest الانتقال مباشرةً إلى `COMPLETED`؟

لأن اكتمال Manifest ليس حدثًا مستقلًا.

Manifest يمثل حمولة مرتبطة بعملية نقل.

لذلك:

```text
Trip → COMPLETED
```

هو الحدث الذي يؤدي إلى:

```text
Manifest → COMPLETED
```

وبالتالي عند:

```text
completeTrip()
```

يتم تنفيذ:

```text
Trip:
IN_PROGRESS → COMPLETED

Manifest:
IN_TRANSIT → COMPLETED
```

داخل نفس الـ transaction.

هذا يجعل Trip هو مصدر الحدث التشغيلي لإنهاء النقل.

---

## 12. لماذا لا يستطيع الموظف تعديل Manifest بعد ربطه بـ Trip؟

لأن:

```text
READY_FOR_DISPATCH
+
trip_id != NULL
```

يعني أن الـ Manifest تم اعتماده وأصبح جزءًا من خطة نقل فعلية.

لذلك:

```text
Add Item      ❌
Remove Item   ❌
Edit Items    ❌
```

ويجب أن تكون عمليات تعديل `manifest_item` محصورة في:

```text
status = OPEN
```

فقط.

---

## 13. Tenant Isolation

عملية إسناد Manifest إلى Trip يجب ألا تعتمد على IDs وحدها.

يجب أن يتم التحقق من:

```text
Trip.tenant_id = currentTenantId
```

و:

```text
Manifest.tenant_id = currentTenantId
```

ويجب أن يكون query نفسه tenant-scoped:

```sql
WHERE id IN (...)
  AND tenant_id = ?
  AND status = 'READY_FOR_DISPATCH'
  AND trip_id IS NULL
```

ولا يكفي جلب السجلات ثم التحقق منها في التطبيق.

هذا يمنع:

```text
Tenant A
   ↓
يحاول إرسال Manifest ID
خاص بـ Tenant B
   ↓
Rejected
```

---

## 14. Race Condition Protection

حتى بعد التحقق من أن Manifest متاح، يجب إعادة وضع شرط:

```sql
trip_id IS NULL
```

داخل عملية الـ UPDATE نفسها.

مثلًا:

```sql
UPDATE transport_manifest
SET trip_id = :tripId
WHERE id IN (...)
  AND tenant_id = :tenantId
  AND status = 'READY_FOR_DISPATCH'
  AND trip_id IS NULL
```

ثم يتم التأكد من:

```text
updated_count === requested_manifest_count
```

وإلا يتم rollback.

وبذلك إذا حاول Dispatcherَان حجز نفس Manifest في نفس الوقت:

```text
Request A ──┐
            ├── Manifest
Request B ──┘
```

واحد فقط يستطيع إتمام الحجز.

---

## 15. لماذا `onDelete: SetNull`؟

العلاقة:

```prisma
trip? @relation(
  fields: [trip_id],
  references: [id],
  onDelete: SetNull
)
```

بدل:

```prisma
onDelete: Cascade
```

لأن حذف Trip لا يعني أن Manifest والطرود الموجودة داخله يجب أن تختفي.

إذا أُلغيت الرحلة، فالـ Manifest يجب أن يبقى موجودًا ويمكن أن يعود إلى:

```text
trip_id = NULL
```

ويعاد إسناده إلى Trip آخر وفق قواعد النظام.

---

## 16. النتيجة المعمارية

الفصل النهائي هو:

```text
Branch
  │
  │ Consolidation
  ▼
Manifest
  │
  │ READY_FOR_DISPATCH
  ▼
Fleet
  │
  │ Assignment
  ▼
Trip
  │
  │ Start
  ▼
IN_TRANSIT
  │
  │ Complete
  ▼
COMPLETED
```

أي:

> **Manifest يصف "ماذا سننقل".**

بينما:

> **Trip يصف "كيف ومتى سيتم نقله".**

وبالتالي لا يجب أن يكون إنشاء أحدهما شرطًا لوجود الآخر.

---

## 17. البدائل التي تم رفضها

### البديل 1 — Trip أولًا ثم Manifest

**مرفوض.**

لأنه يربط تجميع الطرود بتوفر رحلة، سائق، ومركبة.

ويجعل Fleet prerequisite لعملية Branch Consolidation.

---

### البديل 2 — Manifest وTrip يتم إنشاؤهما معًا

**مرفوض كـ lifecycle design.**

لأنه يعيد coupling بين:

```text
Consolidation
```

و:

```text
Transport Planning
```

ويمنع الاستفادة من Manifestات جاهزة مسبقًا.

---

### البديل 3 — Manifest مستقل + Trip مستقل + Assignment منفصل

**معتمد.**

وهو التصميم الحالي:

```text
Manifest ──┐
           ├── Assignment ──> Trip
Trip ──────┘
```

لأنه يفصل المسؤوليات ويجعل عملية الربط explicit وatomic وقابلة للتأجيل.

---

## 18. القرار النهائي

نعتمد:

```text
Manifest-first lifecycle
+
Independent Trip lifecycle
+
Explicit Manifest → Trip assignment
```

مع:

```text
transport_manifest.trip_id = nullable
```

و:

```text
ManifestStatus =
  OPEN
  READY_FOR_DISPATCH
  IN_TRANSIT
  COMPLETED
```

ويكون **إنشاء Manifest مسؤولية موظف الفرع**، بينما يكون **إسناد Manifest إلى Trip مسؤولية Fleet**.

ولا يُسمح لأي Manifest بالانتقال إلى `COMPLETED` بشكل مستقل؛ اكتماله يحدث فقط نتيجة اكتمال الـ Trip المرتبط به.

