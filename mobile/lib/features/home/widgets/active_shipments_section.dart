import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class ActiveShipmentsSection extends StatelessWidget {
  const ActiveShipmentsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'الشحنات النشطة',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.bold,
                color: AppColorsDark.textWhite,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: Text(
                'عرض الكل',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: AppColorsDark.accentBlue,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColorsDark.cardBg,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(color: AppColorsDark.accentBlue.withOpacity(0.5), width: 1.5),
          ),
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: AppColorsDark.accentBlue.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6.w,
                          height: 6.h,
                          decoration: const BoxDecoration(
                            color: AppColorsDark.accentBlue,
                            shape: BoxShape.circle,
                          ),
                        ),
                        SizedBox(width: 6.w),
                        Text(
                          'في الطريق',
                          style: TextStyle(fontSize: 10.sp, color: AppColorsDark.accentBlue, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    'رقم التتبع',
                    style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
                  ),
                ],
              ),
              SizedBox(height: 4.h),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'KP-12345#',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColorsDark.accentBlue,
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('الرياض', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8.w),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 2.h,
                              color: AppColorsDark.accentBlue,
                            ),
                          ),
                          Container(
                            padding: EdgeInsets.all(6.w),
                            decoration: const BoxDecoration(
                              color: AppColorsDark.accentBlue,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.local_shipping, size: 14.sp, color: Colors.white),
                          ),
                          Expanded(
                            child: Container(
                              height: 2.h,
                              color: AppColorsDark.textGrey.withOpacity(0.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Text('جدة', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                ],
              ),
              SizedBox(height: 16.h),
              const Divider(color: Colors.white10),
              SizedBox(height: 8.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'غداً، 12:00 م',
                    style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite),
                  ),
                  Text(
                    'موعد الوصول المتوقع',
                    style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
