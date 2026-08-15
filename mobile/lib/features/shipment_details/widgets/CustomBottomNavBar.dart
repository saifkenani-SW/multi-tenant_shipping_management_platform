

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/shipment_details/notifier/bottomNavIndexProvider.dart';

// ==============================================================================
// 6. المكونات الفرعية المقسمة (Sub-Components)
class CustomBottomNavBar extends ConsumerWidget {
  const CustomBottomNavBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(bottomNavIndexProvider);

    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: (index) {
        ref.read(bottomNavIndexProvider.notifier).state = index;
      },
      backgroundColor: AppColorsDark.cardBg,
      indicatorColor: AppColorsDark.accentBlue.withOpacity(0.2),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.local_shipping_outlined),
          selectedIcon: Icon(Icons.local_shipping, color: AppColorsDark.accentBlue),
          label: 'Ship',
        ),
        NavigationDestination(
          icon: Icon(Icons.location_on_outlined),
          selectedIcon: Icon(Icons.location_on, color: AppColorsDark.accentBlue),
          label: 'Track',
        ),
        NavigationDestination(
          icon: Icon(Icons.history_outlined),
          selectedIcon: Icon(Icons.history, color: AppColorsDark.accentBlue),
          label: 'History',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person, color: AppColorsDark.accentBlue),
          label: 'Profile',
        ),
      ],
    );
  }
}




