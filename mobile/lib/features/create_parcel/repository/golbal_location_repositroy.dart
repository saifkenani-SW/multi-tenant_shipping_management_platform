import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/http_service.dart';
import 'package:mobile/features/create_parcel/models/global_location_response.dart';

class GlobalLocationRepository {
  final HttpService _httpService;

  GlobalLocationRepository(this._httpService);

  Future<GlobalLocationsResponse> getLocations({
    String? name,
    String? type,
    String? parentId,
    String? cursor,
    int limit = 10,
  }) async {
    final response = await _httpService.get(
      'global-locations',
      queryParameters: {
        if (name != null && name.isNotEmpty)
          'name': name,

        'type': ?type,

        'parentId': ?parentId,

        'cursor': ?cursor,

        'limit': limit,
      },
    );

    return GlobalLocationsResponse.fromJson(
      response.data,
    );
  }
}

final globalLocationRepositoryProvider = Provider((ref) {
  return GlobalLocationRepository(
    ref.read(httpServiceProvider),
  );
});