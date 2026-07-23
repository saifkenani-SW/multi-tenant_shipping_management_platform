
// 2. رأس صفحة النجاح (Success Header)
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class SuccessHeaderWidget extends StatelessWidget {
  final String title;
  final String subtitle;

  const SuccessHeaderWidget({super.key, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Container(
            width: 60.w,
            height: 60.h,
            decoration: BoxDecoration(
              color: const Color(0xFF1867D2),
              borderRadius: BorderRadius.circular(16.r),
            ),
            child: Icon(Icons.check, color: Colors.white, size: 32.sp),
          ),
          SizedBox(height: 16.h),
          Text(title, style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.bold, color: Colors.white)),
          SizedBox(height: 6.h),
          Text(subtitle, style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade400)),
        ],
      ),
    );
  }
}

