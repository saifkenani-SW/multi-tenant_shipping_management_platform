

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/shipment_details/notifier/trackingStepsProvider.dart';

class TrackingNumberCard extends ConsumerWidget {
  const TrackingNumberCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final steps = ref.watch(trackingStepsProvider);

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
        border: Border(
          left: BorderSide(color: AppColorsDark.accentBlue, width: 4.w),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TRACKING NUMBER',
            style: TextStyle(fontSize: 10.sp, color: AppColorsDark.textGrey, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 4.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'EX-9402-1185-ZB',
                style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: AppColorsDark.accentBlue,
                  borderRadius: BorderRadius.circular(20.r),
                ),
                child: Row(
                  children: [
                    Icon(Icons.local_shipping, size: 14.sp, color: Colors.white),
                    SizedBox(width: 4.w),
                    Text(
                      'In Transit',
                      style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 20.h),
          ListView.builder(
            itemCount: steps.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              final step = steps[index];
              final isLast = index == steps.length - 1;

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 28.w,
                        height: 28.h,
                        decoration: BoxDecoration(
                          color: step.isCompleted ? AppColorsDark.accentBlue.withOpacity(0.2) : AppColorsDark.cardBg,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          step.isCompleted ? (step.isCurrent ? Icons.local_shipping : Icons.check) : Icons.home_outlined,
                          size: 14.sp,
                          color: step.isCompleted ? AppColorsDark.accentBlue : AppColorsDark.textGrey,
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2.w,
                          height: 30.h,
                          color: step.isCompleted ? AppColorsDark.accentBlue : AppColorsDark.textGrey.withOpacity(0.3),
                        ),
                    ],
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: isLast ? 0 : 16.h),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            step.title,
                            style: TextStyle(
                              fontSize: 13.sp,
                              fontWeight: FontWeight.bold,
                              color: step.isCompleted ? AppColorsDark.textWhite : AppColorsDark.textGrey,
                            ),
                          ),
                          SizedBox(height: 2.h),
                          Text(
                            step.subtitle,
                            style: TextStyle(fontSize: 11.sp, color: AppColorsDark.textGrey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
