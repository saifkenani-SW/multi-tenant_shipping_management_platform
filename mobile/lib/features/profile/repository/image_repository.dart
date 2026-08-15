import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/services/http_service.dart';

class ImageRepository {
  final HttpService _httpService;
  ImageRepository(this._httpService);

  Future<String?> getProfileImage() async {
    final res = await _httpService.get(
      "customer/profile",
    );

    final imageUrl = res.data['data']['profileImageUrl'];

    if (imageUrl == null || imageUrl.isEmpty) {
      return null;
    }

    return "https://saifkenani.me$imageUrl";
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
    return "https://saifkenani.me${res.data['data']['profileImageUrl']}";
  }
}

final imageRepositoryProvider = Provider<ImageRepository>((ref) {
  final httpService = ref.read(httpServiceProvider);
  return ImageRepository(httpService);
});
