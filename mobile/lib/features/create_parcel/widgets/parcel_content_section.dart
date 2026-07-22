// ب) قسم المحتوى وتحذيراته
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/create_parcel/providers/parcel_notes.dart';

class ParcelContentSection extends ConsumerWidget {
  const ParcelContentSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final warnings = ref.watch(parcelWarningsProvider);
    final notifier = ref.read(parcelWarningsProvider.notifier);

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                'المحتوى',
                style: TextStyle(
                  fontSize: 15.sp,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              SizedBox(width: 8.w),
              Icon(
                Icons.category_outlined,
                color: theme.colorScheme.primary,
                size: 20.sp,
              ),
            ],
          ),
          SizedBox(height: 14.h),
          Text(
            'نوع المحتوى',
            style: TextStyle(
              fontSize: 12.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 6.h),
          const TextField(
            textAlign: TextAlign.right,
            decoration: InputDecoration(hintText: 'اختر نوع المحتوى'),
          ),
          SizedBox(height: 14.h),
          Text(
            'تحذيرات المحتوى',
            style: TextStyle(
              fontSize: 12.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 10.h),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10.h,
            crossAxisSpacing: 10.w,
            childAspectRatio: 2.2,
            children: [
              _WarningCard(
                title: 'قابل للكسر',
                subtitle: 'Fragile',
                isSelected: warnings.fragile,
                onTap: notifier.toggleFragile,
              ),
              _WarningCard(
                title: 'سوائل',
                subtitle: 'Liquids',
                isSelected: warnings.liquids,
                onTap: notifier.toggleLiquids,
              ),
              _WarningCard(
                title: 'مواد ثمينة',
                subtitle: 'Valuables',
                isSelected: warnings.valuables,
                onTap: notifier.toggleValuables,
              ),
              _WarningCard(
                title: 'بطاريات',
                subtitle: 'Batteries',
                isSelected: warnings.batteries,
                onTap: notifier.toggleBatteries,
              ),
            ],
          ),
        ],
      ),
    );
  }
}





class _WarningCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _WarningCard({
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor.withOpacity(0.5),
          borderRadius: BorderRadius.circular(10.r),
          border: Border.all(
            color: isSelected
                ? theme.colorScheme.primary
                : theme.colorScheme.primary.withOpacity(0.2),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Checkbox(
              value: isSelected,
              onChanged: (_) => onTap(),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12.sp,
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 10.sp,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}



