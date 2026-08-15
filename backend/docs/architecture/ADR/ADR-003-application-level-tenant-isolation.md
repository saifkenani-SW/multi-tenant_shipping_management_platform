# ADR-003: عزل المستأجر على مستوى التطبيق

- **الحالة:** معتمد (Accepted)
- **التاريخ:** 2026-7-3
- **القرار:** اعتماد عزل المستأجر على مستوى التطبيق
- **النطاق:** عزل بيانات المستأجرين، التفويض، Visibility Scope، والتخزين المؤقت

---

## 1. السياق

المنصة عبارة عن نظام SaaS متعدد المستأجرين (Multi-Tenant)، حيث تشترك عدة شركات (Tenants) في نفس قاعدة البيانات.

يجب ضمان عدم تمكن مستخدم تابع لمستأجر من الوصول إلى موارد مستأجر آخر.

تمت دراسة ثلاثة خيارات رئيسية لعزل المستأجرين:
1. قاعدة بيانات أو Schema مستقل لكل Tenant.
2. استخدام PostgreSQL Row-Level Security (RLS).
3. عزل المستأجرين على مستوى التطبيق (Application-Level Tenant Isolation).

يمتلك النظام أصلًا بنية مركزية للتفويض (Authorization) تعتمد على:

```text
Principal
    ↓
Authorization Policy
    ↓
Ability
    ↓
Visibility Scope
    ↓
Resource Access
```

كما أن النظام يدعم أنواعًا مختلفة من الـ Principals، ولكل نوع قواعد رؤية مختلفة، مثل:
* Platform Owner
* Tenant Admin
* Employee
* Driver
* Customer

لذلك فإن العزل في النظام لا يقتصر على: `tenant_id = X` فقط.
فعلى سبيل المثال:
* **Platform Owner** يمكنه الوصول إلى بيانات أكثر من Tenant واحد.
* **Tenant Admin** مقيد بالـ Tenant الخاص به.
* **Employee** قد يكون مقيدًا بالـ Tenant وبمجموعة محددة من Organization Units.
* **Customer** يتم تحديد نطاق وصوله من خلال علاقته بالشحنات، وليس من خلال tenant_id فقط.

وبالتالي فإن طبقة Authorization الموجودة أصلًا هي المكان الطبيعي لتطبيق هذه القواعد.

---

## 2. القرار

نعتمد:
**عزل المستأجرين على مستوى التطبيق (Application-Level Tenant Isolation)**، مع فرضه من خلال طبقة Authorization وPolicy المركزية.

ولا نعتمد:
* Database/Schema مستقل لكل Tenant.
* PostgreSQL RLS كآلية العزل الأساسية.

سيبقى جميع المستأجرين ضمن قاعدة البيانات نفسها، بينما يحدد التطبيق ما إذا كان الـ Principal الحالي يملك صلاحية الوصول إلى المورد.

يكون التدفق:
```text
Principal
    ↓
AuthorizationContext
    ↓
Policy / Ability
    ↓
Visibility Scope
    ↓
Repository Query / Aggregate Access
```

ويجب أن يكون `tenant_id` المستخدم في تحديد الصلاحيات مستمدًا من الـ Principal الموثق، وليس من قيمة يرسلها العميل.

---

## 3. البدائل التي تمت دراستها

### 3.1 قاعدة بيانات أو Schema مستقل لكل Tenant
يقوم هذا الخيار بإنشاء قاعدة بيانات أو Schema مستقل لكل مستأجر.
مثال: `tenant_a`, `tenant_b`, `tenant_c`

**المزايا:**
* عزل قوي بين المستأجرين.
* تقليل احتمال حدوث Cross-Tenant Query بالخطأ.
* وجود حد فاصل واضح على مستوى قاعدة البيانات.

**العيوب:**
هذا الحل يضيف تعقيدًا تشغيليًا كبيرًا، خصوصًا مع زيادة عدد المستأجرين:
* إنشاء Schema/Database لكل Tenant.
* إدارة الـ Migrations.
* إدارة الاتصالات.
* Backup وRestore.
* Monitoring.
* Deployment.
* التقارير التي تجمع بيانات عدة Tenants.
* العمليات الإدارية.
* زيادة التعقيد مع نمو عدد المستأجرين.

كما أن النظام الحالي لا يحتاج إلى هذا المستوى من العزل الفيزيائي.

**القرار:** مرفوض — Over-Engineering بالنسبة للمتطلبات الحالية.

### 3.2 PostgreSQL Row-Level Security (RLS)
الخيار الثاني هو الاعتماد على PostgreSQL لفرض العزل.
مثلًا:
```sql
CREATE POLICY tenant_isolation
ON parcel
USING (tenant_id = current_setting('app.tenant_id'));
```
وبذلك تصبح قاعدة البيانات نفسها مسؤولة عن منع الوصول إلى بيانات Tenant آخر.

**المزايا:**
* عزل مفروض على مستوى قاعدة البيانات.
* حتى في حال وجود خطأ في Query من التطبيق، يمكن لقاعدة البيانات منع الوصول.
* يوفر Defense-in-Depth قويًا.

**العيوب:**
إدخال RLS يضيف تعقيدًا في:
* Database Session Context.
* Connection Pooling.
* Transactions.
* Background Jobs.
* Workers.
* System-Level Queries.
* العمليات الإدارية.
* Testing.
* Debugging.
* Migrations.

كما أن النظام يمتلك أصلًا Authorization Architecture مركزية قادرة على التعامل مع:
`Tenant + Role + Organization Unit + Customer Scope + Resource`

وبالتالي فإن استخدام RLS سيؤدي إلى وجود طبقتين منفصلتين لاتخاذ قرار العزل:
`Application Authorization + Database RLS`
ويجب الحفاظ على تطابقهما دائمًا.

**القرار:** مرفوض كآلية العزل الأساسية.
يمكن إعادة النظر في RLS مستقبلًا إذا ظهرت متطلبات أمنية أو تنظيمية تستوجب وجود طبقة عزل إضافية على مستوى قاعدة البيانات.

---

## 4. لماذا اخترنا العزل على مستوى التطبيق؟

لأن نموذج Authorization في النظام أكثر تعبيرًا من مجرد `tenant_id`. المورد نفسه قد يكون مرئيًا أو غير مرئي حسب الـ Principal.

مثال:
* **Platform Owner:** يمكنه الوصول عبر عدة Tenants.
* **Tenant Admin:** ضمن Tenant الخاص به.
* **Employee:** ضمن Tenant + Organization Units المسموح بها.
* **Customer:** ضمن الموارد المرتبطة به.

لذلك فإن النموذج الصحيح هو:
`Resource + Principal + Policy = Authorization Decision`
بدل:
`Resource + tenant_id = Authorization Decision`

### مسؤولية طبقة Authorization
اختيار Application-Level Isolation لا يعني أن التطبيق يجب أن يتذكر يدويًا إضافة `tenant_id` إلى كل Query. هذا التصميم غير مقبول.
بل يجب أن تكون عملية العزل مركزية:
```text
Authenticated Request
        ↓
Principal
        ↓
AuthorizationContext
        ↓
Policy
        ↓
Ability / Visibility Scope
        ↓
Repository
```
وبذلك تصبح سياسة الوصول جزءًا من البنية المعمارية نفسها، وليس مسؤولية كل Developer بشكل منفصل.

---

## 5. جلب Aggregate بواسطة ID والتخزين المؤقت (Caching)

بالنسبة للـ Aggregates التي تمتلك معرفًا فريدًا عالميًا، مثل: (`Parcel`, `Shipment`, `Manifest`, `Trip`)، يمكن جلب الـ Aggregate بواسطة الـ ID الخاص به.

مثلًا: `GET /parcels/:id`
يكون التدفق:
```text
Load Aggregate
      ↓
Authorization Policy
      ↓
Allowed / Denied
```
ولا يشترط أن يكون `tenant_id` جزءًا من هوية الـ Aggregate أو من Cache Key طالما أن الـ ID فريد عالميًا، ويتم فرض Authorization بعد جلب المورد.

### لماذا لا نضع Tenant ID في كل Aggregate Cache Key؟
هذه من أهم أسباب اختيار Application-Level Isolation.
إذا كان لدينا `Parcel ID = P123` تابع لـ `Tenant = T1`، وكان هذا المورد مطلوبًا من (Tenant Admin, Employee, Platform Owner)، فإن المورد نفسه هو `P123`.
ولا نحتاج إلى تخزين نسخ متعددة منه في الـ Cache لمجرد اختلاف الـ Principal.
نستخدم: `parcel:P123` بدلًا من مفاتيح مثل: `parcel:T1:P123`، `parcel:T1:P123`، `parcel:none:P123` إذا كانت هوية المورد نفسها كافية لتحديده.

وبالتالي:
```text
                 ┌──────────────┐
                 │ parcel:P123  │
                 └──────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
     Tenant Admin    Employee    Platform Owner
          │             │             │
          ↓             ↓             ↓
       Policy        Policy        Policy
          │             │             │
          ↓             ↓             ↓
       Allowed       Allowed       Allowed
```

أي: الـ Cache يخزن المورد، بينما Authorization يحدد من يستطيع استخدامه.
وهذا يفصل بين `Resource Identity` و `Authorization Context`.

### أثر القرار على Cache Memory
لو استخدمنا Tenant أو Principal Scope كجزء من Cache Key لكل Aggregate، فمن الممكن أن يتم تخزين نفس البيانات عدة مرات.
هذا يؤدي إلى:
* تقليل تكرار البيانات في الـ Cache.
* تقليل استهلاك الذاكرة.
* زيادة إعادة استخدام نفس Cache Entry.
* تحسين Cache Hit Ratio في سيناريوهات الوصول المشتركة.
* تقليل ارتباط الـ Cache بهوية المستخدم.

لا يجب اعتبار أن تقليل الذاكرة سيكون دائمًا بنسبة ثابتة مثل الثلث؛ النسبة الفعلية تعتمد على نمط الوصول وعدد الـ Principals والـ TTL. في سيناريو توجد فيه ثلاث نسخ متطابقة لنفس المورد، يمكن نظريًا تحويلها من ثلاث Entries إلى Entry واحدة.

---

## 6. Collection Queries

هناك فرق بين `Aggregate by ID` و `Collection Query`.
عند جلب قائمة `GET /parcels`، يجب تطبيق Visibility Scope على الاستعلام نفسه.

التدفق:
```text
Principal
    ↓
Visibility Scope
    ↓
Query Criteria
    ↓
Database Query
```

مثلًا:
* **Tenant Admin:** `tenant_id = principal.tenantId`
* **Employee:** `tenant_id = principal.tenantId AND (current_org_unit_id IN permitted_units OR destination_org_unit_id IN permitted_units)`

ولا يجوز أن يتمكن الـ Client من توسيع هذا النطاق من خلال Query Parameters. الـ Client يستطيع تضييق النتائج، لكنه لا يستطيع توسيع Visibility Scope المفروض بواسطة Authorization.

### Cache Keys للقوائم
لا يعني قرارنا أن `tenant_id` يجب ألا يظهر أبدًا في Cache Keys. في القوائم، تكون الـ Visibility Scope جزءًا من نتيجة الاستعلام، لذلك يجب أن يدخل الـ Scope ضمن Cache Key.
الفرق هو:
* **Aggregate Cache:** `parcel:{id}`
* **Collection Cache:** `parcels:{visibility-scope}:{filters}`
لأن نتيجة الـ Collection تعتمد على الـ Visibility Scope.

---

## 7. عدم الثقة بـ Tenant ID القادم من العميل

لا يجوز الاعتماد على `GET /parcels?tenantId=...` كمصدر للعزل.
كما لا يجب أن يكون `repository.findById(id, tenantIdFromRequest)` إذا كان `tenantIdFromRequest` قادمًا من العميل.

المصدر الصحيح هو:
```text
Authenticated User
        ↓
Principal
        ↓
principal.tenantId
```
أي: الـ Tenant Context يتم اشتقاقه من هوية المستخدم الموثقة، وليس من بيانات يرسلها المستخدم.

---

## 8. دور Policy في حماية الـ Aggregate

جلب الـ Aggregate لا يعني أن المستخدم أصبح مخولًا لرؤيته. التدفق الصحيح:
```text
Request
   ↓
Authentication
   ↓
Principal
   ↓
Load Aggregate
   ↓
Authorization Policy
   ├── Deny → Forbidden
   │
   └── Allow
          ↓
       Response
```
وبذلك تكون الـ Policy هي الطبقة التي تتحقق من: `Tenant + Role + Organization Scope + Customer Relationship + Resource` بحسب نوع الـ Principal والـ Resource.

---

## 9. الفرق بين Aggregate Access و Collection Access

**Aggregate**
```text
findById(id)
      ↓
Authorization Policy
      ↓
Entity Authorization
```

**Collection**
```text
Principal
      ↓
Visibility Scope
      ↓
Database Query
      ↓
Results
```
هذا الفصل مهم للأداء. فليس من المنطقي جلب مئات الموارد ثم تنفيذ Authorization Query منفصل لكل Resource. بدل ذلك يتم تحويل الـ Visibility Scope إلى شروط Query مباشرة.

---

## 10. النتائج

### الإيجابية
* **الأداء:** إعادة استخدام أفضل للـ Aggregate Cache، تقليل تكرار نفس البيانات في الـ Cache، تقليل ضغط الذاكرة، تقليل الحاجة إلى Cache Entries مرتبطة بالـ Principal.
* **الصيانة:** قواعد Tenant Isolation و Authorization موجودة في طبقة مركزية بدل تكرارها في كل Repository.
* **المرونة:** يمكن دعم (Platform Owner, Tenant Admin, Employee, Driver, Customer) مع قواعد Visibility مختلفة دون تغيير بنية قاعدة البيانات لكل نوع.
* **التشغيل:** لا نحتاج إلى إنشاء Schema لكل Tenant، أو إدارة Database لكل Tenant، أو RLS Session Context، أو تعقيد إضافي في Connection Pooling.

### السلبية
الجانب السلبي الرئيسي هو أن قاعدة البيانات ليست الحاجز الأمني الأساسي ضد Cross-Tenant Access. وبالتالي تصبح طبقة Authorization مكونًا أمنيًا حساسًا جدًا.
أي خطأ في (Policy, Ability, Visibility Scope, Authorization Guard, AuthorizationContext) قد يؤدي إلى كشف بيانات.
لذلك يجب أن تكون هذه الطبقة:
* مركزية.
* إلزامية.
* قابلة للاختبار.
* غير قابلة للتجاوز من الـ Application Services المحمية.

---

## 11. متطلبات الاختبار

يجب تغطية الحالات التالية:

* **Tenant Isolation:**
  * Tenant A → Tenant A Resource → Allowed
  * Tenant A → Tenant B Resource → Denied
* **Platform Owner:**
  * Platform Owner → Tenant A/B/C → Allowed
* **Employee:**
  * Employee → Permitted Organization Unit → Allowed
  * Employee → Unpermitted Organization Unit → Denied
* **Customer:**
  * يجب أن يتم تحديد الوصول وفق Customer Visibility Policy وليس Tenant Ownership فقط.
* **Cache:**
  * يجب التأكد من أن: `نفس Resource ID + Principals مختلفون → نفس Aggregate Cache Entry → Authorization مستقل لكل Principal`

---

## 12. البدائل والقرار النهائي

| الخيار | القرار | السبب |
| :--- | :--- | :--- |
| **Database/Schema لكل Tenant** | مرفوض | Over-Engineering وتعقيد تشغيلي مرتفع |
| **PostgreSQL RLS** | مرفوض | تعقيد إضافي وتكرار حدود Authorization |
| **Application-Level Isolation** | معتمد | متوافق مع Authorization Architecture، مرن، أبسط تشغيليًا، ويتيح إعادة استخدام الـ Cache |

## 13. القرار المعماري النهائي

نعتمد:
**Application-Level Tenant Isolation + Centralized Authorization + Policy / Ability + Visibility Scope + Resource-Based Aggregate Cache Keys + Scope-Based Collection Cache Keys**

والقاعدة الأساسية هي:
> قاعدة البيانات تخزن المورد، وطبقة Authorization في التطبيق تحدد من يحق له الوصول إليه، والـ Cache يخزن المورد بشكل مستقل عن المستخدم عندما تكون هوية المورد فريدة عالميًا.

كما أن:
* Tenant Context يجب أن يأتي من الـ Authenticated Principal، وليس من قيمة يرسلها العميل.
* وبالنسبة للـ Aggregates ذات الـ ID الفريد عالميًا: `Resource → Cache by ID → Authorization by Principal`
* أما الـ Collections: `Principal → Visibility Scope → Query → Scope-Aware Cache Key`

وبذلك نحصل على عزل منطقي قوي على مستوى التطبيق، مع تجنب التعقيد التشغيلي لـ Database-per-Tenant وRLS، والحفاظ على إمكانية إعادة استخدام نفس بيانات الـ Aggregate في الـ Cache دون تكرارها حسب الـ Tenant أو الـ Principal.
