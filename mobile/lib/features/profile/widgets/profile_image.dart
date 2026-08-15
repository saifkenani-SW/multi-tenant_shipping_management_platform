import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/assets/app_assets.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/profile/notifier/image_picker_notifier.dart';

import 'package:mobile/features/profile/notifier/profile_notifier.dart';

class ProfileImage extends ConsumerWidget {
  const ProfileImage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileNotifierProvider);

log('PROFILE STATE: $profileState');

    ref.listen(profileNotifierProvider, (previous, next) {
      next.whenOrNull(
        error: (error, stackTrace) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error.toString()),
            ),
          );
        },
      );
    });

    return Stack(
      alignment: Alignment.bottomLeft,
      children: [
        Container(
          width: 150.w,
          height: 150.h,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(
              color: AppColorsDark.accentBlue,
              width: 2,
            ),
            image: DecorationImage(
              image: profileState.value?.profileImageUrl == null ||
                      profileState.value!.profileImageUrl!.isEmpty
                  ? const AssetImage(
                      AppAssets.defaultProfileImage,
                    )
                  : NetworkImage(
                      "https://saifkenani.me${profileState.value!.profileImageUrl!}",
                    ),
              fit: BoxFit.cover,
            ),
          ),
        ),

        if (profileState.isLoading)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
          ),

        InkWell(
          onTap:profileState.isLoading ? null : () => showImagePickerBottomSheet(context, ref),
          child: Container(
            margin: EdgeInsets.all(4.w),
            padding: EdgeInsets.all(6.w),
            decoration: BoxDecoration(
              color: AppColorsDark.accentBlue,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Icon(
              Icons.edit,
              color: Colors.white,
              size: 14.sp,
            ),
          ),
        ),
      ],
    );
  }

  void showImagePickerBottomSheet(
    BuildContext context,
    WidgetRef ref,
  ) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SizedBox(
          height: 180,
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('الكاميرا'),
                onTap: () async {
                  Navigator.pop(context);

                  await _pickAndUpload(
                    ref,
                    true,
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo),
                title: const Text('المعرض'),
                onTap: () async {
                  Navigator.pop(context);

                  await _pickAndUpload(
                    ref,
                    false,
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickAndUpload(
    WidgetRef ref,
    bool fromCamera,
  ) async {
    await ref
        .read(imagePickerNotifierProvider.notifier)
        .pickProfileImage(fromCamera);

    final image = ref.read(imagePickerNotifierProvider);

    if (image == null) return;


    await ref
        .read(profileNotifierProvider.notifier)
        .updateProfileImage(image);
  }
}