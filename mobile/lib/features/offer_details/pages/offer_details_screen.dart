import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/companies/models/quotation_model.dart';
import 'package:mobile/features/companies/providers/quotations_notifier.dart';

class OfferDetailsScreen extends ConsumerWidget {
  final Quotation quotation;

  const OfferDetailsScreen({super.key, required this.quotation});

  @override
  Widget build(BuildContext context, ref) {
    final pricing = quotation.pricingSnapshot;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFF071426),
        appBar: AppBar(
          backgroundColor: const Color(0xFF071426),
          elevation: 0,
          centerTitle: true,
          title: Text(
            'تفاصيل الشحن',
            style: TextStyle(
              fontSize: 16.sp,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: Colors.white),
            onPressed: () => context.pop(),
          ),
        ),
        body: SingleChildScrollView(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ============================================================
              // 1. Company / Quotation Hero Card
              // ============================================================
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20.w),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D2137),
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(
                    color: const Color(0xFF1867D2).withOpacity(0.3),
                  ),
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
                        child: Icon(
                          Icons.local_shipping,
                          color: const Color(0xFF1867D2),
                          size: 28.sp,
                        ),
                      ),
                    ),

                    SizedBox(height: 16.h),

                    Text(
                      quotation.tenantName,
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),

                    SizedBox(height: 8.h),

                    Text(
                      _serviceLevelText(quotation.serviceLevel),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: Colors.grey.shade400,
                        height: 1.5,
                      ),
                    ),

                    SizedBox(height: 12.h),

                    // حالة العرض
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 12.w,
                        vertical: 6.h,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(quotation.status).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20.r),
                        border: Border.all(
                          color: _statusColor(
                            quotation.status,
                          ).withOpacity(0.4),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _statusIcon(quotation.status),
                            size: 15.sp,
                            color: _statusColor(quotation.status),
                          ),
                          SizedBox(width: 6.w),
                          Text(
                            _statusText(quotation.status),
                            style: TextStyle(
                              fontSize: 11.sp,
                              color: _statusColor(quotation.status),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              SizedBox(height: 16.h),

              // ============================================================
              // 2. Shipping Price Card
              // ============================================================
              Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D2137),
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(
                    color: const Color(0xFF1867D2).withOpacity(0.3),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'سعر الشحن / SHIPPING PRICE',
                          style: TextStyle(
                            fontSize: 10.sp,
                            color: const Color(0xFF3883FF),
                            fontWeight: FontWeight.bold,
                          ),
                        ),

                        SizedBox(height: 6.h),

                        Text(
                          _formatPrice(quotation.amount, quotation.currency),
                          style: TextStyle(
                            fontSize: 22.sp,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),

                    Row(
                      children: [
                        Text(
                          quotation.quotationType,
                          style: TextStyle(
                            fontSize: 11.sp,
                            color: Colors.grey.shade400,
                          ),
                        ),
                        SizedBox(width: 8.w),
                        Icon(
                          Icons.receipt_long,
                          color: Colors.grey.shade400,
                          size: 20.sp,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              SizedBox(height: 16.h),

              // ============================================================
              // 3. Delivery Route Card
              // ============================================================
              ClipRRect(
                borderRadius: BorderRadius.circular(16.r),
                child: Container(
                  padding: EdgeInsets.all(16.w),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D2137),
                    border: Border(
                      top: BorderSide(
                        color: const Color(0xFF1867D2).withOpacity(0.3),
                        width: 1,
                      ),
                      left: const BorderSide(
                        color: Color(0xFFFF5722),
                        width: 4,
                      ),
                      right: BorderSide(
                        color: const Color(0xFF1867D2).withOpacity(0.3),
                        width: 1,
                      ),
                      bottom: BorderSide(
                        color: const Color(0xFF1867D2).withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.radio_button_checked,
                            color: const Color(0xFF3883FF),
                            size: 18.sp,
                          ),
                          SizedBox(width: 10.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'من',
                                  style: TextStyle(
                                    fontSize: 10.sp,
                                    color: Colors.grey.shade400,
                                  ),
                                ),
                                SizedBox(height: 3.h),
                                Text(
                                  quotation.originOrgUnitName,
                                  style: TextStyle(
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: 14.h),

                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            color: const Color(0xFFFF5722),
                            size: 18.sp,
                          ),
                          SizedBox(width: 10.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'إلى',
                                  style: TextStyle(
                                    fontSize: 10.sp,
                                    color: Colors.grey.shade400,
                                  ),
                                ),
                                SizedBox(height: 3.h),
                                Text(
                                  quotation.destinationOrgUnitName,
                                  style: TextStyle(
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              SizedBox(height: 24.h),

              // ============================================================
              // Section: Pricing Details
              // ============================================================
              Text(
                'تفاصيل السعر',
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),

              SizedBox(height: 12.h),

              _InfoCard(
                children: [
                  _InfoRow(
                    title: 'السعر الأساسي',
                    value: _formatPrice(
                      quotation.basePrice?.toDouble(),
                      quotation.currency,
                    ),
                  ),

                  if (quotation.weightCharge != null)
                    _InfoRow(
                      title: 'رسوم الوزن',
                      value: _formatPrice(
                        quotation.weightCharge,
                        quotation.currency,
                      ),
                    ),

                  if (quotation.extraFees != null)
                    _InfoRow(
                      title: 'رسوم إضافية',
                      value: _formatPrice(
                        quotation.extraFees?.toDouble(),
                        quotation.currency,
                      ),
                    ),

                  Divider(color: Colors.grey.shade800, height: 20.h),

                  _InfoRow(
                    title: 'الإجمالي',
                    value: _formatPrice(
                      quotation.amount,
                      quotation.currency,
                      bold: true,
                    ),
                    valueColor: const Color(0xFF3883FF),
                  ),
                ],
              ),

              SizedBox(height: 24.h),

              // ============================================================
              // Section: Shipment Details
              // ============================================================
              Text(
                'تفاصيل الشحنة',
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),

              SizedBox(height: 12.h),

              _InfoCard(
                children: [
                  _InfoRow(
                    title: 'الوزن المتوقع',
                    value: pricing != null
                        ? '${pricing.expectedTotalWeightKg.toStringAsFixed(2)} كغ'
                        : '-',
                  ),

                  if (pricing != null)
                    _InfoRow(
                      title: 'الأبعاد',
                      value:
                          '${pricing.expectedLengthCm} × '
                          '${pricing.expectedWidthCm} × '
                          '${pricing.expectedHeightCm} سم',
                    ),

                  if (pricing != null)
                    _InfoRow(
                      title: 'الوزن الحجمي',
                      value:
                          '${pricing.calculatedVolumetricWeightKg.toStringAsFixed(2)} كغ',
                    ),

                  if (pricing != null)
                    _InfoRow(
                      title: 'الوزن المحاسبي',
                      value:
                          '${pricing.calculatedChargeableWeightKg.toStringAsFixed(2)} كغ',
                    ),

                  if (pricing != null)
                    _InfoRow(
                      title: 'الوزن الأساسي',
                      value: '${pricing.baseWeightKg} كغ',
                    ),
                ],
              ),

              SizedBox(height: 24.h),

              // ============================================================
              // Section: Service
              // ============================================================
              Text(
                'الخدمة',
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),

              SizedBox(height: 12.h),

              _InfoCard(
                children: [
                  _InfoRow(
                    title: 'مستوى الخدمة',
                    value: _serviceLevelText(quotation.serviceLevel),
                  ),

                  _InfoRow(title: 'نوع العرض', value: quotation.quotationType),

                  _InfoRow(title: 'رقم العرض', value: quotation.id),
                ],
              ),

              // ============================================================
              // Notes
              // ============================================================
              if (quotation.notes != null &&
                  quotation.notes!.trim().isNotEmpty) ...[
                SizedBox(height: 24.h),

                Text(
                  'ملاحظات',
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),

                SizedBox(height: 12.h),

                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(16.w),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D2137),
                    borderRadius: BorderRadius.circular(16.r),
                    border: Border.all(
                      color: const Color(0xFF1867D2).withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    quotation.notes!,
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: Colors.grey.shade300,
                      height: 1.6,
                    ),
                  ),
                ),
              ],

              SizedBox(height: 30.h),

              // ============================================================
              // Action Button
              // ============================================================
              SizedBox(
                width: double.infinity,
                height: 50.h,
                child: ElevatedButton(
                  onPressed: () async {
                    final res = await ref
                        .read(quotationsNotifierProvider.notifier)
                        .approveQuotation(quotation.id);
                    if (res) {
                      GoRouter.of(
                        context,
                      ).pushNamed(AppRoutes.bookingConfirmedScreen);
                    }
                  },
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
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                        ),
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

  // =========================================================================
  // Helpers
  // =========================================================================

  String _formatPrice(double? amount, String currency, {bool bold = false}) {
    if (amount == null) return '-';

    return '${amount.toStringAsFixed(2)} $currency';
  }

  String _serviceLevelText(String value) {
    switch (value.toLowerCase()) {
      case 'standard':
        return 'خدمة الشحن القياسية';
      case 'express':
        return 'خدمة الشحن السريع';
      case 'same_day':
        return 'توصيل في نفس اليوم';
      case 'economy':
        return 'خدمة الشحن الاقتصادية';
      default:
        return value;
    }
  }

  String _statusText(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return 'بانتظار الاختيار';

      case 'active':
        return 'العرض متاح';

      case 'accepted':
        return 'تم قبول العرض';

      case 'expired':
        return 'انتهت صلاحية العرض';

      case 'rejected':
        return 'مرفوض';

      default:
        return value;
    }
  }

  Color _statusColor(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return Colors.orange;

      case 'active':
        return Colors.green;

      case 'accepted':
        return Colors.green;

      case 'expired':
        return Colors.red;

      case 'rejected':
        return Colors.red;

      default:
        return Colors.blue;
    }
  }

  IconData _statusIcon(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return Icons.hourglass_empty;

      case 'active':
        return Icons.check_circle_outline;

      case 'accepted':
        return Icons.check_circle;

      case 'expired':
        return Icons.timer_off_outlined;

      case 'rejected':
        return Icons.cancel_outlined;

      default:
        return Icons.info_outline;
    }
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;

  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: const Color(0xFF0D2137),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFF1867D2).withOpacity(0.3)),
      ),
      child: Column(children: children),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String title;
  final String value;
  final Color? valueColor;

  const _InfoRow({required this.title, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 7.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade400),
          ),
          SizedBox(width: 12.w),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.left,
              style: TextStyle(
                fontSize: 12.sp,
                fontWeight: FontWeight.w600,
                color: valueColor ?? Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
