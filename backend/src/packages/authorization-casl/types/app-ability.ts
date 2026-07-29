import { ForcedSubject, MongoAbility, Subject } from '@casl/ability';

/**
 * المواضيع تُسمّى بنصوص حرفية (مثل 'Tenant')، لكن فحص الشروط يحتاج
 * الكيان نفسه: `subject('Tenant', entity)` يرجّع الكيان موسوماً بـ
 * ForcedSubject لا نصاً.
 *
 * لذلك يقبل الاتحاد الشكلين معاً — الاسم وحده للفحص المجرد
 * (`can(View, 'Tenant')`)، والكيان الموسوم للفحص على صف بعينه.
 * بدون الشكل الثاني ترفض الترجمة كل استدعاء يمرّر كياناً.
 */
export type AppAbility<
  TAction extends string = string,
  TSubject extends Subject = Subject,
> = MongoAbility<
  [TAction, TSubject | ForcedSubject<Extract<TSubject, string>>]
>;
