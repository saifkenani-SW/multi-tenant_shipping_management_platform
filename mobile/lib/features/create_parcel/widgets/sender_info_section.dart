import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/create_parcel/providers/sender_location_notifier.dart';
import 'package:mobile/features/create_parcel/repository/create_parcel_controller.dart';
import 'package:mobile/features/create_parcel/widgets/CardContainer.dart';
import 'package:mobile/features/create_parcel/widgets/LocationDropdowns.dart';

class SenderInfoSection extends ConsumerWidget {
  final CreateParcelController controllers;

  const SenderInfoSection({super.key, required this.controllers});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationState = ref.watch(senderLocationNotifierProvider);

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
          controller: controllers.senderNameController,
          decoration: const InputDecoration(hintText: 'اسم المرسل الكامل'),
        ),

        SizedBox(height: 12.h),

        Text(
          'رقم الهاتف',
          style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey),
        ),

        SizedBox(height: 8.h),

        TextField(
          controller: controllers.senderPhoneController,
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
              //         senderLocationNotifierProvider.notifier,
              //       )
              //       .search(index, value);
              // },
              onSelected: (index, location) {
                ref
                    .read(senderLocationNotifierProvider.notifier)
                    .selectLocation(index, location);
              },

              // onLoadMore: (index) {
              //   ref
              //       .read(
              //         senderLocationNotifierProvider.notifier,
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
