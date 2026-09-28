# معمارية إدارة المعاملات وقواعد البيانات (Transaction Management)

يوثق هذا المستند كيفية إدارة معاملات قواعد البيانات (Database Transactions) عبر خدمات ومستودعات التطبيق دون تسريب تبعيات البنية التحتية الخاصة بـ ORM إلى قلب منطق النطاق.

---

## 1. الهدف المعماري: عزل البنية التحتية (Infrastructure Isolation)

في المعمارية النظيفة (Clean Architecture) والتصميم الموجه بالنطاق (DDD)، تقوم خدمات التطبيق بتنسيق تدفقات العمل، ويجب ألا تعتمد مباشرة على كائنات المعاملات الخاصة بـ ORM معين (مثل `PrismaClient.$transaction` أو مؤشرات SQL الخام).

يعالج النظام هذا التحدي عبر الحزمة `src/packages/transaction/`، والتي تعتمد على **نمط الحاوية (Container Pattern)** وميزة **`AsyncLocalStorage`** لفصل حدود المعاملة عن تفاصيل تطبيق المستودعات.

```mermaid
graph TD
    Service[خدمة التطبيق Application Service] -->|مزخرفة بـ| Decorator["@Transactional()"]
    Decorator --> Facade[واجهة TransactionFacade عبر TransactionContainer]
    Facade --> PrismaTx["PrismaService.$transaction()"]
    PrismaTx --> Context["TransactionContext عبر AsyncLocalStorage"]
    Context --> TxService[خدمة TransactionalPrismaService]
    Repo[مستودع الأوامر Command Repository] -->|يحقن| TxService
    TxService -->|توجد معاملة نشطة؟| ActiveClient[عميل المعاملة الجارية Transaction Client]
    TxService -->|لا توجد معاملة؟| RegularClient[مسبح الاتصالات العام Regular Pool]
```

---

## 2. المكونات الأساسية للحزمة (`packages/transaction`)

### 2.1 مزخرف الدوال `@Transactional()`
يحدد دالة خدمة التطبيق كحد لمعاملة ذرية (Atomic Boundary):
- إذا كانت هناك معاملة نشطة بالفعل في سلسلة الاستدعاء، يعيد المزخرف استخدام نفس العميل (إعادة استخدام متداخلة Re-entrant).
- إذا لم تكن هناك معاملة قائمة، يطلب معاملة جديدة عبر `TransactionFacade`.
- يتم اعتماد المعاملة (Commit) تلقائياً عند انتهاء الدالة بنجاح، ويتم التراجع عنها (Rollback) تلقائياً عند حدوث أي استثناء غير معالج.

```typescript
@Injectable()
export class ShipmentCommandService {
  @Transactional()
  private async persistShipment(
    tenantId: string,
    dto: CreateShipmentDto,
    prepared: PreparedParcel[],
    totalChargeableWeightKg: number,
  ): Promise<{ id: string }> {
    // كلا استدعاءي المستودع يتم تنفيذهما داخل نفس المعاملة تماماً
    const shipment = await this.commandRepository.create(...);
    for (const parcel of prepared) {
      await this.parcelCommandRepository.create(...);
    }
    return shipment;
  }
}
```

### 2.2 سياق المعاملة `TransactionContext` (`AsyncLocalStorage`)
يتتبع عميل معاملة Prisma النشط (`tx`) طوال سلسلة التنفيذ غير المتزامن. ونتيجة لذلك، لا تحتاج المستودعات إلى تمرير كائن `tx` كمعامل إضافي في توقيع دوالها.

### 2.3 خدمة الوكيل `TransactionalPrismaService`
كائن وسيط ذكي يُحقن في مستودعات الأوامر:
```typescript
@Injectable()
export class TransactionalPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  get client(): PrismaClient {
    const tx = TransactionContext.getClient();
    return (tx as PrismaClient) ?? this.prisma;
  }
}
```
عند استدعائه داخل نطاق `@Transactional()`، يُرجع `client` عميل المعاملة الجارية. وخلاف ذلك، يعود تلقائياً لمسبح اتصالات `PrismaService` العام.

### 2.4 حاوية المعاملات `TransactionContainer`
تطبيق لنمط محدد الخدمات (Service Locator) يتم تهيئته عند إقلاع التطبيق في `main.ts` (`TransactionContainer.setApp(app)`). يتيح هذا للمزخرف `@Transactional()` الوصول إلى `TransactionFacade` دون إجبار الخدمات على حقن `PrismaService` في مشيداتها.

---

## 3. قاعدة التصميم: المعاملات قصيرة المدى والتجهيز المسبق

تفرض المعمارية قاعدة ذهبية: **إبقاء المعاملات قصيرة قدر الإمكان** لتقليل فترة احتجاز اتصالات قاعدة البيانات وتفادي اختناقات الأقفال (Lock Contention).

### مثال: تدفق إنشاء الشحنة (`ShipmentCommandService.createShipment`)

```mermaid
sequenceDiagram
    autonumber
    participant Service as خدمة إنشاء الشحنة ShipmentCommandService
    participant OrgFacade as واجهة الفروع OrganizationFacade
    participant TenantFacade as واجهة المستأجر TenantFacade
    participant LabelGen as خدمة الملصقات LabelGeneratorService
    participant PDFGen as خدمة التصيير PdfGeneratorService (Playwright)
    participant Storage as مزود التخزين LocalStorageProvider
    participant DB as قاعدة البيانات (@Transactional)

    Note over Service: المرحلة 1: التحقق والعمليات الثقيلة (خارج المعاملة)
    Service->>OrgFacade: التحقق من وجود الفروع والوحدات
    Service->>TenantFacade: جلب إعدادات التسعير والتشغيل
    loop لكل طرد في الشحنة
        Service->>LabelGen: توليد كود HTML للملصق (الباركود وQR)
        Service->>PDFGen: تصيير ملف PDF عبر متصفح Chromium خفي
        Service->>Storage: حفظ ملف PDF على القرص وتوليد storage_key
    end

    Note over Service: المرحلة 2: الكتابة الذرية (داخل المعاملة)
    Service->>DB: بدء المعاملة Begin Transaction
    DB->>DB: إدراج سجل الشحنة customer_shipment
    DB->>DB: إدراج سجلات الطرود parcels وربط مفاتيح التخزين
    DB->>DB: تحديث حالة طلب الشحن إلى CONVERTED
    DB->>Service: تثبيت المعاملة Commit Transaction
```

**أهمية هذا الفصل**:
- تصيير الملفات عبر Playwright وعمليات التخزين على القرص تستغرق زمناً غير متوقع (I/O Latency).
- لو نُفذت هذه العمليات الثقيلة داخل معاملة قاعدة بيانات مفتوحة، لنفدت اتصالات مسبح قاعدة البيانات فورياً عند أول ضغط تشغيلي.
- بتجهيز الملفات مسبقاً، تفتح المعاملة فقط لبضعة أجزاء من الألف من الثانية لإنجاز عمليات الإدراج السريعة.
