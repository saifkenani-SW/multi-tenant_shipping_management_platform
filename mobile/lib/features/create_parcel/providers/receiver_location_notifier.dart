import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/create_parcel/models/global_location_model.dart';
import 'package:mobile/features/create_parcel/repository/golbal_location_repositroy.dart';
import 'package:mobile/features/create_parcel/providers/states/location_state.dart';

final receiverLocationNotifierProvider =
    AsyncNotifierProvider<
      ReceiverGlobalLocationNotifier,
      LocationSelectionState
    >(
      ReceiverGlobalLocationNotifier.new,
    );

class ReceiverGlobalLocationNotifier
    extends AsyncNotifier<LocationSelectionState> {

  @override
  Future<LocationSelectionState> build() async {
    final response = await ref
        .read(globalLocationRepositoryProvider)
        .getLocations(
          type: 'COUNTRY',
          limit: 10,
        );

    final countryLevel = LocationLevelState(
      type: 'COUNTRY',
      locations: response.data,
      nextCursor: response.meta.nextCursor,
      hasNextPage: response.meta.hasNextPage,
    );

    return LocationSelectionState(
      levels: [countryLevel],
    );
  }

  Future<void> selectLocation(
  int levelIndex,
  GlobalLocation location,
) async {
  final currentState = state.value;

  if (currentState == null) return;

  // نحذف كل المستويات التي بعد المستوى الحالي
  final levels = currentState.levels
      .take(levelIndex + 1)
      .toList();

  // حفظ الاختيار
  final currentLevel = levels[levelIndex];

  levels[levelIndex] = currentLevel.copyWith(
    selectedLocation: location,
  );

  state = AsyncData(
    LocationSelectionState(
      levels: levels,
    ),
  );

  // جلب أبناء الموقع
  await _loadChildren(
    parentId: location.id,
    levelIndex: levelIndex + 1,
  );
}

Future<void> _loadChildren({
  required String parentId,
  required int levelIndex,
}) async {
  final currentState = state.value;

  if (currentState == null) return;

  final response = await ref
      .read(globalLocationRepositoryProvider)
      .getLocations(
        parentId: parentId,
        limit: 10,
      );

  // لا يوجد أبناء
  if (response.data.isEmpty) {
    return;
  }

  final levels = [
    ...currentState.levels,
    LocationLevelState(
      parentId: parentId,
      type: response.data.first.type,
      locations: response.data,
      nextCursor: response.meta.nextCursor,
      hasNextPage: response.meta.hasNextPage,
    ),
  ];

  state = AsyncData(
    LocationSelectionState(
      levels: levels,
    ),
  );
}
}