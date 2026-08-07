# Shipment Request → Organization Resolution → Pricing

## الهدف

عند إنشاء **Shipment Request** لا يعرف العميل شيئًا عن الفروع (Organization Units) أو الـ Zones الخاصة بأي شركة.

كل ما يرسله هو:

* Origin Global Location
* Destination Global Location
* الوزن المتوقع
* عدد القطع

بعدها يبدأ النظام بالبحث عن جميع الشركات والفروع القادرة على تنفيذ الطلب.

---

# المرحلة الأولى: إنشاء الطلب

```
Customer

Origin Global Location
    Damascus

Destination Global Location
    Aleppo

Expected Weight
    12 KG
```

ينشأ:

```
shipment_request
```

ولا يحتوي على:

* origin_org_unit_id
* destination_org_unit_id
* zone_id

لأن النظام لم يحدد بعد من سيقوم بتنفيذ الشحنة.

---

# المرحلة الثانية: استدعاء Organization Module

يقوم Shipment Module بإرسال الطلب إلى Organization Module:

```
ResolveOrganizationUnits(
    origin_global_location_id,
    destination_global_location_id
)
```

---

# المرحلة الثالثة: البحث عن الفروع

يقوم Organization Module بالبحث داخل:

```
org_unit_location_mapping
```

عن جميع الفروع التي تغطي:

* Origin Global Location
* Destination Global Location

---

# مثال

لدينا طلب:

```
Origin      = Damascus

Destination = Aleppo
```

في قاعدة البيانات يوجد:

```
Tenant A
```

Origin

```
Damascus Main Branch
Zone = Z1

Mazzeh Branch
Zone = Z1

Jaramana Branch
Zone = Z2
```

Destination

```
Aleppo Central Branch
Zone = Z5

Sheikh Maqsoud Branch
Zone = Z6
```

---

```
Tenant B
```

Origin

```
Kafr Sousa Branch
Zone = Z7

Baramkeh Branch
Zone = Z7
```

Destination

```
New Aleppo Branch
Zone = Z8

Industrial Branch
Zone = Z9
```

---

# النتيجة التي يعيدها Organization Module

يعيد جميع المرشحين مجمعين حسب الـ Tenant.

```
Tenant A

Origin Candidates

- Damascus Main
  Zone Z1

- Mazzeh
  Zone Z1

- Jaramana
  Zone Z2


Destination Candidates

- Aleppo Central
  Zone Z5

- Sheikh Maqsoud
  Zone Z6
```

---

```
Tenant B

Origin Candidates

- Kafr Sousa
  Zone Z7

- Baramkeh
  Zone Z7


Destination Candidates

- New Aleppo
  Zone Z8

- Industrial
  Zone Z9
```

---

# مسؤولية Organization Module

يقوم فقط بـ:

* إيجاد الفروع المناسبة.
* معرفة الـ Zone الخاصة بكل فرع.
* تجميع النتائج حسب الـ Tenant.

ولا يقوم بـ:

* حساب الأسعار.
* إنشاء Quotations.
* اتخاذ أي قرار تجاري.

---

# المرحلة الرابعة: Shipment Module

بعد استلام النتائج يبدأ Shipment Module بحساب الأسعار.

لكل زوج (Origin Unit + Destination Unit) يتم استخراج:

```
Origin Zone

Destination Zone
```

ثم يتم البحث داخل:

```
zone_pricing_matrix
```

باستخدام:

```
tenant_id

origin_zone_id

destination_zone_id
```

مثال:

```
Tenant A

Origin Zone      = Z1

Destination Zone = Z5
```

يبحث عن:

```
tenant_id = Tenant A

origin_zone_id = Z1

destination_zone_id = Z5
```

---

# إذا وجد Route Pricing

يتم حساب:

```
Base Price

+

Weight Charge

+

Extra Fees
```

ثم إنشاء:

```
Quotation
```

ويحتوي على:

```
origin_org_unit_id

destination_org_unit_id

amount

pricing_snapshot
```

لاحظ أن الـ Quotation يحتفظ بالـ Organization Units وليس بالـ Zones، لأن التنفيذ سيتم بواسطة تلك الفروع.

---

# إذا لم يوجد Route Pricing

ينشأ:

```
Manual Quotation
```

ويتم إشعار موظفي الفرع لإدخال السعر يدويًا.

---

# المسؤوليات

## Organization Module

* Resolve Organization Units
* Resolve Zones
* Group by Tenant

---

## Shipment Module

* Lookup zone_pricing_matrix
* Calculate Price
* Create Automatic Quotation
* Create Manual Quotation
* Return Quotations to Customer

---

# Architecture Flow

```
Customer
    │
    ▼
Shipment Request
    │
    ▼
Shipment Module
    │
    ▼
Organization Module
    │
    ├── Find Origin Organization Units
    ├── Find Destination Organization Units
    ├── Resolve Zones
    └── Group Results By Tenant
    │
    ▼
Shipment Module
    │
    ├── Lookup zone_pricing_matrix
    ├── Calculate Price
    ├── Create Quotations
    └── Return Available Quotations
```
