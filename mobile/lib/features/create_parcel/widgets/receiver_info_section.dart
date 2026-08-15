import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/create_parcel/providers/receiver_location_notifier.dart';
import 'package:mobile/features/create_parcel/repository/create_parcel_controller.dart';
import 'package:mobile/features/create_parcel/widgets/CardContainer.dart';
import 'package:mobile/features/create_parcel/widgets/LocationDropdowns.dart';

class ReceiverInfoSection extends ConsumerWidget {
  final CreateParcelController controllers;

  const ReceiverInfoSection({super.key, required this.controllers});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationState = ref.watch(receiverLocationNotifierProvider);

    return CardContainer(
      borderColor: AppColorsDark.accentBlue,
      title: 'معلومات المرسل',
      icon: Icons.local_shipping_outlined,
      iconColor: AppColorsDark.accentBlue,
      children: [
        Text(
          'اسم المرسل',
          style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
        ),

        SizedBox(height: 8.h),

        TextField(
          controller: controllers.receiverNameController,
          decoration: const InputDecoration(hintText: 'اسم المرسل الكامل'),
        ),

        SizedBox(height: 12.h),

        Text(
          'رقم الهاتف',
          style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
        ),

        SizedBox(height: 8.h),

        TextField(
          controller: controllers.receiverPhoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '05xxxxxxxx'),
        ),

        SizedBox(height: 12.h),

        locationState.when(
          loading: () => const Center(child: CircularProgressIndicator()),

          error: (error, stackTrace) => Text(
            'حدث خطأ في تحميل المناطق',
            style: TextStyle(color: Colors.red, fontSize: 12.sp),
          ),

          data: (state) {
            return LocationDropdowns(
              levels: state.levels,

              // onSearch: (index, value) {
              //   ref
              //       .read(
              //         receiverLocationNotifierProvider.notifier,
              //       )
              //       .search(index, value);
              // },
              onSelected: (index, location) {
                ref
                    .read(receiverLocationNotifierProvider.notifier)
                    .selectLocation(index, location);
              },

              // onLoadMore: (index) {
              //   ref
              //       .read(
              //         receiverLocationNotifierProvider.notifier,
              //       )
              //       .loadMore(index);
              // },
            );
          },
        ),
      ],
    );
  }
}
