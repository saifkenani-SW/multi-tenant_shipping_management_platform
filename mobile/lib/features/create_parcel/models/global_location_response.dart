import 'package:mobile/features/create_parcel/models/global_location_meta.dart';
import 'package:mobile/features/create_parcel/models/global_location_model.dart';

class GlobalLocationsResponse {
  final List<GlobalLocation> data;
  final GlobalLocationMeta meta;

  const GlobalLocationsResponse({
    required this.data,
    required this.meta,
  });

  factory GlobalLocationsResponse.fromJson(
    Map<String, dynamic> json,
  ) {
    return GlobalLocationsResponse(
      data: (json['data'] as List)
          .map(
            (item) => GlobalLocation.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList(),
      meta: GlobalLocationMeta.fromJson(
        json['meta'] as Map<String, dynamic>,
      ),
    );
  }
}