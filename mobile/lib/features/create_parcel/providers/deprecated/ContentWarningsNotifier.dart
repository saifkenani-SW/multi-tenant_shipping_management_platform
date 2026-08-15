
import 'package:flutter_riverpod/legacy.dart';

class ContentWarningsNotifier extends StateNotifier<Map<String, bool>> {
  ContentWarningsNotifier()
      : super({
          'قابل للكسر': false,
          'سوائل': false,
          'مواد ثمينة': false,
          'بطاريات': false,
        });

  void toggle(String key) {
    state = {...state, key: !(state[key] ?? false)};
  }
}

final contentWarningsProvider =
    StateNotifierProvider<ContentWarningsNotifier, Map<String, bool>>((ref) {
  return ContentWarningsNotifier();
});
