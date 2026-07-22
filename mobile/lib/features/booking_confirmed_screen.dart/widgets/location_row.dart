
// 5. صف الموقع (Location Row)
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class LocationRow extends StatelessWidget {
  final IconData icon;
  final String name;
  final String label;

  const LocationRow({super.key, required this.icon, required this.name, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.blue, size: 16.sp),
            SizedBox(width: 6.w),
            Text(name, style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w500, color: Colors.white)),
          ],
        ),
        Text(label, style: TextStyle(fontSize: 11.sp, color: Colors.grey.shade400)),
      ],
    );
  }
}
