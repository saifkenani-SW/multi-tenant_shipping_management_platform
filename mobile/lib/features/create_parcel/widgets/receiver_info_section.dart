// ج) معلومات المرسل
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';


// د) معلومات المستلم (مع الحدود البرتقالية المميزة كما في التصميم)
class ReceiverInfoSection extends StatelessWidget {
  const ReceiverInfoSection({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return // استبدل الـ Container القديم بهذا الشكل:
    ClipRRect(
      borderRadius: BorderRadius.circular(
        16.9,
      ), // نفس قيمة الحواف الدائرية التي أردتها
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0D2A53), // لون خلفية الكارد لديك
          border: Border(
            top: BorderSide(
              color: const Color(0xFF1867D2).withOpacity(0.30),
              width: 1.0,
            ),
            left: BorderSide(
              color: const Color(0xFF1867D2).withOpacity(0.30),
              width: 1.0,
            ),
            bottom: BorderSide(
              color: const Color(0xFF1867D2).withOpacity(0.30),
              width: 1.0,
            ),
            right: const BorderSide(
              color: Color(
                0xFFFF5722,
              ), // هذا هو الحد الملون على الطرف (يمكنك تغيير اللون حسب رغبتك)
              width: 4.2, // سمك الحد كما طلبته
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(17.9, 17.9, 21.1, 17.9),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'معلومات المستلم',
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  SizedBox(width: 8.w),
                  Icon(
                    Icons.move_to_inbox_outlined,
                    color: Colors.deepOrange,
                    size: 20.sp,
                  ),
                ],
              ),
              SizedBox(height: 14.h),
              Text(
                'الدولة',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              SizedBox(height: 6.h),
              const TextField(
                textAlign: TextAlign.right,
                decoration: InputDecoration(hintText: 'اختر الدولة'),
              ),
              SizedBox(height: 12.h),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'المدينة',
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        SizedBox(height: 6.h),
                        const TextField(
                          textAlign: TextAlign.right,
                          decoration: InputDecoration(hintText: 'اختر المدينة'),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'المحافظة',
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        SizedBox(height: 6.h),
                        const TextField(
                          textAlign: TextAlign.right,
                          decoration: InputDecoration(
                            hintText: 'اختر المحافظة',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
