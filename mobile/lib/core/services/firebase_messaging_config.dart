import 'dart:developer';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';

class NotificationService {
  NotificationService(this.router);

  final GoRouter router;

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // --------------------------------------------------
    // 1. Request permission
    // --------------------------------------------------

    final notificationSettings =
        await FirebaseMessaging.instance.requestPermission(
      alert: true,
      sound: true,
      badge: true,
    );

    log(
      'Authorization Status: '
      '${notificationSettings.authorizationStatus}',
    );

    // --------------------------------------------------
    // 2. Local notifications initialization
    // --------------------------------------------------

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    const iosSettings = DarwinInitializationSettings();

    const initializationSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (response) {
        onLocalNotificationTap(response);
      },
    );

    // --------------------------------------------------
    // 3. FCM Token
    // --------------------------------------------------

    final token = await FirebaseMessaging.instance.getToken();

    log('FCM Token: $token');

    // --------------------------------------------------
    // 4. Foreground
    // --------------------------------------------------

    FirebaseMessaging.onMessage.listen(
      (RemoteMessage message) {
        log('Foreground notification');
        log('Data: ${message.data}');

        final notification = message.notification;

        if (notification != null) {
          showNotification(
            title: notification.title,
            body: notification.body,
          );
        }
      },
    );

    // --------------------------------------------------
    // 5. Background → user tapped notification
    // --------------------------------------------------

    FirebaseMessaging.onMessageOpenedApp.listen(
      (RemoteMessage message) {
        log('Notification opened from background');
        log('Data: ${message.data}');

        handleNotificationTap(message);
      },
    );

    // --------------------------------------------------
    // 6. Terminated → user tapped notification
    // --------------------------------------------------

    final initialMessage =
        await FirebaseMessaging.instance.getInitialMessage();

    if (initialMessage != null) {
      log('Notification opened from terminated state');
      log('Data: ${initialMessage.data}');

      handleNotificationTap(initialMessage);
    }
  }

  // ==================================================
  // Notification tap
  // ==================================================

  void handleNotificationTap(RemoteMessage message) {
    final data = message.data;

    final type = data['type'];

    log('Notification type: $type');

    if (type == 'shipment') {
      final shipmentId = data['shipmentId'];

      if (shipmentId == null) {
        log('shipmentId is missing');
        return;
      }

      router.push(
        '/shipment-details/$shipmentId',
      );
    }
  }

  // ==================================================
  // Local notification tap
  // ==================================================

  void onLocalNotificationTap(
    NotificationResponse response,
  ) {
    final payload = response.payload;

    log('Local notification payload: $payload');

    // سنستخدم هذا لاحقًا إذا احتجنا navigation
    // من flutter_local_notifications.
  }

  // ==================================================
  // Show local notification
  // ==================================================

  Future<void> showNotification({
    String? title,
    String? body,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'shipment_notifications',
      'Shipment Notifications',
      channelDescription:
          'Notifications about shipments and their status',
      importance: Importance.max,
      priority: Priority.high,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
    );

    await flutterLocalNotificationsPlugin.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: notificationDetails,
      payload: 'shipment',
    );
  }
}