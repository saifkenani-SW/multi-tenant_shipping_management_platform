
// 6. حاوية رمز الاستجابة السريعة (QR Code Container)
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/app_card_container.dart';

class QrCodeContainerWidget extends StatelessWidget {
  final String instructionText;

  const QrCodeContainerWidget({super.key, required this.instructionText});

  @override
  Widget build(BuildContext context) {
    return AppCardContainer(
      child: Column(
        children: [
          Container(
            width: 180.w,
            height: 120.h,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Center(
              child: Icon(Icons.qr_code_2, size: 90.sp, color: Colors.black87),
            ),
          ),
          SizedBox(height: 16.h),
          Text(
            instructionText,
            style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.bold, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

