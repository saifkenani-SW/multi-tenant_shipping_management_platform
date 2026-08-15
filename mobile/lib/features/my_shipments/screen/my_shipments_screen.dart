import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/my_shipments/notifier/shipments_notifier.dart';
import 'package:mobile/shared/widgets/header_section.dart';
import 'package:mobile/features/my_shipments/widgets/FilterChipsSection.dart';
import 'package:mobile/features/my_shipments/widgets/SearchFieldSection.dart';
import 'package:mobile/features/my_shipments/widgets/ShipmentsListSection.dart';
class MyShipmentsScreen extends ConsumerStatefulWidget {
  const MyShipmentsScreen({super.key});

  @override
  ConsumerState<MyShipmentsScreen> createState() =>
      _MyShipmentsScreenState();
}

class _MyShipmentsScreenState
    extends ConsumerState<MyShipmentsScreen> {
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();

    _scrollController = ScrollController();
    _scrollController.addListener(_scrollListener);
  }

  void _scrollListener() {
    if (!_scrollController.hasClients) {
      return;
    }

    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref
          .read(shipmentsNotifierProvider.notifier)
          .getShipments();
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {},
        ),
        title: Text(
          'Shipping Details',
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.symmetric(
            horizontal: 16.w,
            vertical: 8.h,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const HeaderSection(),

              SizedBox(height: 16.h),

              const SearchFieldSection(),

              SizedBox(height: 16.h),

              const FilterChipsSection(),

              SizedBox(height: 16.h),

              const ShipmentsListSection(),
            ],
          ),
        ),
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: () {
          GoRouter.of(context).pushNamed(
            AppRoutes.createParcelScreen,
          );
        },
        backgroundColor: AppColorsDark.accentBlue,
        shape: const CircleBorder(),
        child: const Icon(
          Icons.add,
          color: Colors.white,
        ),
      ),
    );
  }
}