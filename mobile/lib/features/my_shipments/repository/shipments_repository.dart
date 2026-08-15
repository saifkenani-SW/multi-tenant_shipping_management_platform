import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/http_service.dart';
import 'package:mobile/features/my_shipments/models/Shipment_model.dart';

class ShipmentsRepository {
  final HttpService _httpService;

  ShipmentsRepository(this._httpService);

  Future<Shipments> getShipments(String? cursor,) async {
    final response = await _httpService.get(
      'shipment-requests',
      requiresAuth: true,
        queryParameters: {
      if (cursor != null) 'cursor': cursor,
    },
    );

    return Shipments.fromJson(response.data);
  }
}

final shipmentsRepositoryProvider = Provider<ShipmentsRepository>((ref) {
  final httpService = ref.read(httpServiceProvider);

  return ShipmentsRepository(httpService);
});
