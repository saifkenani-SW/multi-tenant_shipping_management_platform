// Search Query Provider
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:mobile/features/companies/models/shipping_company_model.dart';

final searchQueryProvider = StateProvider<String>((ref) => '');

// Shipping Companies Provider (Mock Data)
final shippingCompaniesProvider = Provider<List<ShippingCompany>>((ref) {
  return [
    ShippingCompany(
      id: '1',
      nameEn: 'Aramex',
      nameAr: 'رامكس',
      logoUrl: '',
      price: 35.00,
      deliveryTime: '2-3 أيام',
      features: ['تتبع مباشر للطرود', 'توصيل للمنزل'],
      sideBorderColor: Colors.blue,
    ),
    ShippingCompany(
      id: '2',
      nameEn: 'SMSA',
      nameAr: 'سمسا اكسبريس',
      logoUrl: '',
      price: 25.00,
      oldPrice: 45.00,
      deliveryTime: '24 ساعة',
      features: ['تنبيهات نصية', 'تأمين شامل'],
      hasOffer: true,
      sideBorderColor: Colors.deepOrange,
    ),
    ShippingCompany(
      id: '3',
      nameEn: 'DHL',
      nameAr: 'دي اتش ال',
      logoUrl: '',
      price: 120.00,
      deliveryTime: '2-4 أيام',
      features: ['شحن دولي ممتاز', 'تأمين كامل على الشحنة'],
      sideBorderColor: Colors.blue,
    ),
    ShippingCompany(
      id: '4',
      nameEn: 'FedEx',
      nameAr: 'فيديكس',
      logoUrl: '',
      price: 60.00,
      oldPrice: 85.00,
      deliveryTime: '1-2 أيام',
      features: ['تتبع مباشر للطرود', 'تنبيهات نصية'],
      hasOffer: true,
      sideBorderColor: Colors.deepOrange,
    ),
    ShippingCompany(
      id: '5',
      nameEn: 'Zajil',
      nameAr: 'زاجل',
      logoUrl: '',
      price: 20.00,
      deliveryTime: '3-5 أيام',
      features: ['الخيار الاقتصادي', 'توصيل للمنزل متاح'],
      sideBorderColor: Colors.blue,
    ),
  ];
});
