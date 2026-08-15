// الحاوية الأساسية للعناصر (Card Container)
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class CardContainer extends StatelessWidget {
  final Color borderColor;
  final String title;
  final IconData icon;
  final Color iconColor;
  final Widget? trailing;
  final List<Widget> children;

  const CardContainer({
    super.key,
    required this.borderColor,
    required this.title,
    required this.icon,
    required this.iconColor,
    this.trailing,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColorsLight.textGrey,
        borderRadius: BorderRadius.circular(16.r),
        border: Border(
          right: BorderSide(color: borderColor, width: 4.w),
        ),
      ),
      padding: EdgeInsets.all(16.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(icon, color: iconColor, size: 20.sp),
                  SizedBox(width: 8.w),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.bold,
                      color: iconColor,
                    ),
                  ),
                ],
              ),
              if (trailing != null) trailing!,
            ],
          ),
          Divider(height: 24.h, thickness: 1, color: Colors.white10),
          ...children,
        ],
      ),
    );
  }
}
