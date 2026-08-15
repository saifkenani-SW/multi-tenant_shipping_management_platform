import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/auth/login/provider/login_notifier.dart';

// 5. زر تسجيل الخروج
class LogoutButton extends ConsumerWidget {
  const LogoutButton({super.key});

  @override
  Widget build(BuildContext context, ref) {
    ref.listen(loginNotifierProvider, (previous, next) {
      next.whenOrNull(
        data: (data) {
          context.goNamed(AppRoutes.loginScreen);
        },
        error: (error, stackTrace) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(error.toString())));
        },
      );
    });
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.deepOrange,
        foregroundColor: Colors.white,
        minimumSize: Size(double.infinity, 50.h),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.r),
        ),
      ),
      onPressed: () {
        ref.read(loginNotifierProvider.notifier).logOut();
      },
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'تسجيل الخروج',
            style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
          ),
          SizedBox(width: 8.w),
          const Icon(Icons.logout, size: 20),
        ],
      ),
    );
  }
}
