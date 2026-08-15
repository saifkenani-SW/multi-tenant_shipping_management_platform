// Notifier لإدارة الأرقام المدخلة في مربعات الـ OTP
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

class OtpCodeController{
  final pinCodeController = PinInputController();

  void dispose(){
    pinCodeController.dispose();
  }

  String get code => pinCodeController.text;
}

final pinCodeControllerProvider = Provider.autoDispose<OtpCodeController>((ref) {
  final controller = OtpCodeController();
  
  ref.onDispose(() {
    controller.dispose();
  });

  return controller;
});