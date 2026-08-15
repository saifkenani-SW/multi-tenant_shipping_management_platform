// 4. بانر العروض (Promo Banner)
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';


class PromoBanner extends StatelessWidget {
  const PromoBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 150.h,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16.r),
        image: const DecorationImage(
          image: NetworkImage('https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(Colors.black45, BlendMode.darken),
        ),
      ),
      padding: EdgeInsets.all(16.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'أسرع خدمة توصيل',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
              color: AppColorsDark.textWhite,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            'اشحن طردك الآن واستلم في اليوم التالي',
            style: TextStyle(
              fontSize: 12.sp,
              color: AppColorsDark.textGrey,
            ),
          ),
          SizedBox(height: 12.h),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColorsDark.accentBlue,
              minimumSize: Size(100.w, 36.h),
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8.r),
              ),
            ),
            child: Text('اكتشف المزيد', style: TextStyle(fontSize: 12.sp, color: Colors.white)),
          ),
        ],
      ),
    );
  }
}