
// عنصر قائمة موحد (Settings Tile)

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget? trailing;
  final VoidCallback onTap;

  const SettingsTile({
    super.key,
    required this.icon,
    required this.title,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      
      leading: Icon(icon, color: AppColorsDark.textWhite),
      title: Text(title, style: TextStyle(fontSize: 14.sp, color: AppColorsDark.textWhite)),
      trailing: trailing ?? Icon(Icons.arrow_back_ios_new, size: 14.sp, color: AppColorsDark.textGrey),
      onTap: onTap,
    );
  }
}