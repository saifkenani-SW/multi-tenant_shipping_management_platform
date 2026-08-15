import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/home/widgets/active_shipments_section.dart';
import 'package:mobile/shared/widgets/header_section.dart';
import 'package:mobile/features/home/widgets/promo_banner.dart';
import 'package:mobile/features/home/widgets/quick_actions_grid.dart';
import 'package:mobile/features/home/widgets/search_tracking_field.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const HeaderSection(),
              SizedBox(height: 20.h),
              const SearchTrackingField(),
              SizedBox(height: 20.h),
              const QuickActionsGrid(),
              SizedBox(height: 20.h),
              const PromoBanner(),
              SizedBox(height: 24.h),
              const ActiveShipmentsSection(),
            ],
          ),
        ),
      ),
    );
  }
}
