// lib/shared/widgets/custom_password_text_field.dart
import 'package:flutter/material.dart';

class CustomPasswordTextField extends StatelessWidget {
  final TextEditingController controller;
  final bool obscureText;
  final VoidCallback? onToggleVisibility;
  final IconData prefixIcon;
  final String hintText;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;

  const CustomPasswordTextField({
    super.key,
    required this.controller,
    required this.obscureText,
    this.onToggleVisibility,
    required this.prefixIcon,
    required this.hintText,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: Icon(
          prefixIcon,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        suffixIcon: onToggleVisibility == null
            ? null
            : IconButton(
                icon: Icon(
                  obscureText
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                onPressed: onToggleVisibility,
              ),
      ),
    );
  }
}