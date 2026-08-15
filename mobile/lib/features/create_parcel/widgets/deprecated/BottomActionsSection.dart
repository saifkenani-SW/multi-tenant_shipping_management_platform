// 7. الأزرار السفلية
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/core/theme/app_colors.dart';

class BottomActionsSection extends StatelessWidget {
  const BottomActionsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              flex: 1,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  minimumSize: Size(double.infinity, 50.h),
                  side: const BorderSide(color: AppColorsDark.accentBlue),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                ),
                onPressed: () {},
                child: Text(
                  'حفظ كمسودة',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: AppColorsDark.accentBlue,
                  ),
                ),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () {
                  GoRouter.of(
                    context,
                  ).pushNamed(AppRoutes.shippingCompaniesScreen);
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search, size: 20.sp),
                    SizedBox(width: 8.w),
                    const Text('البحث عن شركات الشحن'),
                  ],
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 12.h),
        TextButton.icon(
          onPressed: () {},
          icon: Icon(Icons.refresh, size: 16.sp, color: AppColorsDark.textGrey),
          label: Text(
            'إعادة تعيين الحقول',
            style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
          ),
        ),
      ],
    );
  }
}
