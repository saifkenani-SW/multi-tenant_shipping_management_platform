import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

class ImagePickerNotifier extends Notifier<XFile?> {
  @override
  XFile? build() {
    return null;
  }

  Future<void> pickProfileImage(bool fromCamera) async {
    final picker = ImagePicker();

    final image = await picker.pickImage(
      source: fromCamera
          ? ImageSource.camera
          : ImageSource.gallery,
    );

    if (image == null) return;

    state = image;
  }
}

final imagePickerNotifierProvider =
    NotifierProvider<ImagePickerNotifier, XFile?>(
  ImagePickerNotifier.new,
);