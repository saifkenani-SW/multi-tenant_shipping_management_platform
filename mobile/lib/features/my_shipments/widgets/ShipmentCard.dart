import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/my_shipments/models/Shipment_model.dart';

class ShipmentCard extends StatelessWidget {
  final ShipmentModel shipment;
  final int id;

  const ShipmentCard({super.key, required this.shipment, required this.id});

  @override
  Widget build(BuildContext context) {
    Color badgeColor = _shipmentStatusColor(shipment.status);

    return GestureDetector(
      onTap: () {
        GoRouter.of(context).pushNamed(AppRoutes.shipmentDetailsScreen);
      },
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: AppColorsDark.cardBg,
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  id.toString(),
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColorsDark.textWhite,
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 10.w,
                    vertical: 4.h,
                  ),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    shipment.status.name,
                    style: TextStyle(
                      fontSize: 10.sp,
                      fontWeight: FontWeight.bold,
                      color: badgeColor,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 4.h),
            Text(
              "Company Name",
              style: TextStyle(fontSize: 13.sp, color: AppColorsDark.textGrey),
            ),
            Text(
              "Not Implemented Yet",
              style: TextStyle(fontSize: 13.sp, color: AppColorsDark.textGrey),
            ),
            SizedBox(height: 12.h),
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 16.sp,
                  color: AppColorsDark.textGrey,
                ),
                SizedBox(width: 8.w),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DESTINATION',
                      style: TextStyle(
                        fontSize: 9.sp,
                        color: AppColorsDark.textGrey,
                      ),
                    ),
                    Text(
                      "Not Implemented Yet",
                      style: TextStyle(
                        fontSize: 13.sp,
                        color: AppColorsDark.textWhite,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 8.h),
            Row(
              children: [
                Icon(
                  shipment.status == 'DELIVERED'
                      ? Icons.check_circle_outline
                      : Icons.calendar_today_outlined,
                  size: 16.sp,
                  color: AppColorsDark.textGrey,
                ),
                SizedBox(width: 8.w),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shipment.status == 'DELIVERED'
                          ? 'DELIVERED ON'
                          : 'ESTIMATED ARRIVAL',
                      style: TextStyle(
                        fontSize: 9.sp,
                        color: AppColorsDark.textGrey,
                      ),
                    ),
                    Text(
                      "Not Implemented Yet",
                      style: TextStyle(
                        fontSize: 13.sp,
                        color: AppColorsDark.textWhite,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 16.h),
            SizedBox(
              width: double.infinity,
              height: 44.h,
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      shipment.status == 'DELIVERED' ||
                          shipment.status == 'PENDING'
                      ? Colors.transparent
                      : AppColorsDark.accentBlue,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10.r),
                    side:
                        shipment.status == 'DELIVERED' ||
                            shipment.status == 'PENDING'
                        ? BorderSide(
                            color: AppColorsDark.textGrey.withOpacity(0.3),
                          )
                        : BorderSide.none,
                  ),
                ),
                child: Text(
                  shipment.status == 'DELIVERED'
                      ? 'Reorder Shipping'
                      : (shipment.status == 'PENDING'
                            ? 'View Details'
                            : 'Track Shipment'),
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: AppColorsDark.textWhite,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _shipmentStatusColor(Status status) {
    Color color;
    switch (status) {
      case Status.In_Transit:
        color = AppColorsDark.accentBlue;
      case Status.PENDING:
        color = Colors.orangeAccent;
      case Status.CUSTOMER_APPROVED:
        color = Colors.teal;
    }
    return color;
  }
}
