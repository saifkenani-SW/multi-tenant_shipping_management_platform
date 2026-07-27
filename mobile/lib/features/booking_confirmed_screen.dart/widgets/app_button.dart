// 7. زر موحد قابل لإعادة الاستخدام (App Button)
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppButton extends StatelessWidget {
  final String text;
  final IconData icon;
  final VoidCallback onPressed;
  final bool isOutlined;

  const AppButton({
    super.key,
    required this.text,
    required this.icon,
    required this.onPressed,
    this.isOutlined = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48.h,
      child: isOutlined
          ? OutlinedButton(
              onPressed: onPressed,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: const Color(0xFF1867D2).withOpacity(0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
              ),
              child: ButtonContent(text: text, icon: icon, color: Colors.white),
            )
          : ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1867D2),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
              ),
              child: ButtonContent(text: text, icon: icon, color: Colors.white),
            ),
    );
  }
}

class ButtonContent extends StatelessWidget {
  final String text;
  final IconData icon;
  final Color color;

  const ButtonContent({super.key, required this.text, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(text, style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: color)),
        SizedBox(width: 8.w),
        Icon(icon, size: 18.sp, color: color),
      ],
    );
  }
}
