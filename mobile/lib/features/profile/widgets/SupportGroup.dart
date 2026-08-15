
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/profile/widgets/SettingsTile.dart';

// 4. مجموعة الدعم
class SupportGroup extends StatelessWidget {
  const SupportGroup({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        children: [
          SettingsTile(
            icon: Icons.help_outline,
            title: 'مركز المساعدة',
            onTap: () {},
          ),
          const Divider(color: Colors.white10, height: 1),
          SettingsTile(
            icon: Icons.security_outlined,
            title: 'سياسة الخصوصية',
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
