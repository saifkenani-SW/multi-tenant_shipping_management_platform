// 1. إجمالي مواصفات الشحنة

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/create_parcel/repository/create_parcel_controller.dart';
import 'package:mobile/features/create_parcel/widgets/CardContainer.dart';

class TotalPackageSpecsSection extends StatelessWidget {
  final CreateParcelController controllers;
  const TotalPackageSpecsSection({super.key, required this.controllers});

  @override
  Widget build(BuildContext context) {
    return CardContainer(
      borderColor: AppColorsDark.accentBlue,
      title: 'إجمالي مواصفات الشحنة',
      icon: Icons.inventory_2_outlined,
      iconColor: AppColorsDark.accentBlue,
      
      children: [
        Text(
          'الوزن الكلي (كجم)',
          style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
        ),
        SizedBox(height: 8.h),
        TextField(
          decoration: const InputDecoration(hintText: '0.0'),
          keyboardType: TextInputType.number,
                          controller: controllers.weightController,

        ),
        SizedBox(height: 12.h),
        Text(
          'أبعاد الشحنة التقديرية',
          style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
        ),
        SizedBox(height: 8.h),
        Row(
          children: [
          
            Expanded(
              child: TextField(
                decoration: const InputDecoration(hintText: 'الطول'),
                keyboardType: TextInputType.number,
                controller: controllers.lengthController,
              ),
            ),
            SizedBox(width: 8.w),
            Expanded(
              child: TextField(
                decoration: const InputDecoration(hintText: 'العرض'),
                keyboardType: TextInputType.number,
                controller: controllers.widthController,

              ),
            ),
            SizedBox(width: 8.w),
            Expanded(
              child: TextField(
                decoration: const InputDecoration(hintText: 'الارتفاع'),
                keyboardType: TextInputType.number,
                                controller: controllers.heightController,

              ),
            ),
            SizedBox(width: 8.w),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
              decoration: BoxDecoration(
                color: AppColorsDark.cardBg,
                borderRadius: BorderRadius.circular(12.r),
                border: Border.all(color: AppColorsDark.accentBlue),
              ),
              child: Text(
                'CM',
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: AppColorsDark.accentBlue,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 12.h),
        Text(
          'عدد العناصر',
          style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
        ),
        TextField(
          decoration: const InputDecoration(hintText: '0.0'),
          keyboardType: TextInputType.number,
                          controller: controllers.piecesController,

        ),
      ],
    );
  }
}
