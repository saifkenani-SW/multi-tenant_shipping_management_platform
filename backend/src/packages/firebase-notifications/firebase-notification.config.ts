/**
 * إعدادات الاتصال بـ Firebase Admin SDK — ثابتة، ما بتتغير بين المشاريع.
 * Firebase Admin SDK credentials — fixed, does not change between projects.
 */
export interface FirebaseNotificationConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}
