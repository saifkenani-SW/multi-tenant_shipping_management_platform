# Firebase Notifications Package

باكج داخلي (مو منشور على npm) — الهدف منه فصل منطق إشعارات Firebase عن طبقة
الـ Infrastructure وجعله قابل لإعادة الاستخدام بين المشاريع عن طريق نسخ المجلد فقط.

## البنية

```
firebase-notifications/
├── message.type.ts                    🔧 يتغيّر — شكل الرسالة
├── topic-builder.ts                   🔧 يتغيّر — أسماء التوبيكات الخاصة بمشروعك
├── firebase-notification.config.ts    ثابت — Interface إعدادات الاتصال
├── firebase-notification.constants.ts ثابت — DI Token
├── chunk.util.ts                      ثابت — تقسيم المصفوفات لدفعات
├── firebase-notification.service.ts   ثابت — منطق الإرسال والاشتراك بالتوبيكات
├── firebase-notification.module.ts    ثابت — forRoot() Dynamic Module
└── index.ts                           ثابت — Barrel export
```

## طريقة الاستخدام (Copy-Paste)

1. انسخ مجلد `firebase-notifications/` كامل إلى `src/packages/` (أو `libs/`) بالمشروع الجديد.
2. عدّل `message.type.ts` ليعكس شكل الرسالة الخاص بالمشروع.
3. عدّل `topic-builder.ts` (اختياري) لتعريف الـ `Topics` الجاهزة الخاصة بالمشروع.
4. سجّل الموديول مرة وحدة بالـ `AppModule`:

```ts
FirebaseNotificationModule.forRoot({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
})
```

5. حقن `FirebaseNotificationService` بأي مكان تحتاجه.

### إرسال لجهاز أو عدة أجهزة

```ts
await firebaseNotificationService.sendToToken(token, {
  title: 'Shipment Update',
  body: 'Your shipment status changed',
  data: { shipmentId: '123' },
});

// يقسّم تلقائيًا لدفعات ≤500 توكن (حد Firebase) ويجمع النتيجة
await firebaseNotificationService.sendToTokens(tokens, message);
```

### التوبيكات (Topics)

Firebase ما عنده مفهوم "إنشاء توبيك" منفصل — التوبيك بيتفعّل تلقائيًا بمجرد
اشتراك أول جهاز فيه. استخدم `buildTopic()` لبناء أسماء موحّدة:

```ts
await firebaseNotificationService.subscribeToTopic(
  [deviceToken],
  buildTopic('tenant', tenantId, 'admin'),
);

await firebaseNotificationService.sendToTopic(
  buildTopic('tenant', tenantId, 'branch', branchId),
  { title: 'شحنة جديدة', body: 'وصلت شحنة لفرعك' },
);

// نقل جهاز من فرع لفرع بخطوة وحدة (إلغاء اشتراك + اشتراك جديد بالتوازي)
await firebaseNotificationService.switchTopic(
  [deviceToken],
  buildTopic('tenant', tenantId, 'branch', oldBranchId),
  buildTopic('tenant', tenantId, 'branch', newBranchId),
);
```

⚠️ الاشتراك/إلغاء الاشتراك بالتوبيك مسؤوليتك — لازم تستدعي
`unsubscribeFromTopic` عند logout أو تغيير فرع الموظف، وإلا رح يستمر يوصله
إشعارات مش له. `subscribeToTopic`/`unsubscribeFromTopic`/`sendToTokens` كلها
بتقسّم القوائم الكبيرة تلقائيًا لدفعات ضمن حدود Firebase (500 للإرسال، 1000
للتوبيكات) — ما تحتاج تعمل batching يدوي.

## Dependency

```
npm install firebase-admin
```

## ثابت مقابل متغيّر (Fixed vs. Changeable)

| الملف | يتغير بين المشاريع؟ |
|---|---|
| `message.type.ts` | ✅ نعم — شكل الرسالة |
| `topic-builder.ts` | ✅ نعم — الـ `Topics` الجاهزة (دالة `buildTopic` نفسها ثابتة) |
| كل باقي الملفات | ❌ لا — ثابتة تمامًا |
