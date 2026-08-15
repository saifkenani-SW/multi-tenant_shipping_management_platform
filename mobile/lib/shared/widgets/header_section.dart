import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/assets/app_assets.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/notifications/notifier/notification_notifier.dart';
import 'package:mobile/features/profile/notifier/profile_notifier.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

class HeaderSection extends ConsumerWidget {
  const HeaderSection({super.key});

  @override
  Widget build(BuildContext context, ref) {
    log("message");
    final profile = ref.watch(profileNotifierProvider);
    final unreadCount = ref.watch(
      notificationNotifierProvider.select(
        (notifications) => notifications.where((n) => !n.isRead).length,
      ),
    );
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        PrimaryButton(
          onPressed: () {
            GoRouter.of(context).pushNamed(AppRoutes.notificationsScreen);
          },
          height: 40,
          width: 40,
          child: Stack(
            children: [
              Icon(
                Icons.notifications_none,
                color: AppColorsDark.textWhite,
                size: 24.sp,
              ),
              if (unreadCount > 0)
                Positioned(
                  top: 2,
                  right: 2,
                  child: Container(
                    width: 8.w,
                    height: 8.h,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),
        Text(
          'MASAR',
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
            color: AppColorsDark.textWhite,
          ),
        ),
        Container(
          width: 40.w,
          height: 40.h,
          decoration: BoxDecoration(
            border: Border.all(color: AppColorsDark.accentBlue, width: 2.w),
            borderRadius: BorderRadius.circular(12.r),
            image: DecorationImage(
              image:
                  profile.value?.profileImageUrl == null ||
                      profile.value!.profileImageUrl!.isEmpty
                  ? const AssetImage(AppAssets.defaultProfileImage)
                  : NetworkImage(
                      "https://saifkenani.me${profile.value!.profileImageUrl!}",
                    ),
              fit: BoxFit.cover,
            ),
          ),
        ),
      ],
    );
  }
}
