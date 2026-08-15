import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';

class LoginHeader extends StatelessWidget {
  const LoginHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              MdiIcons.shippingPallet, 
              color: theme.colorScheme.primary, // تم الربط بلون الثيم
              size: 24.sp,
            ),
            SizedBox(width: 8.w),
            Text(
              'SwiftPost',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: theme.colorScheme.onSurface, // متوافق مع الثيم
              ),
            ),
          ],
        ),
        SizedBox(height: 40.h),
        Text(
          'Logistics at Speed.',
          textAlign: TextAlign.center,
          style: theme.textTheme.displaySmall?.copyWith(
            fontWeight: FontWeight.w700,
            height: 1.2,
            color: theme.colorScheme.onSurface, // متوافق مع الثيم
          ),
        ),
        SizedBox(height: 16.h),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w),
          child: Text(
            'Access your global shipping dashboard and manage high-velocity deliveries.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}