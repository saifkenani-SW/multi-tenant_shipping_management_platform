# authorization-casl

Enterprise CASL integration for NestJS.

---

# Features

- Zero configuration discovery
- Automatic Ability registration
- Strongly typed Actions
- Strongly typed Subjects
- Generic ApplicationAbility
- Module isolation
- DDD friendly
- Clean Architecture friendly
- CASL integration
- Extensible

---

# Architecture Overview

(رسم ASCII)

+----------------------+
| Application          |
+----------------------+
|
|
+----------------------+
| authorization-casl   |
+----------------------+
|
|
+----------------------+
| CASL                 |
+----------------------+

---

# Concepts

## Ability

...

## Contributor

...

## Subject

...

## Action

...

## ApplicationAbility

...

## Discovery

...

---

# Installation

npm install ...

---

# Registering the module

```ts
imports: [
    CaslModule,
]
```

شرح لماذا لا يحتاج Providers يدوياً.

---

# Project Structure

src/

authorization/
application-actions.ts
application-subjects.ts
application-ability.ts

modules/
tenant/
authorization/

actions/
subjects/
abilities/
policies/
scopes/

---

# Creating Actions

```ts
export enum TenantAction {
...
}
```

---

# Creating Subjects

```ts
export const TenantSubject = 'Tenant' as const;
```

ولماذا لا نستعمل Entity.

---

# Creating ApplicationActions

```ts
export type ApplicationActions =
    TenantAction
  | CustomerAction
  | ParcelAction;
```

---

# Creating ApplicationSubjects

```ts
...
```

---

# Creating ApplicationAbility

```ts
export type ApplicationAbility =
    AppAbility<
        ApplicationActions,
        ApplicationSubjects
    >;
```

شرح لماذا يوجد هذا النوع.

---

# Creating an Ability Contributor

```ts
@Injectable()
@CaslContributor()
export class TenantAbility
implements CaslAbilityContributor<
    ApplicationAbility,
    Principal
>{
...
}
```

ثم شرح Discovery بالكامل.

---

# Ability Discovery

كيف تعمل:

1.
DiscoveryService

↓

2.
يعثر على جميع

@CaslContributor()

↓

3.
يسجلها

↓

4.
AbilityFactory يناديها

---

# Ability Factory

كيف يتم بناء Ability.

رسم كامل.

---

# Ability Lifecycle

Principal

↓

AbilityFactory

↓

Contributor 1

↓

Contributor 2

↓

Contributor 3

↓

MongoAbility

---

# Using the Ability

```ts
ability.can(...)
```

---

# Policies

الفرق بين Policy و Ability.

لماذا Policy ليست Contributor.

---

# Visibility Scope

ما هو؟

متى يستخدم؟

---

# Best Practices

- Action per aggregate
- Subject per aggregate
- Don't use entities as subjects
- Keep contributors small
- One contributor per module

---

# FAQ

لماذا لا نستعمل Entity؟

لماذا يوجد ApplicationAbility؟

لماذا يوجد Contributor؟

لماذا Discovery؟

لماذا Generic؟

هل أستطيع إضافة أكثر من Contributor؟

هل أستطيع إنشاء Ability يدوياً؟

---

# Sequence Diagram

Application

↓

AbilityFactory

↓

Discovery

↓

Contributor

↓

CASL

↓

Ability

---

# Complete Example

هيكل مشروع كامل.
