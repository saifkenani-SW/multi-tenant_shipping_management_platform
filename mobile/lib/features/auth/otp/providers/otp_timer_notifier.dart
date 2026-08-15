import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class OtpTimerNotifier extends Notifier<int> {
  Timer? _timer;

  @override
  int build() {
    startTimer();
    ref.onDispose(() {
      _timer?.cancel();
    });

    return 5;
  }

  void startTimer() {
    _timer?.cancel();

    state = 5;

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state == 0) {
        timer.cancel();
      } else {
        state--;
      }
    });
  }

  void restart() {
    startTimer();
  }
}

final otpTimerProvider = NotifierProvider.autoDispose<OtpTimerNotifier, int>(
  OtpTimerNotifier.new,
);
