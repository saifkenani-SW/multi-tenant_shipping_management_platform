import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/auth/otp/widgets/otp_input_box.dart';
import 'package:mobile/features/auth/otp/widgets/otp_text_header.dart';
import 'package:mobile/features/auth/otp/widgets/shield_icon.dart';
import 'package:mobile/features/auth/otp/widgets/support_footer.dart';
import 'package:mobile/features/auth/otp/widgets/timer.dart';
import 'package:mobile/features/auth/otp/widgets/verify_button.dart';

class OtpVerificationScreen extends StatelessWidget {
  const OtpVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_forward, color: theme.colorScheme.onSurface), // السهم بالاتجاه المعاكس حسب التصميم
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Text(
          'التحقق من الرمز',
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.bold,
            fontSize: 18.sp,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const ShieldIconHeader(),
                SizedBox(height: 32.h),
                const OtpTextHeader(),
                SizedBox(height: 32.h),
                const OtpInputBoxes(),
                SizedBox(height: 24.h),
                const TimerAndResendRow(),
                SizedBox(height: 32.h),
                const VerifyButton(),
                SizedBox(height: 24.h),
                const SupportFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
