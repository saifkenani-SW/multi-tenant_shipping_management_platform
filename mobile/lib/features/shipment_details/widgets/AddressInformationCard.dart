
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class AddressInformationCard extends StatelessWidget {
  const AddressInformationCard({super.key});

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
            'Address Information',
            style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite),
          ),
          SizedBox(height: 16.h),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 32.w,
                    height: 32.h,
                    decoration: BoxDecoration(
                      color: AppColorsDark.accentBlue.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.upload_outlined, size: 16.sp, color: AppColorsDark.accentBlue),
                  ),
                  Container(
                    width: 2.w,
                    height: 35.h,
                    color: AppColorsDark.textGrey.withOpacity(0.3),
                  ),
                ],
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('SENDER', style: TextStyle(fontSize: 9.sp, color: AppColorsDark.textGrey, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2.h),
                    Text('Sarah Mitchell', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                    SizedBox(height: 2.h),
                    Text('842 Industrial Way, Suite 102\nAustin, TX 78744', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
                    SizedBox(height: 4.h),
                    Text('+1 (512) 555-0192', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.accentBlue, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32.w,
                height: 32.h,
                decoration: BoxDecoration(
                  color: AppColorsDark.accentBlue.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.download_outlined, size: 16.sp, color: AppColorsDark.accentBlue),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('RECEIVER', style: TextStyle(fontSize: 9.sp, color: AppColorsDark.textGrey, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2.h),
                    Text('Marcus Chen', style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite)),
                    SizedBox(height: 2.h),
                    Text('2190 West Olympic Blvd\nLos Angeles, CA 90006', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
                    SizedBox(height: 4.h),
                    Text('+1 (213) 555-0438', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.accentBlue, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
