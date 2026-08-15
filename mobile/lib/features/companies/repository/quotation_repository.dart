

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/http_service.dart';

class QuotationRepository {

  final HttpService _httpService;
  QuotationRepository(this._httpService);

  Future<bool> approveQuotation(String quoteId) async{
    final res = await _httpService.post("quotations/$quoteId/approve");
    return res.data["success"];
  }

  
}

final quotationRepositoryProvider = Provider<QuotationRepository>((ref) {
  final httpService = ref.read(httpServiceProvider);
  return QuotationRepository(httpService);
});
