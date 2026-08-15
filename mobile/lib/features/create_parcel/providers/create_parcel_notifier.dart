import 'dart:async';
import 'dart:developer';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile/features/companies/models/quotation_model.dart';
import 'package:mobile/features/create_parcel/dto/create_parcel_dto.dart';
import 'package:mobile/features/create_parcel/repository/create_parcel_repository.dart';

class CreateParcelNotifier extends AsyncNotifier<Quotations?> {
  @override
  FutureOr<Quotations?> build() {
    return null;
  }

  Future<Quotations?> createParcel(
    CreateParcelDto dto,
  ) async {
    state = const AsyncLoading();

    log(dto.toJson().toString());

    final result = await AsyncValue.guard<Quotations>(
      () {
        return ref
            .read(createParcelRepositoryProvider)
            .createParcel(dto);
      },
    );

    state = result;

    if (result.hasError) {
      return null;
    }

    final quotations = result.value;

    if (quotations == null) {
      return null;
    }

    
    return quotations;
  }
}

final createParcelNotifierProvider =
    AsyncNotifierProvider<CreateParcelNotifier, Quotations?>(
  CreateParcelNotifier.new,
);