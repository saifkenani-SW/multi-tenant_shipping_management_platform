import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/register/register_dto.dart';
import 'package:mobile/features/auth/repository/auth_repository.dart';

class AuthNotifier extends AsyncNotifier<RegisterDto?> {
  @override
  RegisterDto? build() {
    // الحالة المبدئية لا يوجد مستخدم مسجل بعد
    return null;
  }

  // الدالة التي يتم استدعاؤها عند الضغط على زر التسجيل
  Future<void> register(String name, String email, String phone, String password) async {
    // 1. تعيين الحالة إلى وضع التحميل (Loading)
    state = const AsyncValue.loading();

    // 2. تنفيذ الطلب باستخدام AsyncValue.guard للتعامل الآمن مع الأخطاء try/catch
    state = await AsyncValue.guard(() async {

      await ref.read(authRepositoryProvider).register(name, email, phone, password);
    });
  }
}

// تعريف الـ Provider الرئيسي للـ Auth
final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, RegisterDto?>(() {
  return AuthNotifier();
});