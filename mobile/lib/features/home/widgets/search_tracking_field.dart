import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';


// 2. خانة البحث والتتبع
class SearchTrackingField extends StatelessWidget {
  const SearchTrackingField({super.key});

  @override
  Widget build(BuildContext context) {
    return TextField(
      decoration: InputDecoration(
        hintText: 'تتبع شحنتك ...',
        prefixIcon: Icon(Icons.my_location, color: AppColorsDark.textGrey, size: 20.sp),
      ),
    );
  }
}

