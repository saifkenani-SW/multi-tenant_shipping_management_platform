
// 1. حاوية البطاقات الموحدة (Reusable Card Container)
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppCardContainer extends StatelessWidget {
  final Widget child;
  const AppCardContainer({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: const Color(0xFF0D2137),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.3)),
      ),
      child: child,
    );
  }
}
