# منصة إدارة الشحن والخدمات اللوجستية متعددة المستأجرين (Multi-Tenant Shipping & Logistics Management Platform)

[English](README.md) | [العربية](README.ar.md)

منصة متكاملة لإدارة الشحن والطرود مبنية بنمط **المونويلث المعياري (Modular Monolith)** باستخدام **NestJS**، **PostgreSQL** (`postgis`، `ltree`)، **Prisma**، **Kysely**، و **Redis**.

تم تصميم النظام لعمليات الشحن متعددة المستأجرين (Multi-Tenant)، مع توفير حدود معمارية قائمة على النطاق (Domain-Driven Design) تشمل: استقبال طلبات الشحن، مصفوفات التسعير، بيانات الشحن والمنافست، التتبع الحي والتليماتكس للسائقين، والفوترة المالية.

---

## 🚀 القدرات المعمارية الأساسية

- **عزل المستأجرين (Multi-Tenant Isolation)**: فرض حدود عزل صارمة لبيانات المستأجرين عبر سياق الطلب (`AsyncLocalStorage`) ومحددات الرؤية الديناميكية (Visibility Scopes).
- **الوصول لقاعدة البيانات بنمط CQRS**: فصل طفرات الكتابة وحركات المعاملات (عبر Prisma) عن استعلامات القراءة المباشرة عالية الكفاءة (عبر Kysely).
- **شبكة لوجستية هرمية وجغرافية**: تمثيل الهيكل التنظيمي للمرافق باستخدام امتداد PostgreSQL `ltree`، ومعالجة الإحداثيات والنطاقات الجغرافية وتتبع الـ GPS عبر امتداد PostGIS.
- **آلة حالة محكمة مع التحكم بالتزامن (State Machine & OCC)**: إدارة دورة حياة الطرود والشحنات عبر آلة حالة دقيقة ومحمية من التعارض باستخدام التحكم المتفائل بالتزامن (Optimistic Concurrency Control) عبر عمود `version`.
- **محرك تسعير ديناميكي وعروض أسعار**: احتساب تكلفة الشحن بالاعتماد على مصفوفة المناطق (Zone-to-Zone)، الوزن الحجمي (Dimensional Weight)، ورسوم المناولة الخاصة، مع تجميد لقطة تسعيرية غير قابلة للتغيير (Frozen Pricing Snapshot) عند إنشاء عرض السعر.
- **تليماتكس وتتبع آني عالي التردد**: استقبال إحداثيات السائقين بتردد مرتفع عبر WebSockets، وتخزينها مؤقتاً في Redis (Write-Behind Buffering) ثم ترحيلها دورياً بدفعات إلى PostgreSQL عبر مجدول مهام (Cron Job).
- **توليد المستندات والملصقات اللوجستية**: إنشاء ملصقات الطرود بباركود Code-128 ورموز QR، وتوليد الفواتير ومستندات المنافست الرسمية بصيغة PDF عبر متصفح Chromium خفي (Playwright).

---

## 🏛 المعمارية العامة (High-Level Architecture)

تم بناء المنصة كـ **Modular Monolith**. يتم التواصل بين الموديولات حصراً من خلال واجهات موحدة (Facades) وأحداث النطاق (Domain Events)، مما يمنع تسريب المستودعات (Repositories) أو الكيانات (Entities) عبر حدود السياقات المقيدة (Bounded Contexts).

```text
عملاء HTTP / REST                               عملاء التتبع والسائقين
       │                                                   │
       ▼                                                   ▼
متحكمات Express                                   بوابة WebSocket
       │                                                   │
       └─────────────────────────┬─────────────────────────┘
                                 │
                                 ▼
                    طبقة خدمات التطبيق (Application)
       ┌─────────────────────────┴─────────────────────────┐
       │                                                   │
       ▼                                                   ▼
مسار الأوامر / الكتابة (Commands)              مسار الاستعلام / القراءة (Queries)
       │                                                   │
   Prisma ORM                                    Kysely Query Builder
(طفرات المعاملات والتحكم المتفائل OCC)             (استقراءات وتجميعات SQL مجهزة)
       │                                                   │
       └─────────────────────────┬─────────────────────────┘
                                 │
                                 ▼
                     قاعدة بيانات PostgreSQL 16
                (الجداول + امتدادات PostGIS و ltree)
```

---

## 🛠 حزمة التقنيات (Technology Stack)

| الطبقة | التقنيات المستخدمة |
|---|---|
| **بيئة التشغيل والإطار** | Node.js (v20+)، NestJS 11، TypeScript، RxJS، EventEmitter2 |
| **قواعد البيانات والتخزين المؤقت** | PostgreSQL 16 (`postgis`، `ltree`)، Redis 7 (`ioredis`) |
| **الاستدامة والبيانات (CQRS)** | Prisma ORM 7 (للكتابة)، Kysely 0.28 (للقراءة عبر `prisma-kysely`)، `pg` Pool |
| **الأمان وإدارة الصلاحيات** | JWT، تدوير الرموز (`user_session`)، محرك السياسات CASL 7، تشفير bcrypt |
| **التتبع اللحظي والتليماتكس** | Socket.io (`@socket.io/redis-adapter`)، مجدول المهام `@nestjs/schedule` |
| **المرونة والحماية** | قاطع الدائرة (`opossum`)، تحديد معدل الطلبات (`@nestjs/throttler`)، Helmet |
| **توليد المستندات** | Playwright (Chromium خفي لـ PDF)، `bwip-js` (الباركود)، `qrcode` (رموز QR) |
| **التخزين والإشعارات** | مزود تخزين محلي (مع تنظيف تلقائي للملفات المؤقتة)، Firebase Admin SDK (FCM) |
| **المراقبة والرصد (Observability)** | OpenTelemetry NodeSDK (`@prisma/instrumentation`)، `nestjs-pino` |

---

## 📦 نظرة عامة على الموديولات (Domain Modules)

```text
src/
├── modules/
│   ├── tenant/              # دورة حياة المستأجر، الإعدادات التشغيلية وإعدادات التوصيل
│   ├── subscription-plan/   # باقات SaaS، حصص الميزات (Quotas)، وسجل الاشتراكات
│   ├── auth/                # مصادقة JWT، تدوير الجلسات، والتبديل بين الحسابات
│   ├── user/ & profile/     # إدارة هويات المستخدمين والملفات الشخصية
│   ├── employee/            # تعيين الموظفين في الوحدات التنظيمية ومنح الأدوار
│   ├── authorization/       # الأدوار المقيدة بالمستأجر، الصلاحيات، وسياسات PBAC
│   ├── global-location/     # الهيكل الجغرافي والإداري (الدول والمدن عبر PostGIS)
│   ├── organization/        # شجرة المرافق والفروع (ltree: إقليم، مركز، فرع، خزانة)
│   ├── customer/            # ملفات العملاء وسجل العناوين الجغرافية
│   ├── shipment-request/    # استقبال طلبات الشحن، تسعير المناطق، وإصدار عروض الأسعار
│   ├── customer-shipment/   # تجمعات الشحنات والطرود، التحكم بالتزامن OCC، وإثبات التسليم POD
│   ├── fleet/               # المركبات، السائقين، الرحلات، ومنافست النقل
│   ├── tracking/            # سجل حركة الطرود (سلسلة الحيازة)، تليماتكس الـ WebSockets
│   ├── billing/             # تسلسل أرقام الفواتير الذري، المدفوعات، والدفع عند الاستلام COD
│   └── notification/        # تنبيهات متعددة القنوات (Push، داخل التطبيق، SMS، بريد)
└── packages/                # حزم البنية التحتية المنفصلة (context، pbac، tx، وغيرها)
```

---

## 🚀 البدء والتشغيل (Getting Started)

### 1. المتطلبات الأساسية
- **Node.js**: إصدار 20.x أو أحدث
- **Docker & Docker Compose**: مثبت ويعمل في بيئتك

### 2. تثبيت التبعيات وإعداد البيئة
```bash
# استنساخ المستودع
git clone git@github.com:saifkenani-SW/multi-tenant_shipping_management_platform.git
cd multi-tenant_shipping_management_platform/backend

# تثبيت الحزم
npm install

# إعداد ملف البيئة
cp .env.example .env

# تشغيل خوادم PostgreSQL (المنفذ 51214) و Redis (المنفذ 63791)
docker compose up -d
```

### 3. تهيئة وترحيل قاعدة البيانات
```bash
# توليد عميل Prisma وأنماط Kysely
npm run db:generate

# تنفيذ ترحيلات المخطط (Migrations)
npm run db:migrate:dev

# (اختياري) زراعة بيانات تجريبية أولية
npm run db:seed
```

### 4. تشغيل التطبيق
```bash
# تشغيل خادم التطوير مع إعادة التحميل التلقائي وتتبع OpenTelemetry
npm run start:dev

# بناء وتشغيل الحزمة الإنتاجية
npm run build
npm run start:prod
```

- **واجهة REST API**: `http://localhost:3000`
- **توثيق Swagger OpenAPI**: `http://localhost:3000/docs`
- **بوابة التتبع المباشر (WebSocket)**: `ws://localhost:3000/tracking`

---

## 🧪 الاختبارات (Testing)

```bash
# تشغيل اختبارات الوحدة (Unit tests)
npm run test

# تشغيل الاختبارات التكاملية الشاملة (E2E tests)
npm run test:e2e

# قياس نسبة تغطية الأكواد (Coverage audit)
npm run test:cov

# التحقق من تغطية وثائق Swagger OpenAPI
npm run test:swagger-coverage
```

---

## 📚 فهرس التوثيق التقني التفصيلي

تتوفر مستندات معمارية متعمقة وسجلات القرارات المعمارية (ADRs) داخل مجلد `docs/ar/`:

| المستند | الوصف |
|---|---|
| [معمارية النظام](docs/ar/architecture.md) | هيكلية المونويلث المعياري، حدود الموديولات، الطبقات، ودورة حياة الطلب. |
| [نموذج النطاق والتجمعات](docs/ar/domain-model.md) | تجمعات النطاق (Aggregates)، القواعد الثابتة (Invariants)، والكيانات. |
| [دورة حياة الشحنة](docs/ar/shipment-lifecycle.md) | آلة حالة الشحنة، مزامنة حالات الطرود، والتحكم المتفائل بالتزامن (OCC). |
| [طلبات الشحن والتسعير](docs/ar/shipment-request-and-quotation.md) | استقبال الطلبات، مصفوفة تسعير المناطق، الوزن القابل للفوترة، وعروض الأسعار. |
| [معمارية عزل المستأجرين](docs/ar/multi-tenancy.md) | تمرير سياق المستأجر عبر AsyncLocalStorage، مجالات الرؤية، وحالات الفشل المحتملة. |
| [التفويض وإدارة الصلاحيات (PBAC)](docs/ar/authorization.md) | نظام التحكم بالوصول المبني على السياسات، مزخرف `@Authorize`، وتكامل CASL. |
| [إدارة المعاملات وقواعد البيانات](docs/ar/transaction-management.md) | مزخرف `@Transactional`، نمط الحاوية، واستراتيجية المعاملات قصيرة المدى. |
| [نمط CQRS والوصول للبيانات](docs/ar/cqrs.md) | عمليات الكتابة عبر Prisma، واستعلامات القراءة عبر Kysely، وإدارة اتصالات المسبح. |
| [التتبع اللحظي وسلسلة الحيازة](docs/ar/tracking.md) | سجل حركة الطرود، بوابات الـ WebSockets، تخزين الإحداثيات المؤقت في Redis، وإثبات التسليم. |

### سجلات القرارات المعمارية (ADRs)
- [ADR-001: اعتماد معمارية المونويلث المعياري (Modular Monolith)](docs/ar/adr/001-modular-monolith.md)
- [ADR-002: استراتيجية الوصول المزدوج لقاعدة البيانات (Prisma للكتابة، Kysely للقراءة)](docs/ar/adr/002-prisma-writes-kysely-reads.md)
- [ADR-003: إدارة سياق المعاملات باستخدام AsyncLocalStorage](docs/ar/adr/003-transaction-context-with-async-local-storage.md)
- [ADR-004: التحكم بالوصول المبني على السياسات (PBAC) وتكامل CASL](docs/ar/adr/004-policy-based-authorization.md)
- [ADR-005: عزل المستأجرين عبر سياق الطلب و AsyncLocalStorage](docs/ar/adr/005-tenant-isolation-via-request-context.md)
- [ADR-006: التحكم المتفائل بالتزامن (OCC) للكيانات اللوجستية](docs/ar/adr/006-optimistic-concurrency-control.md)
- [ADR-007: التواصل بين الموديولات عبر الواجهات الموحدة (Facades)](docs/ar/adr/007-facade-based-inter-module-boundaries.md)
- [ADR-008: التخزين المؤقت للإحداثيات بنمط Write-Behind في Redis](docs/ar/adr/008-write-behind-gps-buffering.md)
