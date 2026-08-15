// ج) مربعات إدخال الأرقام الأربعة (OTP Input Fields)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/auth/otp/providers/otp_code_controller.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

class OtpInputBoxes extends ConsumerWidget {
  const OtpInputBoxes({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final theme = Theme.of(context);
    final controller = ref.watch(pinCodeControllerProvider);

    return MaterialPinField(
      keyboardType: TextInputType.text,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,

      pinController: controller.pinCodeController,
      length: 6,
      obscureText: false,
      theme: MaterialPinTheme(
        cellSize: Size(50.w, 50.h),
        shape: MaterialPinShape.outlined,
        borderRadius: BorderRadius.circular(8.r),
        fillColor: Color(0xffF7F8F9),
        focusedFillColor: Colors.white,
        filledFillColor: Colors.white,
        spacing: 10.w,
        cursorColor: Colors.black,
        borderColor: Color(0xffE8ECF4),
        filledBorderColor: Colors.black,
        focusedBorderColor: Color(0xff202955),
        focusedBorderWidth: 1.2.w,

        borderWidth: 1.w,
        textStyle: TextStyle(
          color: Colors.black,
          fontSize: 22.sp,
          fontStyle: FontStyle.normal,
          fontWeight: FontWeight.bold,
        ),
        completeTextStyle: TextStyle(
          color: Colors.black,
          fontWeight: FontWeight.bold,
          fontSize: 22.sp,
        ),
      ),
    );
  }
}
