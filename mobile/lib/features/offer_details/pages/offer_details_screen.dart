
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/offer_details/providers/offer_provider.dart';

class OfferDetailsScreen extends ConsumerWidget {
  const OfferDetailsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final company = ref.watch(companyDetailsProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF071426),
          elevation: 0,
          centerTitle: true,
          title: Text(
            'تفاصيل الشحن',
            style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: Colors.white),
            onPressed: () {},
          ),
        ),
        body: SingleChildScrollView(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Hero Card
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20.w),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D2137),
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 70.w,
                      height: 50.h,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                      child: Center(
                        child: Icon(Icons.local_shipping, color: const Color(0xFF1867D2), size: 28.sp),
                      ),
                    ),
                    SizedBox(height: 16.h),
                    Text(
                      company.name,
                      style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      company.description,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade400, height: 1.5),
                    ),
                    SizedBox(height: 12.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.star, color: Colors.amber, size: 16.sp),
                        SizedBox(width: 4.w),
                        Text(
                          '${company.rating} (${company.reviewsCount}+ تقييم)',
                          style: TextStyle(fontSize: 12.sp, color: Colors.white70),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16.h),

              // 2. Shipping Price Card
              Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D2137),
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'سعر الشحن / SHIPPING PRICE',
                          style: TextStyle(fontSize: 10.sp, color: const Color(0xFF3883FF), fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 6.h),
                        Text(
                          '${company.price.toStringAsFixed(2)} ر.س',
                          style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Text('شامل ضريبة القيمة المضافة', style: TextStyle(fontSize: 11.sp, color: Colors.grey.shade400)),
                        SizedBox(width: 8.w),
                        Icon(Icons.receipt_long, color: Colors.grey.shade400, size: 20.sp),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16.h),

              // 3. Delivery Time Card (مع الحد البرتقالي المميز على اليسار)
              ClipRRect(
                borderRadius: BorderRadius.circular(16.r),
                child: Container(
                  padding: EdgeInsets.all(16.w),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D2137),
                    border: Border(
                      top: BorderSide(color: const Color(0xFF1867D2).withOpacity(0.3), width: 1),
                      left: const BorderSide(color: Color(0xFFFF5722), width: 4), // الحد البرتقالي المطلوب
                      right: BorderSide(color: const Color(0xFF1867D2).withOpacity(0.3), width: 1),
                      bottom: BorderSide(color: const Color(0xFF1867D2).withOpacity(0.3), width: 1),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'زمن التوصيل / DELIVERY TIME',
                            style: TextStyle(fontSize: 10.sp, color: const Color(0xFFFF8A65), fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 6.h),
                          Text(
                            company.deliveryTime,
                            style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Text('تقدير مبني على المسافة الحالية', style: TextStyle(fontSize: 11.sp, color: Colors.grey.shade400)),
                          SizedBox(width: 8.w),
                          Icon(Icons.access_time, color: Colors.grey.shade400, size: 20.sp),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24.h),

              // Section Title: Features
              Text(
                'المميزات والخدمات',
                style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              SizedBox(height: 12.h),

              // Features Grid/List
              ...company.features.map((feature) => Container(
                    margin: EdgeInsets.only(bottom: 10.h),
                    padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D2137),
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.check_circle_outline, color: const Color(0xFF3883FF), size: 18.sp),
                            SizedBox(width: 12.w),
                            Text(
                              feature['title']!,
                              style: TextStyle(fontSize: 13.sp, color: Colors.white, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        Text(
                          feature['subtitle']!,
                          style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  )),
              SizedBox(height: 24.h),

              // Section Title: About Company
              Text(
                'عن الشركة',
                style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              SizedBox(height: 12.h),

              // About Box
              Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D2137),
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Text(
                      company.aboutText,
                      style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade300, height: 1.6),
                    ),
                    SizedBox(height: 16.h),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: EdgeInsets.all(12.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFF071426),
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                            child: Column(
                              children: [
                                Text(company.branchesCount, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: Colors.blue)),
                                SizedBox(height: 4.h),
                                Text('فرع حول المملكة', style: TextStyle(fontSize: 10.sp, color: Colors.grey.shade400)),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(width: 10.w),
                        Expanded(
                          child: Container(
                            padding: EdgeInsets.all(12.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFF071426),
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                            child: Column(
                              children: [
                                Text(company.supportTime, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: Colors.blue)),
                                SizedBox(height: 4.h),
                                Text('دعم فني مباشر', style: TextStyle(fontSize: 10.sp, color: Colors.grey.shade400)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 10.h),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(12.w),
                      decoration: BoxDecoration(
                        color: const Color(0xFF071426),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Column(
                        children: [
                          Text(company.satisfactionRate, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold, color: Colors.blue)),
                          SizedBox(height: 4.h),
                          Text('نسبة الرضا', style: TextStyle(fontSize: 10.sp, color: Colors.grey.shade400)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),

              // Map Preview Box (صورة الخريطة التوضيحية)
              Container(
                height: 140.h,
                decoration: BoxDecoration(
                  color: const Color(0xFF0D2137),
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.3)),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // محاكاة لخريطة الخلفية
                    Positioned.fill(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16.r),
                        child: Container(
                          color: const Color(0xFF0A182F),
                          child: Center(
                            child: Icon(Icons.map, color: Colors.blue.withOpacity(0.2), size: 80.sp),
                          ),
                        ),
                      ),
                    ),
                    // زر التغطية الواسعة
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D2137).withOpacity(0.9),
                        borderRadius: BorderRadius.circular(30.r),
                        border: Border.all(color: Colors.blue.shade400),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.my_location, color: Colors.blue, size: 16.sp),
                          SizedBox(width: 8.w),
                          Text(
                            'تغطية واسعة في الرياض',
                            style: TextStyle(fontSize: 12.sp, color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 30.h),

              // Action Button (احجز الآن)
              SizedBox(
                width: double.infinity,
                height: 50.h,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1867D2),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.local_shipping_outlined, size: 20.sp),
                      SizedBox(width: 8.w),
                      Text(
                        'احجز الآن',
                        style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 20.h),
            ],
          ),
        ),
      ),
    );
  }
}



