import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/notification_service.dart';
import 'package:mobile/features/notifications/model/notification_model.dart';

final notificationNotifierProvider =
    NotifierProvider<NotificationNotifier, List<NotificationModel>>(
      NotificationNotifier.new,
    );

class NotificationNotifier extends Notifier<List<NotificationModel>> {
  @override
  List<NotificationModel> build() {
    print('NotificationNotifier BUILD');

    ref.listen<AsyncValue<RemoteMessage>>(notificationMessageProvider, (
      previous,
      next,
    ) {
      print('NotificationNotifier received event');

      next.when(
        data: (message) {
          print('MESSAGE: ${message.data}');
          _handleMessage(message);
        },
        loading: () {
          print('MESSAGE LOADING');
        },
        error: (error, stack) {
          print('MESSAGE ERROR: $error');
        },
      );
    });

    return [];
  }

  void _handleMessage(RemoteMessage message) {
    print('HANDLE MESSAGE');

    final notification = NotificationModel(
      id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      type: message.data['type'] ?? '',
      title: message.notification?.title ?? '',
      body: message.notification?.body ?? '',
      data: message.data,
      createdAt: DateTime.now(),
      isRead: false,
    );

    state = [notification, ...state];

    print('Notifications count: ${state.length}');
  }

  void markAsRead(String id) {
  state = [
    for (final notification in state)
      notification.id == id
          ? notification.copyWith(isRead: true)
          : notification,
  ];
}
}
