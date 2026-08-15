import 'dart:async';
import 'dart:developer';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

//                   FCM Message
//                        │
//                    Payload
//                        │
//             ┌──────────┴──────────┐
//             │                     │
//       notification              data
//             │                     │
//       ┌─────┴─────┐        ┌──────┴──────┐
//       │           │        │             │
//     title        body     type       shipmentId
//       │           │        │             │
//       ↓           ↓        ↓             ↓
//  "تحديث"     "وصلت"   "shipment"      "12345"

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService.instance;
});

final notificationMessageProvider = StreamProvider<RemoteMessage>((ref) {
  log('🔥 StreamProvider CREATED');

  final service = ref.read(notificationServiceProvider);

  return service.messageStream;
});

class NotificationService {
  NotificationService._();

  static final NotificationService instance = NotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  final StreamController<RemoteMessage> _messageController =
      StreamController<RemoteMessage>.broadcast();

  Stream<RemoteMessage> get messageStream => _messageController.stream;

  Future<void> initialize() async {
    await _requestPermission();
    await _initializeLocalNotifications();
    await _getToken();
    _listenToForegroundMessages();
    _listenToBackgroundOnTapMessages();
    await _handleInitialMessage();
  }

  void _listenToBackgroundOnTapMessages() {
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log('Notification opened from background');
      log('Data: ${message.data}');

      _handleNotificationTap(message);
    });
  }

  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;

    final type = data['type'];

    log('Notification type: $type');

    if (type == 'shipment') {
      final shipmentId = data['shipmentId'];

      if (shipmentId == null) {
        log('shipmentId is missing');
        return;
      }

      // router.push(
      //   '/shipment-details/$shipmentId',
      // );
    }
  }

  Future<void> _handleInitialMessage() async {
    final initialMessage = await _messaging.getInitialMessage();

    if (initialMessage != null) {
      log('Notification opened from terminated state');
      log('Data: ${initialMessage.data}');

      _handleNotificationTap(initialMessage);
    }
  }

  Future<void> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      sound: true,
      badge: true,
    );

    log(
      'Notification permission: '
      '${settings.authorizationStatus}',
    );
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    const iosSettings = DarwinInitializationSettings();

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );
  }

  Future<void> _getToken() async {
    final token = await _messaging.getToken();

    log('FCM Token: $token');
  }

  void _listenToForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      log('🔥 FCM FOREGROUND');
      log('🔥 Data: ${message.data}');

      _messageController.add(message);

      final notification = message.notification;

      if (notification != null) {
        _showNotification(title: notification.title, body: notification.body);
      }
    });
  }

  Future<void> _showNotification({String? title, String? body}) async {
    const androidDetails = AndroidNotificationDetails(
      'shipment_notifications',
      'Shipment Notifications',
      channelDescription: 'Notifications about shipments',
      importance: Importance.max,
      priority: Priority.high,
    );

    const notificationDetails = NotificationDetails(android: androidDetails);

    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: notificationDetails,
    );
  }

  void _onNotificationTap(NotificationResponse response) {
    final payload = response.payload;
    log('Notification tapped, payload : $payload');
  }
}
