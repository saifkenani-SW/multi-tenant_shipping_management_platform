class OfferDetailsModel {
  final String name;
  final String description;
  final double rating;
  final int reviewsCount;
  final double price;
  final String deliveryTime;
  final List<Map<String, String>> features;
  final String aboutText;
  final String branchesCount;
  final String supportTime;
  final String satisfactionRate;

  OfferDetailsModel({
    required this.name,
    required this.description,
    required this.rating,
    required this.reviewsCount,
    required this.price,
    required this.deliveryTime,
    required this.features,
    required this.aboutText,
    required this.branchesCount,
    required this.supportTime,
    required this.satisfactionRate,
  });
}
