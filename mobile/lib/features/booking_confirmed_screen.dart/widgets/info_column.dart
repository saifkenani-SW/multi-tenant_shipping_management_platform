// 4. عمود المعلومات الثنائي (Info Column)
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class InfoColumn extends StatelessWidget {
  final String title;
  final String value;
  final CrossAxisAlignment alignment;

  const InfoColumn({super.key, required this.title, required this.value, this.alignment = CrossAxisAlignment.start});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: alignment,
      children: [
        Text(title, style: TextStyle(fontSize: 11.sp, color: Colors.grey.shade400)),
        SizedBox(height: 4.h),
        Text(value, style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.bold, color: Colors.white)),
      ],
    );
  }
}
