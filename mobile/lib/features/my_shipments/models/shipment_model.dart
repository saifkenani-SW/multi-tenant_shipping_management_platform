class Meta {
  final bool hasNextPage;
  final bool hasPreviousPage;
  final String nextCursor;
  final dynamic previousCursor;

  Meta({
    required this.hasNextPage,
    required this.hasPreviousPage,
    required this.nextCursor,
    required this.previousCursor,
  });

  factory Meta.fromJson(Map<String, dynamic> json) {
    return Meta(
      hasNextPage: json['hasNextPage'] as bool,
      hasPreviousPage: json['hasPreviousPage'] as bool,
      nextCursor: json['nextCursor'] as String,
      previousCursor: json['previousCursor'],
    );
  }

  Meta copyWith({
    bool? hasNextPage,
    bool? hasPreviousPage,
    String? nextCursor,
    dynamic previousCursor,
  }) =>
      Meta(
        hasNextPage: hasNextPage ?? this.hasNextPage,
        hasPreviousPage:
            hasPreviousPage ?? this.hasPreviousPage,
        nextCursor: nextCursor ?? this.nextCursor,
        previousCursor:
            previousCursor ?? this.previousCursor,
      );
}

enum Status {
  In_Transit,
  CUSTOMER_APPROVED,
  PENDING,
}

Status statusFromJson(String value) {
  switch (value) {
    case 'CUSTOMER_APPROVED':
      return Status.CUSTOMER_APPROVED;

    case 'PENDING':
      return Status.PENDING;

    default:
      throw ArgumentError(
        'Unknown shipment status: $value',
      );
  }
}

enum DestinationGlobalLocationName {
  AL_FAISALIYAH_DISTRICT,
  OLAYA_DISTRICT,
  RIYADH_REGION,
}

DestinationGlobalLocationName destinationGlobalLocationNameFromJson(
  String value,
) {
  switch (value) {
    case 'Al-Faisaliyah District':
      return DestinationGlobalLocationName.AL_FAISALIYAH_DISTRICT;

    case 'Olaya District':
      return DestinationGlobalLocationName.OLAYA_DISTRICT;

    case 'Riyadh Region':
      return DestinationGlobalLocationName.RIYADH_REGION;

    default:
      throw ArgumentError(
        'Unknown destination location: $value',
      );
  }
}

class ShipmentModel {
  final String id;
  final String customerProfileId;
  final String originGlobalLocationId;
  final String originGlobalLocationName;
  final String destinationGlobalLocationId;
  final DestinationGlobalLocationName destinationGlobalLocationName;
  final String senderName;
  final String senderPhone;
  final String receiverName;
  final String receiverPhone;
  final int expectedPiecesCount;
  final double expectedTotalWeightKg;
  final Status status;
  final String? approvedQuotationId;
  final DateTime createdAt;
  final DateTime updatedAt;

  ShipmentModel({
    required this.id,
    required this.customerProfileId,
    required this.originGlobalLocationId,
    required this.originGlobalLocationName,
    required this.destinationGlobalLocationId,
    required this.destinationGlobalLocationName,
    required this.senderName,
    required this.senderPhone,
    required this.receiverName,
    required this.receiverPhone,
    required this.expectedPiecesCount,
    required this.expectedTotalWeightKg,
    required this.status,
    this.approvedQuotationId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ShipmentModel.fromJson(Map<String, dynamic> json) {
    return ShipmentModel(
      id: json['id'] as String,
      customerProfileId: json['customerProfileId'] as String,
      originGlobalLocationId: json['originGlobalLocationId'] as String,
      originGlobalLocationName:
          json['originGlobalLocationName'] as String,
      destinationGlobalLocationId:
          json['destinationGlobalLocationId'] as String,
      destinationGlobalLocationName:
          destinationGlobalLocationNameFromJson(
        json['destinationGlobalLocationName'] as String,
      ),
      senderName: json['senderName'] as String,
      senderPhone: json['senderPhone'] as String,
      receiverName: json['receiverName'] as String,
      receiverPhone: json['receiverPhone'] as String,
      expectedPiecesCount: json['expectedPiecesCount'] as int,
      expectedTotalWeightKg:
          (json['expectedTotalWeightKg'] as num).toDouble(),
      status: statusFromJson(json['status'] as String),
      approvedQuotationId:
          json['approvedQuotationId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  ShipmentModel copyWith({
    String? id,
    String? customerProfileId,
    String? originGlobalLocationId,
    String? originGlobalLocationName,
    String? destinationGlobalLocationId,
    DestinationGlobalLocationName? destinationGlobalLocationName,
    String? senderName,
    String? senderPhone,
    String? receiverName,
    String? receiverPhone,
    int? expectedPiecesCount,
    double? expectedTotalWeightKg,
    Status? status,
    String? approvedQuotationId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      ShipmentModel(
        id: id ?? this.id,
        customerProfileId:
            customerProfileId ?? this.customerProfileId,
        originGlobalLocationId:
            originGlobalLocationId ?? this.originGlobalLocationId,
        originGlobalLocationName:
            originGlobalLocationName ?? this.originGlobalLocationName,
        destinationGlobalLocationId:
            destinationGlobalLocationId ?? this.destinationGlobalLocationId,
        destinationGlobalLocationName:
            destinationGlobalLocationName ??
                this.destinationGlobalLocationName,
        senderName: senderName ?? this.senderName,
        senderPhone: senderPhone ?? this.senderPhone,
        receiverName: receiverName ?? this.receiverName,
        receiverPhone: receiverPhone ?? this.receiverPhone,
        expectedPiecesCount:
            expectedPiecesCount ?? this.expectedPiecesCount,
        expectedTotalWeightKg:
            expectedTotalWeightKg ?? this.expectedTotalWeightKg,
        status: status ?? this.status,
        approvedQuotationId:
            approvedQuotationId ?? this.approvedQuotationId,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}

class Shipments {
  final bool success;
  final List<ShipmentModel> data;
  final Meta meta;

  Shipments({
    required this.success,
    required this.data,
    required this.meta,
  });

  factory Shipments.fromJson(Map<String, dynamic> json) {
    return Shipments(
      success: json['success'] as bool,
      data: (json['data'] as List<dynamic>)
          .map(
            (item) => ShipmentModel.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList(),
      meta: Meta.fromJson(
        json['meta'] as Map<String, dynamic>,
      ),
    );
  }

  Shipments copyWith({
    bool? success,
    List<ShipmentModel>? data,
    Meta? meta,
  }) =>
      Shipments(
        success: success ?? this.success,
        data: data ?? this.data,
        meta: meta ?? this.meta,
      );
}