import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/auth/login/widgets/bottomNavButtons.dart';
import 'package:mobile/features/auth/login/widgets/login_form.dart';
import 'package:mobile/features/auth/login/widgets/login_header.dart';
import 'package:mobile/features/auth/login/widgets/register_footer.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mediaQuery = MediaQuery.of(context);
    final isLandscape = mediaQuery.orientation == Orientation.landscape;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(height: isLandscape ? 20.h : 0),
                const LoginHeader(),
                SizedBox(height: isLandscape ? 30.h : 50.h),
                const LoginFormCard(),
                SizedBox(height: isLandscape ? 30.h : 40.h),
                const RegisterFooter(),
                SizedBox(height: isLandscape ? 20.h : 30.h),
              ],
            ),
          ),
        ),
      ),
      persistentFooterButtons: const [
        BottomNavButtons(),
      ],
    );
  }
}