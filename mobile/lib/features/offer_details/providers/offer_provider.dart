import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/offer_details/models/offer_details_model.dart';

final companyDetailsProvider = Provider<OfferDetailsModel>((ref) {
  return OfferDetailsModel(
    name: 'سريع للنقل اللوجستي',
    description: 'نحن نقدم حلول شحن متكاملة تجمع بين السرعة الفائقة والأمان المضمون لجميع شحناتكم التجارية والشخصية داخل المملكة.',
    rating: 4.9,
    reviewsCount: 1200,
    price: 35.00,
    deliveryTime: '2-3 أيام',
    features: [
      {'title': 'تتبع مباشر', 'subtitle': 'Live Tracking'},
      {'title': 'توصيل للمنزل', 'subtitle': 'Home Delivery'},
      {'title': 'تأمين شامل', 'subtitle': 'Insurance Included'},
      {'title': 'تنبيهات نصية', 'subtitle': 'SMS Notifications'},
    ],
    aboutText: 'تعتبر شركتنا رائدة في مجال النقل السريع منذ عام 2010. نحن نلتزم بأعلى معايير الجودة لضمان وصول شحناتكم في Моucеد المحدد وبحالة ممتازة. أسطولنا مجهز بأحدث تقنيات التبريد والمراقبة لخدمتكم بشكل أفضل.',
    branchesCount: '+150',
    supportTime: '24/7',
    satisfactionRate: '99%',
  );
});