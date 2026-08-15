// Notifier للتنقل السفلي (Bottom Navigation) الحديث
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';

class BottomNavNotifier extends Notifier<int> {
  @override
  int build() => 1; // افتراض أن تبويب "Track" هو المفعل في الصورة الحالية

  void setIndex(int index) {
    state = index;
  }
}

final bottomNavProvider = NotifierProvider<BottomNavNotifier, int>(
  BottomNavNotifier.new,
);
