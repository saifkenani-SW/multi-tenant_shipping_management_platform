

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class ShippingCarrierCard extends StatelessWidget {
  const ShippingCarrierCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Row(
        children: [
          Container(
            width: 44.w,
            height: 44.h,
            decoration: BoxDecoration(
              color: AppColorsDark.primaryBg,
              borderRadius: BorderRadius.circular(10.r),
            ),
            child: Icon(Icons.local_shipping_outlined, color: AppColorsDark.accentBlue, size: 22.sp),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('SHIPPING CARRIER', style: TextStyle(fontSize: 9.sp, color: AppColorsDark.textGrey, fontWeight: FontWeight.bold)),
                SizedBox(height: 2.h),
                Text('Velocity Logistics', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                SizedBox(height: 2.h),
                Text('Contact: support@velocity-logistics.com', style: TextStyle(fontSize: 11.sp, color: AppColorsDark.textGrey)),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.phone_outlined, color: AppColorsDark.accentBlue, size: 20.sp),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}
