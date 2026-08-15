// هـ) زر تأكيد الرمز
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/auth/otp/providers/otp_code_controller.dart';
import 'package:mobile/features/auth/otp/providers/verify_otp_notifier.dart';

class VerifyButton extends ConsumerWidget {
  final String email;
  const VerifyButton({super.key, required this.email});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(verifyOtpNotifierProvider, (previous, next) {
      next.whenData((data) {
        // نجح التسجيل: اعرض رسالة وانتقل
        _onOTPSuccess(context);
      });

      if (next.hasError && !next.isLoading) {
        _onOTPError(context, next.error.toString());
      }
    });

    final otpState = ref.watch(verifyOtpNotifierProvider);
    return ElevatedButton(
      onPressed: otpState.isLoading
          ? null
          : () => _submitForm(ref, context, email),
      child: otpState.isLoading
          ? const CircularProgressIndicator(color: Colors.white)
          : const Text('تأكيد الرمز'),
    );
  }

  void _submitForm(WidgetRef ref, BuildContext context, String email) {
    final otp = ref.read(pinCodeControllerProvider).code;

    ref.read(verifyOtpNotifierProvider.notifier).verifyOtp(email, otp);
  }

  void _onOTPSuccess(BuildContext context) {
    _showSnackBar(context, 'تم إنشاء الحساب بنجاح!', Colors.green);
    GoRouter.of(context).pushNamed(AppRoutes.loginScreen);
  }

  void _onOTPError(BuildContext context, String error) {
    _showSnackBar(context, 'فشل التسجيل: $error', Colors.red);
  }

  void _showSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));
  }
}
