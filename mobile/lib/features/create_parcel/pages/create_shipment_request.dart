// ================= Screen & UI Components =================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/companies/providers/quotations_notifier.dart';
import 'package:mobile/features/create_parcel/dto/create_parcel_dto.dart';
import 'package:mobile/features/create_parcel/providers/create_parcel_notifier.dart';
import 'package:mobile/features/create_parcel/providers/receiver_location_notifier.dart';
import 'package:mobile/features/create_parcel/providers/sender_location_notifier.dart';
import 'package:mobile/features/create_parcel/providers/states/location_state.dart';
import 'package:mobile/features/create_parcel/repository/create_parcel_controller.dart';
import 'package:mobile/features/create_parcel/widgets/TotalPackageSpecsSection.dart';
import 'package:mobile/features/create_parcel/widgets/receiver_info_section.dart';
import 'package:mobile/features/create_parcel/widgets/sender_info_section.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

class CreateShipmentRequest extends ConsumerWidget {
  const CreateShipmentRequest({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final createParcel = ref.watch(createParcelNotifierProvider);
    final controllers = ref.watch(createParcelControllerProvider);
    final senderLocationState = ref.watch(senderLocationNotifierProvider);

    final receiverLocationState = ref.watch(receiverLocationNotifierProvider);



    return Scaffold(
      appBar: AppBar(
        title: Text(
          'تفاصيل الطرد',
          style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward),
          onPressed: () {},
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          children: [
            TotalPackageSpecsSection(controllers: controllers),
            SizedBox(height: 16.h),
            // const ItemDetailsSection(),
            // SizedBox(height: 16.h),
            SenderInfoSection(controllers: controllers),
            SizedBox(height: 16.h),
            ReceiverInfoSection(controllers: controllers),
            // SizedBox(height: 16.h),
            // const FeaturesListSection(),
            // SizedBox(height: 16.h),
            // const ShipmentSummarySection(),
            SizedBox(height: 24.h),
            PrimaryButton(
              onPressed: createParcel.isLoading
                  ? null
                  : () => _submitForm(
                      ref,
                      context,
                      controllers,
                      senderLocationState,
                      receiverLocationState,
                    ),
              child: createParcel.isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('SIGN IN TO DASHBOARD'),
                        SizedBox(width: 12.w),
                        Icon(Icons.arrow_forward, size: 20.sp),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _submitForm(
    WidgetRef ref,
    BuildContext context,
    CreateParcelController controllers,
    AsyncValue<LocationSelectionState> senderLocationState,
    AsyncValue<LocationSelectionState> receiverLocationState,
  ) async{
    final weight = double.tryParse(controllers.weightController.text.trim());

    final height = double.tryParse(controllers.heightController.text.trim());

    final length = double.tryParse(controllers.lengthController.text.trim());

    final width = double.tryParse(controllers.widthController.text.trim());

    final piecesNum = int.tryParse(controllers.piecesController.text.trim());

    final senderName = controllers.senderNameController.text.trim();

    final senderPhone = controllers.senderPhoneController.text.trim();

    final receiverName = controllers.receiverNameController.text.trim();

    final receiverPhone = controllers.receiverPhoneController.text.trim();

    // التحقق من القيم
    if (weight == null ||
        height == null ||
        length == null ||
        width == null ||
        piecesNum == null) {
      return;
    }

    // الحصول على آخر Location تم اختياره
    final senderLocationId = senderLocationState.value?.selectedLocationId;

    final receiverLocationId = receiverLocationState.value?.selectedLocationId;

    // يجب أن يكون الموقعان محددين
    if (senderLocationId == null || receiverLocationId == null) {
      return;
    }

    final dto = CreateParcelDto(
      originGlobalLocationId: senderLocationId,
      destinationGlobalLocationId: receiverLocationId,

      senderName: senderName,
      senderPhone: senderPhone,

      receiverName: receiverName,
      receiverPhone: receiverPhone,

      expectedPiecesCount: piecesNum,
      expectedTotalWeightKg: weight,

      expectedLengthCm: length,
      expectedWidthCm: width,
      expectedHeightCm: height,

      notes: '',
    );

     try {
    final quotations = await ref
        .read(createParcelNotifierProvider.notifier)
        .createParcel(dto);

    if (quotations == null) {
      _showSnackBar(
        context,
        'لم يتم الحصول على عروض الأسعار',
        Colors.red,
      );
      return;
    }

    // تخزين عروض الأسعار
    ref
        .read(quotationsNotifierProvider.notifier)
        .setQuotations(quotations);

    if (!context.mounted) return;

    // الانتقال إلى صفحة عروض الأسعار
    context.pushNamed(
      AppRoutes.shippingCompaniesScreen,
    );
  } catch (e) {
    if (!context.mounted) return;

    _showSnackBar(
      context,
      'فشل إنشاء الطلب: $e',
      Colors.red,
    );
  }
}

  void _showSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: color));
  }
}
