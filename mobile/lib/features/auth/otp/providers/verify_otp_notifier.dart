import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/register/register_dto.dart';
import 'package:mobile/features/auth/repository/auth_repository.dart';

class VerifyOtpNotifier extends AsyncNotifier<RegisterDto?> {

  @override
  RegisterDto? build() {
    // الحالة المبدئية لا يوجد مستخدم مسجل بعد
    return null;
  }

  // الدالة التي يتم استدعاؤها عند الضغط على زر التسجيل
  Future<void> verifyOtp(String email, String code) async {
    // 1. تعيين الحالة إلى وضع التحميل (Loading)
    state = const AsyncValue.loading();

    // 2. تنفيذ الطلب باستخدام AsyncValue.guard للتعامل الآمن مع الأخطاء try/catch
    state = await AsyncValue.guard(() async {
      await ref.read(authRepositoryProvider).verifyOtp(email, code);
      return null;

    });
  }
}

// تعريف الـ Provider الرئيسي للـ Auth
final verifyOtpNotifierProvider = AsyncNotifierProvider<VerifyOtpNotifier, RegisterDto?>(() {
  return VerifyOtpNotifier();
});