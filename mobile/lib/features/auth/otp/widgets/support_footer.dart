// و) تذييل مواجهة المشكلة والدعم
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class SupportFooter extends StatelessWidget {
  const SupportFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: () {
        // TODO: التواصل مع الدعم
      },
      child: Text(
        'تواجه مشكلة؟ تواصل مع الدعم',
        style: TextStyle(
          fontSize: 13.sp,
          color: theme.colorScheme.onSurfaceVariant,
          decoration: TextDecoration.underline,
          decorationColor: theme.colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}
