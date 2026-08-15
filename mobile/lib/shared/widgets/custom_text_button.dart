// lib/shared/widgets/custom_text_button.dart
import 'package:flutter/material.dart';

class CustomTextButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool? underLine;
  final String text;
  final TextStyle style;

  const CustomTextButton({
    super.key,
    required this.onPressed,
    required this.text,
    this.underLine,
    required this.style,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        text,
        style: style.copyWith(
          color: theme.colorScheme.primary,
          decoration: underLine == true ? TextDecoration.underline : TextDecoration.none,
          decorationColor: theme.colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}