import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// 1. حالة النموذج (State)
class RegisterFormState {
  final bool isLoading;
  final String? errorMessage;

  RegisterFormState({
    this.isLoading = false,
    this.errorMessage,
  });

  RegisterFormState copyWith({
    bool? isLoading,
    String? errorMessage,
  }) {
    return RegisterFormState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

// 2. الـ Notifier الحديث (بدون StateNotifier وبدون Generation)
class RegisterFormNotifier extends Notifier<RegisterFormState> {
  @override
  RegisterFormState build() {
    return RegisterFormState();
  }

  // الـ Controllers الخاصة بحقول الإدخال
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();

  // منطق التسجيل
  Future<void> submit({
    required VoidCallback onSuccess,
    required ValueChanged<String> onError,
  }) async {
    if (firstNameController.text.isEmpty || lastNameController.text.isEmpty) {
      onError('Please fill in your name fields');
      return;
    }

    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      // محاكاة الاتصال بالخادم (API Request)
      await Future.delayed(const Duration(seconds: 2));

      if (!ref.mounted) return;
      state = state.copyWith(isLoading: false);
      onSuccess();
    } catch (e) {
      if (!ref.mounted) return;
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      onError(e.toString());
    }
  }

  void disposeControllers() {
    firstNameController.dispose();
    lastNameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    passwordController.dispose();
  }
}

// 3. الـ Provider الحديث
final registerFormProvider =
    NotifierProvider.autoDispose<RegisterFormNotifier, RegisterFormState>(
  RegisterFormNotifier.new,
);