// 3. فاصل مخصص (Reusable Divider)
import 'package:flutter/material.dart';

class AppDivider extends StatelessWidget {
  const AppDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Divider(color: Colors.white.withOpacity(0.08), height: 1);
  }
}

