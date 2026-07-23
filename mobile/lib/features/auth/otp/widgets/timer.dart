
// د) عداد الوقت وإعادة الإرسال
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class TimerAndResendRow extends StatelessWidget {
  const TimerAndResendRow({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.timer_outlined, size: 16.sp, color: Colors.orange),
        SizedBox(width: 6.w),
        Text(
          '00:57',
          style: TextStyle(
            fontSize: 13.sp,
            fontWeight: FontWeight.bold,
            color: Colors.orange,
          ),
        ),
        SizedBox(width: 6.w),
        Text(
          'إعادة إرسال الرمز خلال',
          style: TextStyle(
            fontSize: 13.sp,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
