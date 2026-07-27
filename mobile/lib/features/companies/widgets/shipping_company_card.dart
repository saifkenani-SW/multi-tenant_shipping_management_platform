
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/companies/models/shipping_company_model.dart';

class ShippingCard extends StatelessWidget {
  final ShippingCompany company;

  const ShippingCard({super.key, required this.company});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16.r),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(
              top: BorderSide(color: Colors.grey.shade200, width: 1),
              left: BorderSide(color: Colors.grey.shade200, width: 1),
              bottom: BorderSide(color: Colors.grey.shade200, width: 1),
              right: BorderSide(
                color: company.sideBorderColor,
                width: 4.w,
              ), // الحد الملون الجانبي المطلوب
            ),
          ),
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Name & Logo/Offer Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            company.nameEn,
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1867D2),
                            ),
                          ),
                          if (company.hasOffer) ...[
                            SizedBox(width: 8.w),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8.w, vertical: 2.h),
                              decoration: BoxDecoration(
                                color: Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(4.r),
                                border: Border.all(color: Colors.orange.shade200),
                              ),
                              child: Text(
                                'عرض',
                                style: TextStyle(
                                  fontSize: 10.sp,
                                  color: Colors.deepOrange,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        company.nameAr,
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 50.w,
                    height: 35.h,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade200),
                      borderRadius: BorderRadius.circular(6.r),
                    ),
                    child: Center(
                      child: Text(
                        company.nameEn,
                        style: TextStyle(
                            fontSize: 10.sp, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
              Divider(height: 24.h, color: Colors.grey.shade200),
              
              // Pricing Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'سعر الشحن',
                    style: TextStyle(
                        fontSize: 12.sp, color: Colors.grey.shade600),
                  ),
                  Row(
                    children: [
                      if (company.oldPrice != null) ...[
                        Text(
                          '${company.oldPrice!.toStringAsFixed(2)} ر.س',
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: Colors.grey,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        SizedBox(width: 8.w),
                      ],
                      Text(
                        '${company.price.toStringAsFixed(2)} ر.س',
                        style: TextStyle(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.bold,
                          color: company.hasOffer
                              ? Colors.deepOrange
                              : const Color(0xFF1867D2),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              SizedBox(height: 12.h),

              // Delivery Time
              Row(
                children: [
                  Icon(Icons.access_time, size: 16.sp, color: Colors.blue),
                  SizedBox(width: 6.w),
                  Text(
                    'زمن التوصيل: ${company.deliveryTime}',
                    style: TextStyle(
                        fontSize: 12.sp, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              SizedBox(height: 8.h),

              // Features List
              ...company.features.map((feature) => Padding(
                    padding: EdgeInsets.only(top: 4.h),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_outline,
                            size: 14.sp, color: Colors.grey),
                        SizedBox(width: 6.w),
                        Text(
                          feature,
                          style: TextStyle(
                              fontSize: 12.sp, color: Colors.grey.shade700),
                        ),
                      ],
                    ),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

