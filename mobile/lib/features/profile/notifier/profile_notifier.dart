import 'dart:developer';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/features/profile/models/profile_model.dart';
import 'package:mobile/features/profile/repository/profile_repository.dart';

class ProfileNotifier extends AsyncNotifier<ProfileModel?> {
  @override
Future<ProfileModel?> build() async {
  log('ProfileNotifier BUILD');

  final profile = await ref
      .read(profileRepositoryProvider)
      .loadProfile();

  log('Profile loaded: $profile');

  return profile;
}

  Future<void> loadProfile() async {
    state = const AsyncLoading();
    log("fdfs");

    state = await AsyncValue.guard(
      () => ref.read(profileRepositoryProvider).loadProfile(),
    );
  }
Future<void> updateProfileImage(XFile image) async {
  log('UPLOAD START: ${image.path}');

  final currentProfile = state.value;

  if (currentProfile == null) {
    log('UPLOAD FAILED: profile is null');
    return;
  }

  state = const AsyncLoading();

  state = await AsyncValue.guard(
    () async {
      log('CALLING API...');

      final imageUrl = await ref
          .read(profileRepositoryProvider)
          .uploadImage(image);

      log('UPLOAD SUCCESS: $imageUrl');

      return currentProfile.copyWith(
        profileImageUrl: imageUrl,
      );
    },
  );

  log('FINAL STATE: $state');
}
}

final profileNotifierProvider =
    AsyncNotifierProvider<ProfileNotifier, ProfileModel?>(
  ProfileNotifier.new,
);