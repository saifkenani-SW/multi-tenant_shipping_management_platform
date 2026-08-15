
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class LiveTrackingMapCard extends StatelessWidget {
  const LiveTrackingMapCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              Image.network(
                'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600',
                height: 130.h,
                width: double.infinity,
                fit: BoxFit.cover,
                colorBlendMode: BlendMode.darken,
                color: Colors.black26,
              ),
              Container(
                padding: EdgeInsets.all(10.w),
                decoration: BoxDecoration(
                  color: AppColorsDark.accentBlue,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.map, color: Colors.white, size: 22.sp),
              ),
            ],
          ),
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Live Tracking',
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: AppColorsDark.textWhite),
                ),
                SizedBox(height: 4.h),
                Text(
                  'Last updated 2 mins ago in Riverside, CA.',
                  style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
                ),
                SizedBox(height: 12.h),
                SizedBox(
                  width: double.infinity,
                  height: 44.h,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColorsDark.accentBlue,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                    ),
                    child: Text(
                      'Track on Map',
                      style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
