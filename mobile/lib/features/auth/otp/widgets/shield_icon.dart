// أ) أيقونة الدرع في الأعلى
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ShieldIconHeader extends StatelessWidget {
  const ShieldIconHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 110.w,
      height: 110.h,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20.r),
      ),
      child: Center(
        child: Icon(
          Icons.verified_user_rounded,
          size: 54.sp,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }
}