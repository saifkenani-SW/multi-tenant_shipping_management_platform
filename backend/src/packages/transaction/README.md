# Transaction Package

حزمة مستقلة (Self-contained Package) مسؤولة عن إدارة الـ Transactions (معاملات قاعدة البيانات) في النظام، مبنية لتتوافق تماماً مع مبادئ النظافة المعمارية (Clean Architecture).

## الهدف من الحزمة

الهدف الرئيسي من هذا التصميم هو **عزل طبقة الخدمات (Application Services)** عن تفاصيل البنية التحتية لقاعدة البيانات (Infrastructure Layer).
سابقاً، كانت الخدمات تضطر إلى حقن كائن `PrismaService` داخل الـ Constructor فقط لكي يتمكن الـ Decorator `@Transactional()` من استخدامه. هذا كان يسبب تسريباً صريحاً لتفاصيل الـ ORM إلى طبقة الـ Domain والـ Application.

الآن، تم حل هذه المشكلة عبر تقديم نمط الحاوية (Container Pattern) مشابه تماماً لما هو مستخدم في حزمة الـ Authorization.

## المكونات الأساسية

1. **TransactionContainer**: حاوية عامة (Global Registry) يتم تهيئتها عند إقلاع التطبيق، وتحتفظ بنسخة من الـ `TransactionFacade`.
2. **TransactionFacade**: طبقة تغليف (Wrapper) تتعامل مباشرة مع `PrismaService` لفتح معاملة جديدة (`$transaction`).
3. **TransactionContext**: يستخدم `AsyncLocalStorage` لتتبع سياق المعاملة الحالية (Active Transaction) عبر الـ Call Stack بأكمله، مما يسمح للـ Repositories باستخدام نفس المعاملة دون الحاجة لتمرير الكائن كـ Parameter في كل دالة.
4. **@Transactional()**: مُزخرف (Decorator) يتم إضافته فوق الدوال التي تتطلب Atomic Transaction. يقوم بجلب الـ Facade من الـ Container تلقائياً.
5. **TransactionalPrismaService**: نسخة مخصصة من `PrismaService` تُستخدم داخل الـ Repositories لجلب سياق المعاملة الحالية إذا كانت موجودة، أو استخدام الاتصال العادي إذا لم تكن هناك معاملة مفتوحة.

---

## طريقة الإعداد (Setup)

### 1. في ملف الإقلاع `main.ts`
يجب تهيئة الـ `TransactionContainer` عند بدء تشغيل التطبيق حتى يتمكن من سحب الـ Providers من الـ DI Container الخاص بـ NestJS.

```typescript
import { TransactionContainer } from './packages/transaction';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // تهيئة حاوية المعاملات
  TransactionContainer.setApp(app);
  
  await app.listen(3000);
}
```

### 2. في الـ DatabaseModule
تأكد من توفير الـ `TransactionFacade` و `TransactionalPrismaService` كمزودات (Providers) وإضافتها في الـ `exports` لكي تكون متاحة لباقي وحدات النظام.

---

## طريقة الاستخدام في الخدمات (Application Services)

كل ما تحتاجه هو إضافة `@Transactional()` فوق الدالة. **لا داعي لحقن `PrismaService` أبداً.**

```typescript
import { Transactional } from '../../packages/transaction';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmployeeCommandService {
  constructor(
    private readonly employeeCommandRepository: IEmployeeCommandRepository,
    // لا تقم بحقن PrismaService هنا بعد الآن!
  ) {}

  @Transactional()
  async createEmployee(dto: CreateEmployeeDto) {
    // أي عمليات كتابة أو تعديل ستتم ضمن نفس الـ Transaction
    const employee = await this.employeeCommandRepository.create(dto);
    await this.employeeCommandRepository.assignRole(employee.id, dto.roleId);
    
    return employee;
  }
}
```

---

## كيفية التهيئة في بيئة الاختبار (Unit Tests)

نظراً لأن بيئة الـ Unit Tests المعزولة (باستخدام `Test.createTestingModule`) لا تقوم باستدعاء `main.ts`، فإن `TransactionContainer` لن يكون مهيأً، مما سيؤدي إلى ظهور الخطأ:
`TransactionContainer has not been initialized.`

لحل هذه المشكلة، يجب عمل Mock بسيط للحاوية في ملف الـ `.spec.ts` الخاص بالخدمة التي تستخدم `@Transactional()`، وذلك داخل الـ `beforeEach`:

```typescript
import { TransactionContainer } from '../../../../packages/transaction';

describe('EmployeeCommandService', () => {
  beforeEach(async () => {
    // 1. إضافة الـ Mock الخاص بالـ TransactionContainer
    jest.spyOn(TransactionContainer, 'get').mockReturnValue({
      execute: jest.fn(async (fn) => fn({})),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      // ...
    }).compile();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
```
