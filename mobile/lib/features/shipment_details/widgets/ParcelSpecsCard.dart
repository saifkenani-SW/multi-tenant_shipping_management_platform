

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class ParcelSpecsCard extends StatelessWidget {
  const ParcelSpecsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Parcel Specs',
            style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite),
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(child: _buildSpecBox('Weight', '2.45 kg')),
              SizedBox(width: 8.w),
              Expanded(child: _buildSpecBox('Dimensions', '30×20×15 cm')),
              SizedBox(width: 8.w),
              Expanded(child: _buildSpecBox('Service', 'Express')),
            ],
          ),
          SizedBox(height: 16.h),
          Text(
            'Contents',
            style: TextStyle(fontSize: 10.sp, color: AppColorsDark.textGrey, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 4.h),
          Text(
            'Consumer Electronics (Wireless Headphones, USB-C Cables)',
            style: TextStyle(fontSize: 13.sp, color: AppColorsDark.textWhite, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecBox(String title, String value) {
    return Container(
      padding: EdgeInsets.all(10.w),
      decoration: BoxDecoration(
        color: AppColorsDark.primaryBg,
        borderRadius: BorderRadius.circular(10.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 10.sp, color: AppColorsDark.textGrey)),
          SizedBox(height: 4.h),
          Text(value, style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
        ],
      ),
    );
  }
}
