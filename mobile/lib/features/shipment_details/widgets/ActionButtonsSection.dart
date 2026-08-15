
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

// ==============================================================================
class ActionButtonsSection extends StatelessWidget {
  const ActionButtonsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 50.h,
          child: ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.notifications_active_outlined, color: Colors.white),
            label: Text(
              'Get Delivery Updates',
              style: TextStyle(fontSize: 15.sp, color: Colors.white, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColorsDark.accentBlue,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
          ),
        ),
        SizedBox(height: 12.h),
        SizedBox(
          width: double.infinity,
          height: 50.h,
          child: OutlinedButton.icon(
            onPressed: () {},
            icon: Icon(Icons.description_outlined, color: AppColorsDark.accentBlue),
            label: Text(
              'Download Invoice',
              style: TextStyle(fontSize: 15.sp, color: AppColorsDark.textWhite, fontWeight: FontWeight.bold),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: AppColorsDark.accentBlue, width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
