// ج) معلومات المرسل
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';


// أ) قسم معلومات الطرد
class ParcelInfoSection extends StatelessWidget {
  const ParcelInfoSection({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                'معلومات الطرد',
                style: TextStyle(
                  fontSize: 15.sp,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              SizedBox(width: 8.w),
              Icon(
                Icons.inventory_2_outlined,
                color: theme.colorScheme.primary,
                size: 20.sp,
              ),
            ],
          ),
          SizedBox(height: 14.h),
          Text(
            'الوزن (كجم)',
            style: TextStyle(
              fontSize: 12.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 6.h),
          const TextField(
            textAlign: TextAlign.right,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(hintText: '0.0  KG'),
          ),
          SizedBox(height: 12.h),
          Text(
            'الأبعاد (طول × عرض × ارتفاع)',
            style: TextStyle(
              fontSize: 12.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 6.h),
          const TextField(
            textAlign: TextAlign.right,
            decoration: InputDecoration(
              hintText: '10×10×10',
              prefixIcon: Icon(Icons.straighten),
            ),
          ),
        ],
      ),
    );
  }
}
