
class CreateParcelDto {
  final String originGlobalLocationId;
  final String destinationGlobalLocationId;
  final String senderName;
  final String senderPhone;
  final String receiverName;
  final String receiverPhone;
  final int expectedPiecesCount;
  final double expectedTotalWeightKg;
  final double expectedLengthCm;
  final double expectedWidthCm;
  final double expectedHeightCm;

  // Optional fields
  final String? notes;
  final double? receiverLat;
  final double? receiverLng;
  final double? senderLat;
  final double? senderLng;
  final String? targetTenantId;

  CreateParcelDto({
    required this.originGlobalLocationId,
    required this.destinationGlobalLocationId,
    required this.senderName,
    required this.senderPhone,
    required this.receiverName,
    required this.receiverPhone,
    required this.expectedPiecesCount,
    required this.expectedTotalWeightKg,
    required this.expectedLengthCm,
    required this.expectedWidthCm,
    required this.expectedHeightCm,
     this.notes,
    this.receiverLat,
    this.receiverLng,
    this.senderLat,
    this.senderLng,
    this.targetTenantId,
  });

  factory CreateParcelDto.fromJson(Map<String, dynamic> json) {
    return CreateParcelDto(
      originGlobalLocationId:
          json['originGlobalLocationId'] as String,
      destinationGlobalLocationId:
          json['destinationGlobalLocationId'] as String,
      senderName: json['senderName'] as String,
      senderPhone: json['senderPhone'] as String,
      receiverName: json['receiverName'] as String,
      receiverPhone: json['receiverPhone'] as String,
      expectedPiecesCount:
          json['expectedPiecesCount'] as int,
      expectedTotalWeightKg:
          (json['expectedTotalWeightKg'] as num).toDouble(),
      expectedLengthCm:
          json['expectedLengthCm'] as double,
      expectedWidthCm:
          json['expectedWidthCm'] as double,
      expectedHeightCm:
          json['expectedHeightCm'] as double,
      notes: json['notes'] as String,

      receiverLat:
          (json['receiver_lat'] as num?)?.toDouble(),
      receiverLng:
          (json['receiver_lng'] as num?)?.toDouble(),
      senderLat:
          (json['sender_lat'] as num?)?.toDouble(),
      senderLng:
          (json['sender_lng'] as num?)?.toDouble(),
      targetTenantId:
          json['target_tenant_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'origin_global_location_id': originGlobalLocationId,
      'destination_global_location_id': destinationGlobalLocationId,
      'sender_name': senderName,
      'sender_phone': senderPhone,
      'receiver_name': receiverName,
      'receiver_phone': receiverPhone,
      'expected_pieces_count': expectedPiecesCount,
      'expected_total_weight_kg': expectedTotalWeightKg,
      'expected_length_cm': expectedLengthCm,
      'expected_width_cm': expectedWidthCm,
      'expected_height_cm': expectedHeightCm,
      'notes': notes,

      'receiver_lat': receiverLat,
      'receiver_lng': receiverLng,
      'sender_lat': senderLat,
      'sender_lng': senderLng,
      'target_tenant_id': targetTenantId,
    };
  }

  CreateParcelDto copyWith({
    String? originGlobalLocationId,
    String? destinationGlobalLocationId,
    String? senderName,
    String? senderPhone,
    String? receiverName,
    String? receiverPhone,
    int? expectedPiecesCount,
    double? expectedTotalWeightKg,
    double? expectedLengthCm,
    double? expectedWidthCm,
    double? expectedHeightCm,
    String? notes,
    double? receiverLat,
    double? receiverLng,
    double? senderLat,
    double? senderLng,
    String? targetTenantId,
  }) {
    return CreateParcelDto(
      originGlobalLocationId:
          originGlobalLocationId ?? this.originGlobalLocationId,
      destinationGlobalLocationId:
          destinationGlobalLocationId ?? this.destinationGlobalLocationId,
      senderName: senderName ?? this.senderName,
      senderPhone: senderPhone ?? this.senderPhone,
      receiverName: receiverName ?? this.receiverName,
      receiverPhone: receiverPhone ?? this.receiverPhone,
      expectedPiecesCount:
          expectedPiecesCount ?? this.expectedPiecesCount,
      expectedTotalWeightKg:
          expectedTotalWeightKg ?? this.expectedTotalWeightKg,
      expectedLengthCm:
          expectedLengthCm ?? this.expectedLengthCm,
      expectedWidthCm:
          expectedWidthCm ?? this.expectedWidthCm,
      expectedHeightCm:
          expectedHeightCm ?? this.expectedHeightCm,
      notes: notes ?? this.notes,

      receiverLat: receiverLat ?? this.receiverLat,
      receiverLng: receiverLng ?? this.receiverLng,
      senderLat: senderLat ?? this.senderLat,
      senderLng: senderLng ?? this.senderLng,
      targetTenantId: targetTenantId ?? this.targetTenantId,
    );
  }
}

