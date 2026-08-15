import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/companies/models/quotation_model.dart';
import 'package:mobile/features/companies/repository/quotation_repository.dart';

class QuotationsNotifier extends Notifier<Quotations?> {
  @override
  Quotations? build() {
    return null;
  }

  void setQuotations(Quotations quotes) {
    state = quotes;
  }

  void clear() {
    state = null;
  }

  Future<bool> approveQuotation(String id)async{
    final res = await ref.read(quotationRepositoryProvider).approveQuotation(id);
    return res;
  }
  
}

final quotationsNotifierProvider =
    NotifierProvider<QuotationsNotifier, Quotations?>(
  QuotationsNotifier.new,
);