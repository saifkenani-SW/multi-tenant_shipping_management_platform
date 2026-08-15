import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// كلاس لتجميع الـ Controllers لشاشة التسجيل
class CreateParcelController {
  final TextEditingController weightController = TextEditingController();
  final TextEditingController heightController = TextEditingController();
  final TextEditingController lengthController = TextEditingController();
  final TextEditingController piecesController = TextEditingController();
  final TextEditingController widthController = TextEditingController();
  final TextEditingController senderNameController = TextEditingController();
  final TextEditingController senderPhoneController = TextEditingController();
  final TextEditingController receiverNameController = TextEditingController();
  final TextEditingController receiverPhoneController = TextEditingController();




  // مهم جداً: عمل Dispose للـ Controllers لمنع تسرب الذاكرة
  void dispose() {
  weightController.dispose();
  heightController.dispose();
  lengthController.dispose();
  widthController.dispose();
  senderNameController.dispose();
  senderPhoneController.dispose();
  receiverNameController.dispose();
  receiverPhoneController.dispose();
  piecesController.dispose();
}
}

final createParcelControllerProvider = Provider.autoDispose<CreateParcelController>((ref) {
  final controllers = CreateParcelController();
  
  // هذه الخطوة تضمن تنفيذ الـ dispose تلقائياً عند غلق الشاشة
  ref.onDispose(() {
    controllers.dispose();
  });

  return controllers;
});