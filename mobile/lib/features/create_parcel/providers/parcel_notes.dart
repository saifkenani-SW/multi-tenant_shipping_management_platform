import 'package:flutter_riverpod/flutter_riverpod.dart';

class ParcelWarningsState {
  final bool fragile;
  final bool liquids;
  final bool valuables;
  final bool batteries;

  ParcelWarningsState({
    this.fragile = false,
    this.liquids = false,
    this.valuables = false,
    this.batteries = false,
  });

  ParcelWarningsState copyWith({
    bool? fragile,
    bool? liquids,
    bool? valuables,
    bool? batteries,
  }) {
    return ParcelWarningsState(
      fragile: fragile ?? this.fragile,
      liquids: liquids ?? this.liquids,
      valuables: valuables ?? this.valuables,
      batteries: batteries ?? this.batteries,
    );
  }
}

class ParcelWarningsNotifier extends Notifier<ParcelWarningsState> {
  @override
  ParcelWarningsState build() => ParcelWarningsState();

  void toggleFragile() => state = state.copyWith(fragile: !state.fragile);
  void toggleLiquids() => state = state.copyWith(liquids: !state.liquids);
  void toggleValuables() => state = state.copyWith(valuables: !state.valuables);
  void toggleBatteries() => state = state.copyWith(batteries: !state.batteries);
}

final parcelWarningsProvider =
    NotifierProvider<ParcelWarningsNotifier, ParcelWarningsState>(
      ParcelWarningsNotifier.new,
    );
