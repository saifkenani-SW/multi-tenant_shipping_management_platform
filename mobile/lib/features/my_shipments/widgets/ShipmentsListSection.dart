import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/my_shipments/notifier/shipments_notifier.dart';
import 'package:mobile/features/my_shipments/widgets/ShipmentCard.dart';

class ShipmentsListSection extends ConsumerWidget {
  const ShipmentsListSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shipmentsState = ref.watch(shipmentsNotifierProvider);

    return shipmentsState.when(
      loading: () => const Center(child: CircularProgressIndicator()),

      error: (error, stackTrace) =>
          const Center(child: Text('حدث خطأ أثناء تحميل الشحنات')),

      data: (state) {
        final items = state.shipments.data;

        return ListView.separated(
          itemCount: items.length + (state.isLoadingMore ? 1 : 0),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),

          separatorBuilder: (context, index) {
            return SizedBox(height: 16.h);
          },

          itemBuilder: (context, index) {
            // Loading أسفل القائمة
            if (index == items.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            }

            final shipment = items[index];

            return ShipmentCard(shipment: shipment, id: index);
          },
        );
      },
    );
  }
}
