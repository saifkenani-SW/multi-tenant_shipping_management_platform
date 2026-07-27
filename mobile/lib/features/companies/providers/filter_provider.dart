// Filtered List Provider
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/companies/models/shipping_company_model.dart';
import 'package:mobile/features/companies/providers/search_query_provider.dart';

final filteredCompaniesProvider = Provider<List<ShippingCompany>>((ref) {
  final query = ref.watch(searchQueryProvider).toLowerCase();
  final companies = ref.watch(shippingCompaniesProvider);

  if (query.isEmpty) return companies;
  return companies.where((c) =>
      c.nameEn.toLowerCase().contains(query) ||
      c.nameAr.toLowerCase().contains(query)).toList();
});
