
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/create_parcel/widgets/bottom_action_buttons.dart';
import 'package:mobile/features/create_parcel/widgets/features_info_section.dart';
import 'package:mobile/features/create_parcel/widgets/parcel_content_section.dart';
import 'package:mobile/features/create_parcel/widgets/parcel_info_section.dart';
import 'package:mobile/features/create_parcel/widgets/receiver_info_section.dart';
import 'package:mobile/features/create_parcel/widgets/reset_fields_footer.dart';
import 'package:mobile/features/create_parcel/widgets/sender_info_section.dart';

class CreateParcelScreen extends StatelessWidget {
  const CreateParcelScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_forward, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Text(
          'تفاصيل الطرد',
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.bold,
            fontSize: 18.sp,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const ParcelInfoSection(),
              SizedBox(height: 16.h),
              const ParcelContentSection(),
              SizedBox(height: 16.h),
              const SenderInfoSection(),
              SizedBox(height: 16.h),
              const ReceiverInfoSection(), // قسم معلومات المستلم المضاف بالألوان الخاصة
              SizedBox(height: 16.h),
              const FeaturesInfoSection(),
              SizedBox(height: 24.h),
              const BottomActionButtons(),
              SizedBox(height: 12.h),
              const ResetFieldsFooter(),
              SizedBox(height: 20.h),
            ],
          ),
        ),
      ),
    );
  }
}
