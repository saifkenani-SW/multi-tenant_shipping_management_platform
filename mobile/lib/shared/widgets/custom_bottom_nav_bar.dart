// lib/shared/widgets/custom_bottom_nav_bar.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

class CustomBottomNavBar extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const CustomBottomNavBar({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentIndex = navigationShell.currentIndex;

    // استخدام ألوان الثيم المتوافقة بدل الألوان الصلبة الثابتة
    final backgroundColor = theme.colorScheme.surface;
    final selectedColor = theme.colorScheme.primary;
    const unselectedColor = Color(0xFF70758A);

    return Container(
      height: 120.h,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(18.r),
          topRight: Radius.circular(18.r),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(6.w),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final itemWidth = constraints.maxWidth / 4;

              return Stack(
                children: [
                  // الخلفية المتحركة
                  AnimatedPositionedDirectional(
                    duration: const Duration(milliseconds: 350),
                    curve: Curves.easeInOutCubic,
                    top: 0,
                    bottom: 0,
                    start: currentIndex * itemWidth + 12.w,
                    child: Container(
                      width: itemWidth - 24.w,
                      decoration: BoxDecoration(
                        color: selectedColor,
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                    ),
                  ),

                  // العناصر
                  Row(
                    textDirection: Directionality.of(context),
                    children: [
                      Expanded(
                        child: _NavItem(
                          icon: Icons.home_outlined,
                          selectedIcon: Icons.home,
                          label: 'الرئيسية',
                          selected: currentIndex == 0,
                          onTap: () => _onItemTapped(0),
                          unselectedColor: unselectedColor,
                        ),
                      ),
                      Expanded(
                        child: _NavItem(
                          icon: Icons.inventory_2_outlined,
                          selectedIcon: Icons.inventory_2,
                          label: 'شحناتي',
                          selected: currentIndex == 1,
                          onTap: () => _onItemTapped(1),
                          unselectedColor: unselectedColor,
                        ),
                      ),
                      Expanded(
                        child: _NavItem(
                          icon: Icons.location_on_outlined,
                          selectedIcon: Icons.location_on,
                          label: 'تتبع',
                          selected: currentIndex == 2,
                          onTap: () => _onItemTapped(2),
                          unselectedColor: unselectedColor,
                        ),
                      ),
                      Expanded(
                        child: _NavItem(
                          icon: Icons.person_outline,
                          selectedIcon: Icons.person,
                          label: 'حسابي',
                          selected: currentIndex == 3,
                          onTap: () => _onItemTapped(3),
                          unselectedColor: unselectedColor,
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  void _onItemTapped(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color unselectedColor;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.unselectedColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: 68.h,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              selected ? selectedIcon : icon,
              size: selected ? 29.sp : 27.sp,
              color: selected ? theme.colorScheme.onPrimary : unselectedColor,
            ),
            SizedBox(height: 4.h),
            Text(
              label,
              style: TextStyle(
                fontSize: selected ? 14.sp : 12.sp,
                fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                color: selected ? theme.colorScheme.onPrimary : unselectedColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}