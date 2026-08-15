import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/services/http_service.dart';
import 'package:mobile/features/profile/models/profile_model.dart';

class ProfileRepository {
  final HttpService _httpService;
  ProfileRepository(this._httpService);

  Future<ProfileModel> loadProfile() async {
    log("dfsdffsfd");

    final res = await _httpService.get(
      "customer/profile",
    );

    ProfileModel profile = ProfileModel.fromJson(res.data['data']);
    log(" id : " + profile.id);

    return profile;
  }

  Future<String> uploadImage(XFile file) async {
    final multipartFile = await MultipartFile.fromFile(
      file.path,
      filename: 'profile.jpg',
    );
    final formData = FormData.fromMap({'file': multipartFile});
    final res = await _httpService.put(
      "customer/profile/image",
      data: formData,
    );
    return "${res.data['data']['profileImageUrl']}";
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final httpService = ref.read(httpServiceProvider);
  return ProfileRepository(httpService);
});
