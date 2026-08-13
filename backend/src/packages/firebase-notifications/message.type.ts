/**
 * 📌 هذا الملف هو الشيء الوحيد اللي المفروض تعدله لما تنسخ الباكج لمشروع جديد.
 * باقي ملفات الباكج ثابتة وما بتتغير — فقط شكل الرسالة (Message Shape) يختلف
 * حسب طبيعة كل مشروع.
 *
 * This is the ONLY file you should edit when copying this package into a new
 * project. Everything else stays untouched — only the message shape changes.
 */

export interface INotificationMessage {
  /** عنوان الإشعار — Notification title */
  title: string;

  /** نص الإشعار — Notification body */
  body: string;

  /** رابط صورة اختياري تظهر مع الإشعار — Optional image shown with the notification */
  imageUrl?: string;

  /**
   * بيانات إضافية ترسل مع الإشعار (deep link, entity id, type...)
   * ⚠️ Firebase (FCM) بيشترط كل القيم تكون string
   *
   * Extra payload sent with the notification (deep link, entity id, type...)
   * ⚠️ FCM requires every value here to be a string
   */
  data?: Record<string, string>;
}

/**
 * أنواع الإشعارات في منصة الشحن — تُضاف في حقل data.type داخل الرسالة
 * لكي يعرف التطبيق إلى أي شاشة يتوجه عند فتح الإشعار.
 *
 * Notification types for the shipping platform — added to data.type
 * so the app knows which screen to navigate to when the notification is opened.
 */
export enum NotificationType {
  // طلب الشحن — Shipment Request
  SHIPMENT_REQUEST_RECEIVED = 'SHIPMENT_REQUEST_RECEIVED',
  SHIPMENT_REQUEST_ACCEPTED = 'SHIPMENT_REQUEST_ACCEPTED',
  SHIPMENT_REQUEST_REJECTED = 'SHIPMENT_REQUEST_REJECTED',

  // عرض السعر — Quotation
  QUOTATION_RECEIVED = 'QUOTATION_RECEIVED',
  QUOTATION_APPROVED = 'QUOTATION_APPROVED',
  QUOTATION_PRICE_SUBMITTED = 'QUOTATION_PRICE_SUBMITTED',

  // الشحنة — Shipment
  SHIPMENT_CREATED = 'SHIPMENT_CREATED',
  SHIPMENT_STATUS_CHANGED = 'SHIPMENT_STATUS_CHANGED',
  SHIPMENT_DELIVERED = 'SHIPMENT_DELIVERED',
  SHIPMENT_CANCELLED = 'SHIPMENT_CANCELLED',

  // الطرد — Parcel
  PARCEL_STATUS_CHANGED = 'PARCEL_STATUS_CHANGED',
}
