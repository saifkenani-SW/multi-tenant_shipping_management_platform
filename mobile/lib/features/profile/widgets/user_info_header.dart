// ================= UI Components =================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/profile/notifier/profile_notifier.dart';
import 'package:mobile/features/profile/widgets/profile_image.dart';

// 1. رأس الملف الشخصي (الصورة والاسم والبريد)
class UserInfoHeader extends ConsumerWidget {
  const UserInfoHeader({super.key});

  @override
  Widget build(BuildContext context, ref) {
    final profile = ref.watch(profileNotifierProvider);
    return Column(
      children: [
        ProfileImage(),
        SizedBox(height: 12.h),
        Text(
          profile.value == null ? " " : profile.value!.fullName,
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
            color: AppColorsDark.cardBg,
          ),
        ),
        SizedBox(height: 4.h),
        Text(
          profile.value == null ? " " : profile.value!.email,
          style: TextStyle(fontSize: 14.sp, color: AppColorsDark.textGrey),
        ),
        Text(
          profile.value == null ? " " : profile.value!.phone,
          style: TextStyle(fontSize: 14.sp, color: AppColorsDark.textGrey),
        ),
      ],
    );
  }
}
