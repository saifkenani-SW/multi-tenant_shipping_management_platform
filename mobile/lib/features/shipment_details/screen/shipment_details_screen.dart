
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/shipment_details/widgets/ActionButtonsSection.dart';
import 'package:mobile/features/shipment_details/widgets/AddressInformationCard.dart';
import 'package:mobile/features/shipment_details/widgets/LiveTrackingMapCard.dart';
import 'package:mobile/features/shipment_details/widgets/ParcelSpecsCard.dart';
import 'package:mobile/features/shipment_details/widgets/ShippingCarrierCard.dart';
import 'package:mobile/features/shipment_details/widgets/TrackingNumberCard.dart';

// ==============================================================================
// 5. واجهة الشاشة الرئيسية (Tracking Details Screen)
// ==============================================================================
class ShipmentDetailsScreen extends ConsumerWidget {
  const ShipmentDetailsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const TrackingNumberCard(),
              SizedBox(height: 16.h),
              const LiveTrackingMapCard(),
              SizedBox(height: 16.h),
              const AddressInformationCard(),
              SizedBox(height: 16.h),
              const ParcelSpecsCard(),
              SizedBox(height: 16.h),
              const ShippingCarrierCard(),
              SizedBox(height: 24.h),
              const ActionButtonsSection(),
              SizedBox(height: 16.h),
            ],
          ),
        ),
      ),
    );
  }
}
