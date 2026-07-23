// Notifier لإدارة الأرقام المدخلة في مربعات الـ OTP
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OtpCodeNotifier extends Notifier<List<String>> {
  @override
  List<String> build() => ['', '', '', '']; // 4 خانات للرمز

  void updateDigit(int index, String value) {
    final newState = [...state];
    newState[index] = value;
    state = newState;
  }
}

final otpCodeProvider = NotifierProvider<OtpCodeNotifier, List<String>>(OtpCodeNotifier.new);
