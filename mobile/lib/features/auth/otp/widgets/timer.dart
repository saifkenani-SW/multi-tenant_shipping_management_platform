import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/shared/widgets/custom_text_button.dart';
import 'package:mobile/features/auth/otp/providers/otp_timer_notifier.dart';
import 'package:mobile/features/auth/otp/providers/resend_otp_notifier.dart';

class TimerAndResendRow extends ConsumerWidget {
  final String email;
  const TimerAndResendRow({super.key, required this.email});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seconds = ref.watch(otpTimerProvider);

    final theme = Theme.of(context);

    final minutes = seconds ~/ 60;
    final remainSeconds = seconds % 60;

    final time =
        '${minutes.toString().padLeft(2, '0')}:${remainSeconds.toString().padLeft(2, '0')}';

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(width: 6.w),
        if (seconds == 0) ...[
          CustomTextButton(
            onPressed: () {
              ref.read(resendOtpNotifierProvider.notifier).resendOtp(email);
              ref.read(otpTimerProvider.notifier).restart();
            },
            text: 'إعادة إرسال الرمز',
            style: theme.textTheme.bodyMedium!,
            underLine: true,
          ),
        ] else ...[
          Icon(Icons.timer_outlined, size: 16.sp, color: Colors.orange),
          Text(
            time,
            style: TextStyle(
              fontSize: 13.sp,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
          SizedBox(width: 6.w),

          Text(
            'إعادة إرسال الرمز خلال',
            style: TextStyle(
              fontSize: 13.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }
}
