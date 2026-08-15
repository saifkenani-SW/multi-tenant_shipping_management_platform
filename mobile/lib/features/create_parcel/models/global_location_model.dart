class GlobalLocation {
  final String id;
  final String name;
  final String type;
  final String? parentId;
  final double longitude;
  final double latitude;

  const GlobalLocation({
    required this.id,
    required this.name,
    required this.type,
    this.parentId,
    required this.longitude,
    required this.latitude,
  });

  factory GlobalLocation.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>;

    return GlobalLocation(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      parentId: json['parentId'] as String?,
      longitude: (location['longitude'] as num).toDouble(),
      latitude: (location['latitude'] as num).toDouble(),
    );
  }
}