import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/notifications/notifier/notification_notifier.dart';
import 'package:mobile/features/notifications/widgets/notification_card.dart';
import 'package:mobile/features/profile/widgets/SectionHeader.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColorsLight.textDark),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: Text(
          'Notifications',
          style: TextStyle(
            fontSize: 18.sp,
            fontWeight: FontWeight.bold,
            color: AppColorsLight.textDark,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.settings_outlined,
              color: AppColorsLight.textDark,
            ),
            onPressed: () {},
          ),
        ],
      ),

      body: notifications.isEmpty
          ? const Center(child: Text('No notifications'))
          : ListView(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              children: [
                const SectionHeader(title: 'NEW'),

                SizedBox(height: 12.h),

                ...notifications.map(
                  (notification) => Padding(
                    padding: EdgeInsets.only(bottom: 12.h),
                    child: NotificationCard(
                      notification: notification,
                      leftBorderColor: _getBorderColor(notification.type),
                    ),
                  ),
                ),

                SizedBox(height: 20.h),
              ],
            ),
    );
  }

  Color _getBorderColor(String type) {
    switch (type) {
      case 'delay':
        return const Color(0xFFDC2626);

      default:
        return AppColorsLight.accentBlue;
    }
  }
}
