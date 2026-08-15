import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/shared/widgets/custom_password_text_field.dart';
import 'package:mobile/shared/widgets/custom_text_button.dart';
import 'package:mobile/shared/widgets/custom_text_field.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/features/auth/login/provider/login_controller.dart';
import 'package:mobile/features/auth/login/provider/login_notifier.dart';
import 'package:mobile/features/auth/providers/password_visibility_provider.dart';

class LoginFormCard extends ConsumerWidget {
  const LoginFormCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isPasswordHidden = ref.watch(passwordVisibilityProvider);

    final controllers = ref.watch(loginControllersProvider);

    ref.listen(loginNotifierProvider, (previous, next) {
      next.whenData((data) {
        _onLoginSuccess(context, controllers.emailController.text.trim());
      });

      if (next.hasError && !next.isLoading) {
        _onLoginError(context, next.error.toString());
      }
    });

    final authState = ref.watch(loginNotifierProvider);

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 400),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: EdgeInsets.all(24.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('EMAIL ADDRESS', style: theme.textTheme.labelSmall),
          SizedBox(height: 8.h),
          CustomTextField(
            controller: controllers.emailController,
            hintText: 'name@company.com',
            prefixIcon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),

          SizedBox(height: 24.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('PASSWORD', style: theme.textTheme.labelSmall),
              CustomTextButton(
                onPressed: () {},
                text: "Forgot?",
                style: theme.textTheme.labelSmall!,
              ),
            ],
          ),
          SizedBox(height: 8.h),
          CustomPasswordTextField(
            controller: controllers.passwordController,
            obscureText: isPasswordHidden,
            hintText: '••••••••',
            prefixIcon: Icons.lock_outline,
            keyboardType: TextInputType.visiblePassword,
            textInputAction: TextInputAction.done,
            onToggleVisibility: () {
              ref.read(passwordVisibilityProvider.notifier).toggle();
            },
          ),
          SizedBox(height: 32.h),

          PrimaryButton(
            onPressed: authState.isLoading
                ? null
                : () => _submitForm(ref, context, controllers),
            child: authState.isLoading
                ? const CircularProgressIndicator(color: Colors.white)
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('SIGN IN TO DASHBOARD'),
                      SizedBox(width: 12.w),
                      Icon(Icons.arrow_forward, size: 20.sp),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  void _submitForm(
    WidgetRef ref,
    BuildContext context,
    LoginController controllers,
  ) {
    String email = controllers.emailController.text.trim();
    String password = controllers.passwordController.text.trim();
    ref.read(loginNotifierProvider.notifier).login(email, password);
  }

  void _onLoginSuccess(BuildContext context, String email) {
    _showSnackBar(context, 'تم إنشاء الحساب بنجاح!', Colors.green);
    GoRouter.of(context).pushNamed(AppRoutes.homeScreen);
  }

  void _onLoginError(BuildContext context, String error) {
    log(error.toString());
    _showSnackBar(context, 'فشل التسجيل: $error', Colors.red);
  }

  void _showSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));
  }
}
