import 'package:mobile/features/create_parcel/models/global_location_model.dart';

class LocationLevelState {
  final String? parentId;
  final String type;
  final List<GlobalLocation> locations;

  final GlobalLocation? selectedLocation;

  final String search;
  final String? nextCursor;

  final bool hasNextPage;
  final bool isLoadingMore;
  final bool isSearching;

  const LocationLevelState({
    this.parentId,
    required this.type,
    this.locations = const [],
    this.selectedLocation,
    this.search = '',
    this.nextCursor,
    this.hasNextPage = false,
    this.isLoadingMore = false,
    this.isSearching = false,
  });

  LocationLevelState copyWith({
    String? parentId,
    String? type,
    List<GlobalLocation>? locations,
    GlobalLocation? selectedLocation,
    String? search,
    String? nextCursor,
    bool? hasNextPage,
    bool? isLoadingMore,
    bool? isSearching,
  }) {
    return LocationLevelState(
      parentId: parentId ?? this.parentId,
      type: type ?? this.type,
      locations: locations ?? this.locations,
      selectedLocation: selectedLocation ?? this.selectedLocation,
      search: search ?? this.search,
      nextCursor: nextCursor ?? this.nextCursor,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isSearching: isSearching ?? this.isSearching,
    );
  }
}

class LocationSelectionState {
  final List<LocationLevelState> levels;

  const LocationSelectionState({
    this.levels = const [],
  });

  String? get selectedLocationId {
    for (final level in levels.reversed) {
      if (level.selectedLocation != null) {
        return level.selectedLocation!.id;
      }
    }

    return null;
  }
}