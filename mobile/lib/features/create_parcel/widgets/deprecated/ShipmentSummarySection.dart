
// 6. ملخص الشحنة
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class ShipmentSummarySection extends StatelessWidget {
  const ShipmentSummarySection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: AppColorsDark.accentBlue.withOpacity(0.3)),
      ),
      padding: EdgeInsets.all(16.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('ملخص الشحنة', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
              Container(
                padding: EdgeInsets.all(8.w),
                decoration: BoxDecoration(
                  color: AppColorsDark.accentBlue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Icon(Icons.description_outlined, color: AppColorsDark.accentBlue, size: 20.sp),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
            decoration: BoxDecoration(
              color: AppColorsDark.accentBlue.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Text('إلكترونيات 1 x', style: TextStyle(fontSize: 11.sp, color: AppColorsDark.accentBlue, fontWeight: FontWeight.bold)),
          ),
          SizedBox(height: 16.h),
          const Divider(color: Colors.white10),
          SizedBox(height: 8.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Column(
                children: [
                  Text('إجمالي الوزن', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
                  SizedBox(height: 4.h),
                  Text('KG 0.0', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                ],
              ),
              Container(width: 1, height: 30.h, color: Colors.white10),
              Column(
                children: [
                  Text('عدد الأصناف', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
                  SizedBox(height: 4.h),
                  Text('1', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
