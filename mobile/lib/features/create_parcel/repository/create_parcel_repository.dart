
import 'dart:developer';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/http_service.dart';
import 'package:mobile/features/create_parcel/dto/create_parcel_dto.dart';
import 'package:mobile/features/companies/models/quotation_model.dart';
class CreateParcelRepository {

  final HttpService _httpService;
  CreateParcelRepository(this._httpService);

  Future<Quotations> createParcel(CreateParcelDto dto) async {

    final res = await _httpService.post(
      "shipment-requests",
      data: dto.toJson()
    );
    log(dto.toString());
    log(res.data.toString());
    

    Quotations quotations = Quotations.fromJson(res.data['data']);

    return quotations;
  }

  
}

final createParcelRepositoryProvider = Provider<CreateParcelRepository>((ref) {
  final httpService = ref.read(httpServiceProvider);
  return CreateParcelRepository(httpService);
});
