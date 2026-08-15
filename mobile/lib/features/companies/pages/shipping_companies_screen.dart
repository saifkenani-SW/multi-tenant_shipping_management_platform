
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:mobile/features/companies/providers/quotations_notifier.dart';

import '../widgets/shipping_card.dart';

class ShippingCompaniesScreen extends ConsumerWidget {
  const ShippingCompaniesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quotations = ref.watch(quotationsNotifierProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F6F9),

        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          title: Text(
            'شركات الشحن',
            style: TextStyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0D2A53),
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: Color(0xFF0D2A53)),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ),

        body: Column(
          children: [
            // Search & Filter
            Container(
              color: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              child: Column(
                children: [
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'ابحث عن شركة شحن...',
                      hintStyle: TextStyle(fontSize: 14.sp, color: Colors.grey),
                      prefixIcon: const Icon(Icons.search, color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFFF1F3F5),
                      contentPadding: EdgeInsets.symmetric(vertical: 0.h),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),

                  SizedBox(height: 12.h),

                  OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(
                      Icons.tune,
                      size: 18,
                      color: Colors.black87,
                    ),
                    label: Text(
                      'تصفية',
                      style: TextStyle(fontSize: 14.sp, color: Colors.black87),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: Size(double.infinity, 40.h),
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 8.h),

            // Quotations
            Expanded(
              child: quotations == null || quotations.quotations.isEmpty
                  ? Center(
                      child: Text(
                        'لا توجد عروض شحن متاحة',
                        style: TextStyle(
                          fontSize: 14.sp,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 8.h,
                      ),
                      itemCount: quotations.quotations.length,
                      itemBuilder: (context, index) {
                        final quotation = quotations.quotations[index];

                        return ShippingCard(quotation: quotation);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
