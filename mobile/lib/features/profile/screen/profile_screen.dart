import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/profile/widgets/LogoutButton.dart';
import 'package:mobile/features/profile/widgets/PreferencesGroup.dart';
import 'package:mobile/features/profile/widgets/SectionHeader.dart';
import 'package:mobile/features/profile/widgets/SupportGroup.dart';
import 'package:mobile/features/profile/widgets/user_info_header.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        elevation: 0,

        title: Text(
          'Kinetic Post',
          style: TextStyle(
            fontSize: 18.sp,
            fontWeight: FontWeight.bold,
            color: AppColorsDark.cardBg,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
        child: Column(
          children: [
            const UserInfoHeader(),
            SizedBox(height: 24.h),

            // قسم إعدادات الحساب
            SizedBox(height: 16.h),

            // قسم التفضيلات
            const SectionHeader(title: 'التفضيلات'),
            SizedBox(height: 8.h),
            const PreferencesGroup(),
            SizedBox(height: 16.h),

            // قسم الدعم
            const SectionHeader(title: 'الدعم'),
            SizedBox(height: 8.h),
            const SupportGroup(),
            SizedBox(height: 24.h),

            // زر تسجيل الخروج
            const LogoutButton(),
            SizedBox(height: 20.h),
          ],
        ),
      ),
    );
  }
}
