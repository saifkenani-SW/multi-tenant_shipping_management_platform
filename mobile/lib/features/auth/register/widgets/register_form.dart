// ب) نموذج الإدخال (Form Fields & Actions)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/auth/providers/password_visibility_provider.dart';
import 'package:mobile/features/auth/register/providers/terms_check_box_provider.dart';

class RegisterForm extends ConsumerWidget {
  const RegisterForm({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isPasswordHidden = ref.watch(passwordVisibilityProvider);
    final isTermsAccepted = ref.watch(termsCheckboxProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // الاسم الأول والاسم الأخير في صف واحد للتجاوب
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('First Name', style: theme.textTheme.labelMedium),
                  SizedBox(height: 6.h),
                  const TextField(
                    keyboardType: TextInputType.name,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(hintText: 'John'),
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
                  const TextField(
                    keyboardType: TextInputType.name,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(hintText: 'Doe'),
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
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            hintText: '+1 (555) 000-0000',
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

        // زر إتمام التسجيل
        ElevatedButton(
          onPressed: () {
            GoRouter.of(context).pushNamed(AppRoutes.otpScreen);
          },
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Complete Registration'),
              SizedBox(width: 8.w),
              Icon(Icons.arrow_forward, size: 20.sp),
            ],
          ),
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
                  GoRouter.of(context).pushNamed(AppRoutes.loginScreen);
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
}
