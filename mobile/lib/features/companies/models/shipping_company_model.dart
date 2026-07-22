
import 'dart:ui';

class ShippingCompany {
  final String id;
  final String nameEn;
  final String nameAr;
  final String logoUrl;
  final double price;
  final double? oldPrice;
  final String deliveryTime;
  final List<String> features;
  final bool hasOffer;
  final Color sideBorderColor;

  ShippingCompany({
    required this.id,
    required this.nameEn,
    required this.nameAr,
    required this.logoUrl,
    required this.price,
    this.oldPrice,
    required this.deliveryTime,
    required this.features,
    this.hasOffer = false,
    required this.sideBorderColor,
  });
}
