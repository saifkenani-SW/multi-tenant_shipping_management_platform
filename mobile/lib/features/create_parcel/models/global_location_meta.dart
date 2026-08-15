class GlobalLocationMeta {
  final bool hasNextPage;
  final bool hasPreviousPage;
  final String? nextCursor;
  final String? previousCursor;

  const GlobalLocationMeta({
    required this.hasNextPage,
    required this.hasPreviousPage,
    this.nextCursor,
    this.previousCursor,
  });

  factory GlobalLocationMeta.fromJson(Map<String, dynamic> json) {
    return GlobalLocationMeta(
      hasNextPage: json['hasNextPage'] as bool,
      hasPreviousPage: json['hasPreviousPage'] as bool,
      nextCursor: json['nextCursor'] as String?,
      previousCursor: json['previousCursor'] as String?,
    );
  }
}