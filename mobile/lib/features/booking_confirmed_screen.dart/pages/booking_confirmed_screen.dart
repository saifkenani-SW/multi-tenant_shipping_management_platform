
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/providers/booking_datails_provider.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/app_button.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/app_card_container.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/app_divider.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/custom_bottom_nav_bar.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/info_column.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/location_row.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/qrcode_container_widget.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/widgets/success_header_widget.dart';

class BookingConfirmedScreen extends ConsumerWidget {
  const BookingConfirmedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(bookingDetailsProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF071426),
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Booking Confirmed',
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward, color: Colors.white),
          onPressed: () {},
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
        child: Column(
          children: [
            // Success Header Widget
            const SuccessHeaderWidget(
              title: 'تم الحجز بنجاح',
              subtitle: 'تم تأكيد طلب الشحن الخاص بك وجاري المعالجة',
            ),
            SizedBox(height: 20.h),

            // Main Details Card Widget
            AppCardContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1867D2).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20.r),
                          border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.4)),
                        ),
                        child: Text(
                          booking.companyName,
                          style: TextStyle(fontSize: 12.sp, color: Colors.blue.shade300, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('BOOKING ID', style: TextStyle(fontSize: 9.sp, color: Colors.grey.shade500, fontWeight: FontWeight.bold)),
                          SizedBox(height: 2.h),
                          Text(booking.bookingId, style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  const AppDivider(),
                  SizedBox(height: 12.h),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      InfoColumn(title: 'Content', value: booking.content),
                      InfoColumn(title: 'Parcel Details', value: booking.parcelDetails, alignment: CrossAxisAlignment.end),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  const AppDivider(),
                  SizedBox(height: 12.h),
                  LocationRow(icon: Icons.location_on_outlined, name: booking.senderName, label: 'Sender'),
                  SizedBox(height: 12.h),
                  LocationRow(icon: Icons.location_on_outlined, name: booking.receiverName, label: 'Receiver'),
                ],
              ),
            ),
            SizedBox(height: 16.h),

            // QR Code Widget
            const QrCodeContainerWidget(
              instructionText: 'أظهر هذا الرمز لموظف الاستقبال',
            ),
            SizedBox(height: 20.h),

            // Action Buttons
            AppButton(
              text: 'Download Receipt',
              icon: Icons.download,
              onPressed: () {},
            ),
            SizedBox(height: 12.h),
            AppButton(
              text: 'Return Home',
              icon: Icons.home_outlined,
              isOutlined: true,
              onPressed: () {},
            ),
            SizedBox(height: 20.h),
          ],
        ),
      ),
      bottomNavigationBar: const CustomBottomNavBar(),
    );
  }
}

// ==========================