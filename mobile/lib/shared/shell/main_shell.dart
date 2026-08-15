import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/shared/widgets/custom_bottom_nav_bar.dart';

class MainShell extends StatelessWidget {

  final StatefulNavigationShell navigationShell;

  const MainShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      body: navigationShell,

      bottomNavigationBar: CustomBottomNavBar(
        navigationShell: navigationShell,
      ),

    );
  }
}