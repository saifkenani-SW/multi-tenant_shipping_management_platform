
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';


// عنوان القسم (مثل: إعدادات الحساب، التفضيلات، الدعم)
class SectionHeader extends StatelessWidget {
  final String title;
  const SectionHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13.sp,
          color: AppColorsDark.textGrey,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
