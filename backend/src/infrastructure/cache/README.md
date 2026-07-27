# Cache Decorators

توفر هذه المكتبة Decorators لتطبيق نمط **Cache-Aside** بطريقة بسيطة، مع إبقاء منطق التخزين داخل مزود الـ Cache (Redis أو In-Memory).

---

# المتطلبات

يجب استيراد `CacheModule` داخل الـ Module الذي سيستخدم الـ Decorators.

---

# Cacheable

يقوم بتخزين نتيجة الدالة داخل الـ Cache.

عند استدعاء الدالة:

1. يحاول قراءة القيمة من الـ Cache.
2. إذا وجدها يعيدها مباشرة.
3. إذا لم يجدها ينفذ الدالة الأصلية.
4. يخزن النتيجة.
5. يعيدها للمستدعي.

يدعم استراتيجيتين:

- SINGLE
- MANY

---

# استراتيجية SINGLE

تستخدم عندما تعيد الدالة **عنصرًا واحدًا**.

## مثال بسيط

```ts
@Cacheable({
    keyBuilder: (id: string) => ['users', id],
})
async findById(id: string) {
    return this.userRepository.findById(id);
}
```

سينتج المفتاح:

```
users:123
```

---

## مثال بعدة معاملات

```ts
@Cacheable({
    keyBuilder: (
        tenantId: string,
        userId: string,
        language: string,
    ) => ['users', tenantId, userId, language],
})
async findOne(
    tenantId: string,
    userId: string,
    language: string,
) {
    ...
}
```

المفتاح الناتج:

```
users:tenant-1:42:ar
```

---

## مثال باستخدام UUID

```ts
@Cacheable({
    keyBuilder: (
        companyId: string,
        employeeId: string,
    ) => ['employees', companyId, employeeId],
})
async findEmployee(
    companyId: string,
    employeeId: string,
) {
    ...
}
```

المفتاح:

```
employees:f4c8...:97aa...
```

---

# استراتيجية MANY

تستخدم عندما تعيد الدالة **مجموعة عناصر**.

بدلاً من تخزين القائمة كاملة داخل مفتاح واحد، يتم تخزين **كل عنصر داخل مفتاح مستقل**.

وهذا يسمح بإعادة استخدام العناصر لاحقًا.

---

## مثال

نفترض أن لدينا:

```ts
async findMany(ids: string[])
```

وترجع:

```ts
[
    {
        id: '1',
        name: 'Ali',
    },
    {
        id: '2',
        name: 'Omar',
    },
]
```

يمكن كتابة:

```ts
@Cacheable({
    strategy: CacheStrategy.MANY,

    keyPrefix: 'users',

    ids: (ids: string[]) => ids,

    loader: (args, missingIds) => [missingIds],
})
async findMany(ids: string[]) {
    return this.userRepository.findMany(ids);
}
```

سيتم إنشاء المفاتيح التالية:

```
users:1

users:2
```

وليس:

```
users:[1,2]
```

---

## مثال بعدة معاملات

```ts
@Cacheable({
    strategy: CacheStrategy.MANY,

    keyPrefix: 'employees',

    ids: (
        companyId: string,
        ids: string[],
        language: string,
    ) => ids,

    loader: (
        args,
        missingIds,
    ) => [
        args[0],
        missingIds,
        args[2],
    ],
})
async findMany(
    companyId: string,
    ids: string[],
    language: string,
) {
    ...
}
```

إذا تم استدعاء:

```ts
findMany(
    'company-1',
    ['10', '20', '30'],
    'ar',
)
```

فسيتم إنشاء:

```
employees:10

employees:20

employees:30
```

وعند وجود:

```
employees:10
```

داخل الـ Cache، سيتم استدعاء الدالة الأصلية فقط من أجل:

```
20

30
```

وسيصبح الاستدعاء الفعلي:

```ts
findMany(
    'company-1',
    ['20', '30'],
    'ar',
)
```

---

# keyPrefix

يستخدم مع استراتيجية MANY.

يمثل الجزء الثابت من المفتاح.

مثال:

```ts
keyPrefix: 'users'
```

يعطي:

```
users:1

users:2

users:3
```

---

# keyBuilder

يستخدم مع استراتيجية SINGLE.

يبني أجزاء المفتاح بالكامل.

مثال:

```ts
keyBuilder: (
    tenantId,
    id,
    language,
) => [
    'users',
    tenantId,
    id,
    language,
]
```

الناتج:

```
users:tenant-1:15:ar
```

---

# ids

يستخدم فقط مع استراتيجية MANY.

وظيفته استخراج معرفات العناصر من معاملات الدالة.

مثال:

```ts
ids: (
    companyId,
    ids,
    language,
) => ids
```

---

# loader

يستخدم فقط مع استراتيجية MANY.

عند وجود بعض العناصر داخل الـ Cache، فإن المكتبة تستدعي الدالة الأصلية فقط للعناصر غير الموجودة.

ولهذا يجب إعادة بناء معاملات الدالة.

مثال:

```ts
loader: (
    args,
    missingIds,
) => [
    args[0],
    missingIds,
    args[2],
]
```

إذا كانت معاملات الدالة:

```ts
(
    companyId,
    ids,
    language,
)
```

وكانت:

```
ids

=

[1,2,3]
```

والموجود داخل الـ Cache هو:

```
1
```

فإن الدالة الأصلية ستصبح:

```ts
(
    companyId,
    [2,3],
    language,
)
```

بدلاً من:

```ts
(
    companyId,
    [1,2,3],
    language,
)
```

وبذلك يتم تحميل العناصر الناقصة فقط.

---

# CacheEvict

يحذف قيمة من الـ Cache بعد تنفيذ العملية.

مثال:

```ts
@CacheEvict({
    keyBuilder: (id: string) => ['users', id],
})
async update(id: string) {
    ...
}
```

بعد نجاح العملية سيتم حذف:

```
users:123
```

---

# CacheEvictByPrefix

لحذف جميع المفاتيح التي تبدأ بنفس البادئة.

مثال:

```ts
await cacheFacade.evictByPrefix('users');
```

سيحذف:

```
users:1

users:2

users:3

users:100
```

---

# ملاحظات

- لا يحتوي الـ Decorator على أي منطق خاص بـ Redis.
- لا يقوم الـ Decorator ببناء المفاتيح.
- لا يطبق الـ Decorator نمط Cache-Aside.
- جميع منطق التخزين موجود داخل `ICacheProvider`.
- جميع منطق بناء المفاتيح موجود داخل `CacheFacade`.
- يمكن استبدال Redis بأي مزود آخر دون تعديل الـ Decorators.