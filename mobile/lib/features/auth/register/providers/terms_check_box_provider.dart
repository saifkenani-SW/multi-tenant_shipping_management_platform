// Notifier لإدارة حالة الموافقة على الشروط والأحكام
import 'package:flutter_riverpod/legacy.dart';

class TermsCheckboxNotifier extends StateNotifier<bool> {
  TermsCheckboxNotifier() : super(false);

  void toggle() => state = !state;
}

final termsCheckboxProvider =
    StateNotifierProvider<TermsCheckboxNotifier, bool>((ref) {
  return TermsCheckboxNotifier();
});