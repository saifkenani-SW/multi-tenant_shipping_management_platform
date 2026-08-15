// 3. أزرار الاختصارات السريعة (Grid)
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        Expanded(
          child: PrimaryButton(
            height: 60,
            onPressed: () =>
                GoRouter.of(context).pushNamed(AppRoutes.createParcelScreen),
            child: Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceEvenly, // توسيط العناصر عمودياً
              // mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "شحن طرد",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18.sp),
                ),
                Icon(Icons.local_shipping, size: 28.sp),
              ],
            ),
          ),
        ),
        SizedBox(width: 20),
        Expanded(
          child: PrimaryButton(
            height: 60,
            onPressed: () {},
            child: Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceEvenly, // توسيط العناصر عمودياً
              children: [
                Text(
                  "تتبع",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18.sp),
                ),
                Icon(Icons.location_on, size: 28.sp),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
