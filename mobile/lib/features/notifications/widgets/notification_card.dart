import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/notifications/model/notification_model.dart';
import 'package:mobile/features/notifications/notifier/notification_notifier.dart';

class NotificationCard extends ConsumerStatefulWidget {
  final NotificationModel notification;
  final Color leftBorderColor;
  final Widget? extraContent;

  const NotificationCard({
    super.key,
    required this.notification,
    required this.leftBorderColor,
    this.extraContent,
  });

  @override
  ConsumerState<NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends ConsumerState<NotificationCard> {
  bool isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final notification = widget.notification;

    return Container(
      decoration: BoxDecoration(
        color: AppColorsLight.cardBg,
        borderRadius: BorderRadius.circular(16.r),
        border: Border(
          left: BorderSide(color: widget.leftBorderColor, width: 4.w),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: EdgeInsets.all(16.w),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: AppColorsLight.accentBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Icon(
                  _getIcon(notification.type),
                  color: _getIconColor(notification.type),
                  size: 24.sp,
                ),
              ),

              SizedBox(width: 12.w),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontSize: 15.sp,
                              fontWeight: FontWeight.bold,
                              color: AppColorsLight.textDark,
                            ),
                          ),
                        ),

                        Text(
                          _formatTime(notification.createdAt),
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: AppColorsLight.textGrey,
                          ),
                        ),

                        SizedBox(width: 4.w),

                        InkWell(
                          onTap: () {
                            setState(() {
                              isExpanded = !isExpanded;
                            });

                            ref
                                .read(notificationNotifierProvider.notifier)
                                .markAsRead(notification.id);
                          },

                          child: Padding(
                            padding: EdgeInsets.all(4.w),
                            child: Icon(
                              isExpanded
                                  ? Icons.keyboard_arrow_up
                                  : Icons.keyboard_arrow_down,
                              size: 18.sp,
                              color: AppColorsLight.textGrey,
                            ),
                          ),
                        ),

                        SizedBox(width: 4.w),

                        // unread indicator
                        if (!notification.isRead)
                          Container(
                            width: 8.w,
                            height: 8.h,
                            decoration: const BoxDecoration(
                              color: AppColorsLight.accentBlue,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),

                    SizedBox(height: 6.h),

                    LayoutBuilder(
                      builder: (context, constraints) {
                        final textStyle = TextStyle(
                          fontSize: 13.sp,
                          color: AppColorsLight.textGrey,
                          height: 1.4,
                        );

                        final textPainter = TextPainter(
                          text: TextSpan(
                            text: notification.body,
                            style: textStyle,
                          ),
                          maxLines: 2,
                          textDirection: Directionality.of(context),
                        )..layout(maxWidth: constraints.maxWidth);

                        final needsExpansion = textPainter.didExceedMaxLines;

                        if (!needsExpansion && !notification.isRead) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (mounted) {
                              ref
                                  .read(notificationNotifierProvider.notifier)
                                  .markAsRead(notification.id);
                            }
                          });
                        }

                        return Text(
                          notification.body,
                          maxLines: isExpanded ? null : 2,
                          overflow: isExpanded
                              ? TextOverflow.visible
                              : TextOverflow.ellipsis,
                          style: textStyle,
                        );
                      },
                    ),

                    if (isExpanded && widget.extraContent != null)
                      widget.extraContent!,
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'shipment':
        return Icons.local_shipping_outlined;

      case 'delivered':
        return Icons.inventory_2_outlined;

      case 'delay':
        return Icons.error_outline;

      case 'customs':
        return Icons.receipt_long_outlined;

      default:
        return Icons.notifications_none;
    }
  }

  Color _getIconColor(String type) {
    switch (type) {
      case 'delay':
        return const Color(0xFFDC2626);

      default:
        return AppColorsLight.accentBlue;
    }
  }

  String _formatTime(DateTime date) {
    final difference = DateTime.now().difference(date);

    if (difference.inSeconds < 60) {
      return 'Just now';
    }

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    }

    if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    }

    if (difference.inDays == 1) {
      return 'Yesterday';
    }

    return '${date.day}/${date.month}';
  }
}
