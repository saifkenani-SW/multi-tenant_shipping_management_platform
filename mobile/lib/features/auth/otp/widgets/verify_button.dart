// هـ) زر تأكيد الرمز
import 'package:flutter/material.dart';

class VerifyButton extends StatelessWidget {
  const VerifyButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        // TODO: تنفيذ عملية التحقق من الرمز
      },
      child: const Text('تأكيد الرمز'),
    );
  }
}