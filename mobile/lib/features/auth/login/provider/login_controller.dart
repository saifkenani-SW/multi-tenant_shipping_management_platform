import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// كلاس لتجميع الـ Controllers لشاشة التسجيل
class LoginController {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();


  // مهم جداً: عمل Dispose للـ Controllers لمنع تسرب الذاكرة
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
  }
}

// إنشاء Provider خاص بها مع استخدام .autoDispose لحذفها عند الخروج من الشاشة
final loginControllersProvider = Provider.autoDispose<LoginController>((ref) {
  final controllers = LoginController();
  
  // هذه الخطوة تضمن تنفيذ الـ dispose تلقائياً عند غلق الشاشة
  ref.onDispose(() {
    controllers.dispose();
  });

  return controllers;
});