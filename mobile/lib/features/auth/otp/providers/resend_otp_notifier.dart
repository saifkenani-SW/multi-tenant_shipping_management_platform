import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/register/register_dto.dart';
import 'package:mobile/features/auth/repository/auth_repository.dart';

class ResendOtpNotifier extends AsyncNotifier<RegisterDto?> {

  @override
  RegisterDto? build() {
    // الحالة المبدئية لا يوجد مستخدم مسجل بعد
    return null;
  }

  
  Future<void> resendOtp(String email)async {
    state = const AsyncValue.loading();

    state = await AsyncValue.guard(() async {
      await ref.read(authRepositoryProvider).resendOtp(email);
      return null;
    });
  }
}

// تعريف الـ Provider الرئيسي للـ Auth
final resendOtpNotifierProvider = AsyncNotifierProvider<ResendOtpNotifier, RegisterDto?>(() {
  return ResendOtpNotifier();
});