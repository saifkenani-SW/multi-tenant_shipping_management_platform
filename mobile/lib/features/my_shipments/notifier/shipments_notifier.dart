import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/my_shipments/models/Shipment_model.dart';
import 'package:mobile/features/my_shipments/repository/shipments_repository.dart';

class ShipmentsState {
  final Shipments shipments;
  final bool isLoadingMore;

  const ShipmentsState({
    required this.shipments,
    this.isLoadingMore = false,
  });

  ShipmentsState copyWith({
    Shipments? shipments,
    bool? isLoadingMore,
  }) {
    return ShipmentsState(
      shipments: shipments ?? this.shipments,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}
class ShipmentsNotifier extends AsyncNotifier<ShipmentsState> {
  @override
  FutureOr<ShipmentsState> build() async {
    final shipments = await ref
        .read(shipmentsRepositoryProvider)
        .getShipments(null);

    return ShipmentsState(
      shipments: shipments,
    );
  }

  Future<void> getShipments() async {
    final current = state.value;

    if (current == null) {
      return;
    }

    final shipments = current.shipments;

    if (!shipments.meta.hasNextPage) {
      return;
    }

    if (current.isLoadingMore) {
      return;
    }

    state = AsyncData(
      current.copyWith(
        isLoadingMore: true,
      ),
    );

    try {
      final newShipments = await ref
          .read(shipmentsRepositoryProvider)
          .getShipments(
            shipments.meta.nextCursor,
          );

      final mergedShipments = shipments.copyWith(
        data: [
          ...shipments.data,
          ...newShipments.data,
        ],
        meta: newShipments.meta,
      );

      state = AsyncData(
        ShipmentsState(
          shipments: mergedShipments,
          isLoadingMore: false,
        ),
      );
    } catch (e) {
      // نعيد البيانات القديمة بدون تحويل الشاشة كلها إلى Error
      state = AsyncData(
        current.copyWith(
          isLoadingMore: false,
        ),
      );

      // يمكنك لاحقًا إضافة paginationError هنا
    }
  }
}
final shipmentsNotifierProvider = AsyncNotifierProvider<ShipmentsNotifier, ShipmentsState>(ShipmentsNotifier.new);