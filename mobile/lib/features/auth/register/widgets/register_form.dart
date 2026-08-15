import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/auth/providers/password_visibility_provider.dart';
import 'package:mobile/features/auth/register/providers/register_notifier.dart';
import 'package:mobile/features/auth/register/providers/register_controller.dart';
import 'package:mobile/features/auth/register/providers/terms_check_box_provider.dart';

class RegisterForm extends ConsumerWidget {
  const RegisterForm({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPasswordHidden = ref.watch(passwordVisibilityProvider);
    final isTermsAccepted = ref.watch(termsCheckboxProvider);
    final theme = Theme.of(context);
    final controllers = ref.watch(registerControllersProvider);

    // 1. الاستماع للأخطاء والنجاح بطريقة نظيفة
    ref.listen(authNotifierProvider, (previous, next) {
      next.whenData((data) {
        // if (data != null) {
        // نجح التسجيل: اعرض رسالة وانتقل
        log("message");
        _onRegisterSuccess(context, controllers.emailController.text.trim());
        // }
      });

      if (next.hasError && !next.isLoading) {
        _onRegisterError(context, next.error.toString());
      }
    });

    final authState = ref.watch(authNotifierProvider);

    return Column(
      children: [
        // ... (الحقول الخاصة بك كما هي تماماً دون أي تغيير) ...
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('First Name', style: theme.textTheme.labelMedium),
                  SizedBox(height: 6.h),
                  TextField(
                    controller: controllers.firstNameController,
                    keyboardType: TextInputType.name,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(hintText: 'John'),
                  ),
                ],
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Last Name', style: theme.textTheme.labelMedium),
                  SizedBox(height: 6.h),
                  TextField(
                    controller: controllers.lastNameController,
                    keyboardType: TextInputType.name,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(hintText: 'Doe'),
                  ),
                ],
              ),
            ),
          ],
        ),
        SizedBox(height: 16.h),

        // البريد الإلكتروني للعمل
        Text('Work Email', style: theme.textTheme.labelMedium),
        SizedBox(height: 6.h),
        TextField(
          controller: controllers.emailController,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            hintText: 'name@company.com',
            prefixIcon: Icon(
              Icons.email_outlined,
              size: 20.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        SizedBox(height: 16.h),

        // رقم الهاتف
        Text('Phone Number', style: theme.textTheme.labelMedium),
        SizedBox(height: 6.h),
        TextField(
          controller: controllers.phoneController,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            hintText: '',
            prefixIcon: Icon(
              Icons.phone_outlined,
              size: 20.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        SizedBox(height: 16.h),

        // كلمة المرور
        Text('Password', style: theme.textTheme.labelMedium),
        SizedBox(height: 6.h),
        TextField(
          controller: controllers.passwordController,
          obscureText: isPasswordHidden,
          keyboardType: TextInputType.visiblePassword,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: '••••••••',
            prefixIcon: Icon(
              Icons.lock_outline,
              size: 20.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            suffixIcon: IconButton(
              icon: Icon(
                isPasswordHidden
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                size: 20.sp,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              onPressed: () {
                ref.read(passwordVisibilityProvider.notifier).toggle();
              },
            ),
          ),
        ),
        SizedBox(height: 6.h),
        Text(
          'MUST BE AT LEAST 8 CHARACTERS WITH ONE SPECIAL SYMBOL',
          style: TextStyle(
            fontSize: 10.sp,
            color: theme.colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ),
        ),
        SizedBox(height: 16.h),

        // خانة الموافقة على الشروط
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              height: 24.w,
              width: 24.w,
              child: Checkbox(
                value: isTermsAccepted,
                onChanged: (value) {
                  ref.read(termsCheckboxProvider.notifier).toggle();
                },
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4.r),
                ),
              ),
            ),
            SizedBox(width: 10.w),
            Expanded(
              child: Wrap(
                children: [
                  Text(
                    'I agree to the ',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Text(
                      'Terms of Service',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    ' and ',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Text(
                      'Privacy Policy',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '.',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        SizedBox(height: 24.h),

        // زر التسجيل أصبح نظيفاً جداً وخالياً من التعقيد
        ElevatedButton(
          onPressed: authState.isLoading
              ? null
              : () => _submitForm(ref, context, isTermsAccepted, controllers),
          child: authState.isLoading
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text('Create Account'),
        ),

        SizedBox(height: 24.h),

        // تذييل الانتقال لتسجيل الدخول
        Center(
          child: Wrap(
            alignment: WrapAlignment.center,
            children: [
              Text(
                'Already have an industrial account? ',
                style: TextStyle(
                  fontSize: 13.sp,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              GestureDetector(
                onTap: () {
                  context.pushNamed(AppRoutes.loginScreen);
                },
                child: Text(
                  'Log in here',
                  style: TextStyle(
                    fontSize: 13.sp,
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // فصلنا الـ Logic في دوال مساعدة خارج بناء الواجهة (Helper Functions)
  void _submitForm(
    WidgetRef ref,
    BuildContext context,
    bool isTermsAccepted,
    RegisterControllers controllers,
  ) {
    if (!isTermsAccepted) {
      _showSnackBar(
        context,
        'الرجاء الموافقة على شروط الاستخدام أولاً',
        Colors.orange,
      );
      return;
    }

    String name =
        "${controllers.firstNameController.text.trim()} ${controllers.lastNameController.text.trim()}";
    String email = controllers.emailController.text.trim();
    String phone = controllers.phoneController.text.trim();
    String password = controllers.passwordController.text.trim();

    ref
        .read(authNotifierProvider.notifier)
        .register(name, email, phone, password);
  }

  void _onRegisterSuccess(BuildContext context, String email) {
    _showSnackBar(context, 'تم إنشاء الحساب بنجاح!', Colors.green);
    GoRouter.of(context).pushNamed(AppRoutes.otpScreen, extra: email);
  }

  void _onRegisterError(BuildContext context, String error) {
    _showSnackBar(context, 'فشل التسجيل: $error', Colors.red);
  }

  void _showSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));
  }
}
