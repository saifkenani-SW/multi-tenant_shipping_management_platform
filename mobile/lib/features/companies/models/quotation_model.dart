class Quotations {
  final List<Quotation> quotations;

  Quotations({required this.quotations});

  factory Quotations.fromJson(Map<String, dynamic> json) {
    return Quotations(
      quotations:
          (json['quotations'] as List<dynamic>?)
              ?.map((e) => Quotation.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {'quotations': quotations.map((e) => e.toJson()).toList()};
  }

  Quotations copyWith({List<Quotation>? quotations}) {
    return Quotations(quotations: quotations ?? this.quotations);
  }
}

class Quotation {
  final String id;
  final String tenantId;
  final String tenantName;
  final String shipmentRequestId;
  final String originOrgUnitId;
  final String originOrgUnitName;
  final String destinationOrgUnitId;
  final String destinationOrgUnitName;
  final String serviceLevel;
  final String quotationType;
  final int? basePrice;
  final double? weightCharge;
  final int? extraFees;
  final double? amount;
  final String currency;
  final PricingSnapshot? pricingSnapshot;
  final dynamic validUntil;
  final String status;
  final String? notes;

  Quotation({
    required this.id,
    required this.tenantId,
    required this.tenantName,
    required this.shipmentRequestId,
    required this.originOrgUnitId,
    required this.originOrgUnitName,
    required this.destinationOrgUnitId,
    required this.destinationOrgUnitName,
    required this.serviceLevel,
    required this.quotationType,
    required this.basePrice,
    required this.weightCharge,
    required this.extraFees,
    required this.amount,
    required this.currency,
    required this.pricingSnapshot,
    required this.validUntil,
    required this.status,
    this.notes,
  });

  factory Quotation.fromJson(Map<String, dynamic> json) {
    return Quotation(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      tenantName: json['tenantName'] as String,
      shipmentRequestId: json['shipmentRequestId'] as String,
      originOrgUnitId: json['originOrgUnitId'] as String,
      originOrgUnitName: json['originOrgUnitName'] as String,
      destinationOrgUnitId: json['destinationOrgUnitId'] as String,
      destinationOrgUnitName: json['destinationOrgUnitName'] as String,
      serviceLevel: json['serviceLevel'] as String,
      quotationType: json['quotationType'] as String,
      basePrice: json['basePrice'] as int?,
      weightCharge: (json['weightCharge'] as num?)?.toDouble(),
      extraFees: json['extraFees'] as int?,
      amount: (json['amount'] as num?)?.toDouble(),
      currency: json['currency'] as String,
      pricingSnapshot: json['pricingSnapshot'] != null
          ? PricingSnapshot.fromJson(
              json['pricingSnapshot'] as Map<String, dynamic>,
            )
          : null,
      validUntil: json['validUntil'],
      status: json['status'] as String,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenantId': tenantId,
      'tenantName': tenantName,
      'shipmentRequestId': shipmentRequestId,
      'originOrgUnitId': originOrgUnitId,
      'originOrgUnitName': originOrgUnitName,
      'destinationOrgUnitId': destinationOrgUnitId,
      'destinationOrgUnitName': destinationOrgUnitName,
      'serviceLevel': serviceLevel,
      'quotationType': quotationType,
      'basePrice': basePrice,
      'weightCharge': weightCharge,
      'extraFees': extraFees,
      'amount': amount,
      'currency': currency,
      'pricingSnapshot': pricingSnapshot?.toJson(),
      'validUntil': validUntil,
      'status': status,
      'notes': notes,
    };
  }

  Quotation copyWith({
    String? id,
    String? tenantId,
    String? tenantName,
    String? shipmentRequestId,
    String? originOrgUnitId,
    String? originOrgUnitName,
    String? destinationOrgUnitId,
    String? destinationOrgUnitName,
    String? serviceLevel,
    String? quotationType,
    int? basePrice,
    double? weightCharge,
    int? extraFees,
    double? amount,
    String? currency,
    PricingSnapshot? pricingSnapshot,
    dynamic validUntil,
    String? status,
    String? notes,
  }) {
    return Quotation(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      tenantName: tenantName ?? this.tenantName,
      shipmentRequestId: shipmentRequestId ?? this.shipmentRequestId,
      originOrgUnitId: originOrgUnitId ?? this.originOrgUnitId,
      originOrgUnitName: originOrgUnitName ?? this.originOrgUnitName,
      destinationOrgUnitId: destinationOrgUnitId ?? this.destinationOrgUnitId,
      destinationOrgUnitName:
          destinationOrgUnitName ?? this.destinationOrgUnitName,
      serviceLevel: serviceLevel ?? this.serviceLevel,
      quotationType: quotationType ?? this.quotationType,
      basePrice: basePrice ?? this.basePrice,
      weightCharge: weightCharge ?? this.weightCharge,
      extraFees: extraFees ?? this.extraFees,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      pricingSnapshot: pricingSnapshot ?? this.pricingSnapshot,
      validUntil: validUntil ?? this.validUntil,
      status: status ?? this.status,
      notes: notes ?? this.notes,
    );
  }
}

class PricingSnapshot {
  final double expectedTotalWeightKg;
  final int expectedLengthCm;
  final int expectedWidthCm;
  final int expectedHeightCm;
  final int volumetricDivisor;
  final int basePrice;
  final int baseWeightKg;
  final double pricePerExtraKg;
  final double calculatedVolumetricWeightKg;
  final double calculatedChargeableWeightKg;

  PricingSnapshot({
    required this.expectedTotalWeightKg,
    required this.expectedLengthCm,
    required this.expectedWidthCm,
    required this.expectedHeightCm,
    required this.volumetricDivisor,
    required this.basePrice,
    required this.baseWeightKg,
    required this.pricePerExtraKg,
    required this.calculatedVolumetricWeightKg,
    required this.calculatedChargeableWeightKg,
  });

  factory PricingSnapshot.fromJson(Map<String, dynamic> json) {
    return PricingSnapshot(
      expectedTotalWeightKg: (json['expectedTotalWeightKg'] as num).toDouble(),
      expectedLengthCm: json['expectedLengthCm'] as int,
      expectedWidthCm: json['expectedWidthCm'] as int,
      expectedHeightCm: json['expectedHeightCm'] as int,
      volumetricDivisor: json['volumetricDivisor'] as int,
      basePrice: json['basePrice'] as int,
      baseWeightKg: json['baseWeightKg'] as int,
      pricePerExtraKg: (json['pricePerExtraKg'] as num).toDouble(),
      calculatedVolumetricWeightKg:
          (json['calculatedVolumetricWeightKg'] as num).toDouble(),
      calculatedChargeableWeightKg:
          (json['calculatedChargeableWeightKg'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'expectedTotalWeightKg': expectedTotalWeightKg,
      'expectedLengthCm': expectedLengthCm,
      'expectedWidthCm': expectedWidthCm,
      'expectedHeightCm': expectedHeightCm,
      'volumetricDivisor': volumetricDivisor,
      'basePrice': basePrice,
      'baseWeightKg': baseWeightKg,
      'pricePerExtraKg': pricePerExtraKg,
      'calculatedVolumetricWeightKg': calculatedVolumetricWeightKg,
      'calculatedChargeableWeightKg': calculatedChargeableWeightKg,
    };
  }

  PricingSnapshot copyWith({
    double? expectedTotalWeightKg,
    int? expectedLengthCm,
    int? expectedWidthCm,
    int? expectedHeightCm,
    int? volumetricDivisor,
    int? basePrice,
    int? baseWeightKg,
    double? pricePerExtraKg,
    double? calculatedVolumetricWeightKg,
    double? calculatedChargeableWeightKg,
  }) {
    return PricingSnapshot(
      expectedTotalWeightKg:
          expectedTotalWeightKg ?? this.expectedTotalWeightKg,
      expectedLengthCm: expectedLengthCm ?? this.expectedLengthCm,
      expectedWidthCm: expectedWidthCm ?? this.expectedWidthCm,
      expectedHeightCm: expectedHeightCm ?? this.expectedHeightCm,
      volumetricDivisor: volumetricDivisor ?? this.volumetricDivisor,
      basePrice: basePrice ?? this.basePrice,
      baseWeightKg: baseWeightKg ?? this.baseWeightKg,
      pricePerExtraKg: pricePerExtraKg ?? this.pricePerExtraKg,
      calculatedVolumetricWeightKg:
          calculatedVolumetricWeightKg ?? this.calculatedVolumetricWeightKg,
      calculatedChargeableWeightKg:
          calculatedChargeableWeightKg ?? this.calculatedChargeableWeightKg,
    );
  }
}
