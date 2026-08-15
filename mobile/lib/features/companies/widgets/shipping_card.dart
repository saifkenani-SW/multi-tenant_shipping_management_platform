
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/companies/models/quotation_model.dart';

class ShippingCard extends StatelessWidget {
  final Quotation quotation;

  const ShippingCard({
    super.key,
    required this.quotation,
  });

  @override
  Widget build(BuildContext context) {
    final bool hasOffer =
        quotation.quotationType.toUpperCase() == 'OFFER';

    return GestureDetector(
      onTap: () {
        GoRouter.of(context).pushNamed(
          AppRoutes.offerDetailsScreen,
          extra: quotation,
        );
      },

      child: Container(
        margin: EdgeInsets.only(bottom: 16.h),

        child: ClipRRect(
          borderRadius: BorderRadius.circular(16.r),

          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,

              border: Border(
                top: BorderSide(
                  color: Colors.grey.shade200,
                  width: 1,
                ),
                left: BorderSide(
                  color: Colors.grey.shade200,
                  width: 1,
                ),
                bottom: BorderSide(
                  color: Colors.grey.shade200,
                  width: 1,
                ),

                right: BorderSide(
                  color: hasOffer
                      ? Colors.deepOrange
                      : const Color(0xFF1867D2),
                  width: 4.w,
                ),
              ),
            ),

            padding: EdgeInsets.all(16.w),

            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,

              children: [
                // ================= Header =================

                Row(
                  mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,

                  children: [
                    Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,

                      children: [
                        Row(
                          children: [
                            Text(
                              quotation.tenantName,
                              style: TextStyle(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1867D2),
                              ),
                            ),

                            if (hasOffer) ...[
                              SizedBox(width: 8.w),

                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 8.w,
                                  vertical: 2.h,
                                ),

                                decoration: BoxDecoration(
                                  color: Colors.orange.shade50,
                                  borderRadius:
                                      BorderRadius.circular(4.r),
                                  border: Border.all(
                                    color:
                                        Colors.orange.shade200,
                                  ),
                                ),

                                child: Text(
                                  'عرض',
                                  style: TextStyle(
                                    fontSize: 10.sp,
                                    color: Colors.deepOrange,
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),

                        SizedBox(height: 4.h),

                        Text(
                          quotation.serviceLevel,
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),

                    // Logo placeholder
                    Container(
                      width: 50.w,
                      height: 35.h,

                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Colors.grey.shade200,
                        ),
                        borderRadius:
                            BorderRadius.circular(6.r),
                      ),

                      child: Center(
                        child: Text(
                          quotation.tenantName
                              .substring(
                                0,
                                quotation.tenantName.length > 3
                                    ? 3
                                    : quotation.tenantName.length,
                              )
                              .toUpperCase(),

                          style: TextStyle(
                            fontSize: 10.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                Divider(
                  height: 24.h,
                  color: Colors.grey.shade200,
                ),

                // ================= Price =================

                Row(
                  mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,

                  children: [
                    Text(
                      'سعر الشحن',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: Colors.grey.shade600,
                      ),
                    ),

                    Text(
                      '${quotation.amount?.toStringAsFixed(2) ?? '-'} ${quotation.currency}',
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.bold,
                        color: hasOffer
                            ? Colors.deepOrange
                            : const Color(0xFF1867D2),
                      ),
                    ),
                  ],
                ),

                SizedBox(height: 12.h),

                // ================= Service =================

                Row(
                  children: [
                    Icon(
                      Icons.local_shipping_outlined,
                      size: 16.sp,
                      color: Colors.blue,
                    ),

                    SizedBox(width: 6.w),

                    Text(
                      'الخدمة: ${quotation.serviceLevel}',
                      style: TextStyle(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),

                SizedBox(height: 8.h),

                // ================= Route =================

                Row(
                  children: [
                    Icon(
                      Icons.route,
                      size: 16.sp,
                      color: Colors.grey,
                    ),

                    SizedBox(width: 6.w),

                    Expanded(
                      child: Text(
                        '${quotation.originOrgUnitName} ← ${quotation.destinationOrgUnitName}',
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],
                ),

                SizedBox(height: 8.h),

                // ================= Pricing Details =================

                _InfoRow(
                  icon: Icons.payments_outlined,
                  title: 'السعر الأساسي',
                  value:
                      '${quotation.basePrice ?? 0} ${quotation.currency}',
                ),

                SizedBox(height: 6.h),

                _InfoRow(
                  icon: Icons.scale_outlined,
                  title: 'رسوم الوزن',
                  value:
                      '${quotation.weightCharge?.toStringAsFixed(2) ?? '0.00'} ${quotation.currency}',
                ),

                SizedBox(height: 6.h),

                _InfoRow(
                  icon: Icons.add_circle_outline,
                  title: 'رسوم إضافية',
                  value:
                      '${quotation.extraFees ?? 0} ${quotation.currency}',
                ),

                // ================= Notes =================

                if (quotation.notes != null &&
                    quotation.notes!.isNotEmpty) ...[
                  SizedBox(height: 8.h),

                  Row(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,

                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 15.sp,
                        color: Colors.grey,
                      ),

                      SizedBox(width: 6.w),

                      Expanded(
                        child: Text(
                          quotation.notes!,
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                SizedBox(height: 10.h),

                // ================= Status =================

                Row(
                  mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,

                  children: [
                    _StatusBadge(
                      status: quotation.status,
                    ),

                    Text(
                      quotation.quotationType,
                      style: TextStyle(
                        fontSize: 11.sp,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final normalizedStatus = status.toUpperCase();

    Color textColor;
    Color backgroundColor;

    switch (normalizedStatus) {
      case 'ACTIVE':
      case 'AVAILABLE':
        textColor = Colors.green.shade700;
        backgroundColor = Colors.green.shade50;
        break;

      case 'EXPIRED':
        textColor = Colors.red.shade700;
        backgroundColor = Colors.red.shade50;
        break;

      case 'PENDING':
        textColor = Colors.orange.shade700;
        backgroundColor = Colors.orange.shade50;
        break;

      default:
        textColor = Colors.grey.shade700;
        backgroundColor = Colors.grey.shade100;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: 8.w,
        vertical: 4.h,
      ),

      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(6.r),
      ),

      child: Text(
        status,
        style: TextStyle(
          fontSize: 10.sp,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 15.sp,
          color: Colors.grey,
        ),

        SizedBox(width: 6.w),

        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11.sp,
              color: Colors.grey.shade600,
            ),
          ),
        ),

        Text(
          value,
          style: TextStyle(
            fontSize: 11.sp,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF0D2A53),
          ),
        ),
      ],
    );
  }
}
