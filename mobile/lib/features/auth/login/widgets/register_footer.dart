import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/shared/widgets/custom_text_button.dart';

class RegisterFooter extends StatelessWidget {
  const RegisterFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'New to SwiftPost? ',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        CustomTextButton(
          onPressed: () {
            GoRouter.of(context).pushNamed(AppRoutes.registerScreen);
          },
          text: "Create a Business Account",
          style: theme.textTheme.bodyMedium!,
          underLine: true,
        ),
      ],
    );
  }
}
