import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/profile/notifier/notificationsProvider.dart';
import 'package:mobile/features/profile/notifier/theme_notifier.dart';
import 'package:mobile/features/profile/widgets/SettingsTile.dart';

// 3. مجموعة التفضيلات
class PreferencesGroup extends ConsumerWidget {
  const PreferencesGroup({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isNotificationsEnabled = ref.watch(notificationsProvider);
    final theme = ref.watch(themeNotifierProvider);

    return Container(
      decoration: BoxDecoration(
        color: AppColorsDark.cardBg,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        children: [
          SwitchListTile(
            secondary: const Icon(
              Icons.notifications_none,
              color: AppColorsDark.textWhite,
            ),
            title: Text(
              'الإشعارات',
              style: TextStyle(fontSize: 14.sp, color: AppColorsDark.textWhite),
            ),
            value: isNotificationsEnabled,
            activeColor: Colors.white,
            activeTrackColor: AppColorsDark.accentBlue,
            inactiveTrackColor: AppColorsDark.primaryBg,
            onChanged: (val) {
              ref.read(notificationsProvider.notifier).state = val;
            },
          ),
          const Divider(color: Colors.white10, height: 1),
          SettingsTile(
            icon: Icons.language,
            title: 'اللغة',
            trailing: Text(
              'العربية',
              style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
            ),
            onTap: () {},
          ),
          const Divider(color: Colors.white10, height: 1),
          SettingsTile(
            icon: theme == ThemeMode.light
                ? Icons.wb_sunny_outlined
                : Icons.bedtime_outlined,
            title: 'المظهر',
            trailing: Text(
              theme == ThemeMode.light
                  ? 'الوضع النهاري'
                  : 'الوضع الليلي',
              style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
            ),
            onTap: () {
              ref.read(themeNotifierProvider.notifier).toggleTheme();
            },
          ),
        ],
      ),
    );
  }
}
