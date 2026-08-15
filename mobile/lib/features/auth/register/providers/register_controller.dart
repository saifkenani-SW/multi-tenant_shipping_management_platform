import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// كلاس لتجميع الـ Controllers لشاشة التسجيل
class RegisterControllers {
  final TextEditingController firstNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();


  // مهم جداً: عمل Dispose للـ Controllers لمنع تسرب الذاكرة
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    passwordController.dispose();
  }
}

// إنشاء Provider خاص بها مع استخدام .autoDispose لحذفها عند الخروج من الشاشة
final registerControllersProvider = Provider.autoDispose<RegisterControllers>((ref) {
  final controllers = RegisterControllers();
  
  // هذه الخطوة تضمن تنفيذ الـ dispose تلقائياً عند غلق الشاشة
  ref.onDispose(() {
    controllers.dispose();
  });

  return controllers;
});