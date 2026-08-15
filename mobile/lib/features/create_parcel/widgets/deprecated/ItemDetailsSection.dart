import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/create_parcel/providers/deprecated/ContentWarningsNotifier.dart';
import 'package:mobile/features/create_parcel/widgets/CardContainer.dart';

// 2. تفاصيل العنصر #1
class ItemDetailsSection extends ConsumerWidget {
  const ItemDetailsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final warnings = ref.watch(contentWarningsProvider);
    final notifier = ref.read(contentWarningsProvider.notifier);

    return CardContainer(
      borderColor: AppColorsDark.accentBlue,
      title: 'تفاصيل العنصر #1',
      icon: Icons.inventory_outlined,
      iconColor: AppColorsDark.accentBlue,
      trailing: Icon(Icons.keyboard_arrow_up, color: AppColorsDark.textGrey, size: 20.sp),
      children: [
        Text('اسم العنصر', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
        SizedBox(height: 8.h),
        TextField(
          decoration: const InputDecoration(hintText: 'مثال: هاتف ذكي، ملابس قطنية...'),
        ),
        SizedBox(height: 12.h),
        Text('نوع المحتوى', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
        SizedBox(height: 8.h),
        DropdownButtonFormField<String>(
          dropdownColor: AppColorsDark.cardBg,
          decoration: const InputDecoration(hintText: 'اختر نوع المحتوى'),
          items: const [
            DropdownMenuItem(value: 'إلكترونيات', child: Text('إلكترونيات')),
            DropdownMenuItem(value: 'ملابس', child: Text('ملابس')),
          ],
          onChanged: (val) {},
        ),
        SizedBox(height: 12.h),
        Text('العدد', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
        SizedBox(height: 8.h),
        TextField(
          decoration: const InputDecoration(hintText: '1'),
          keyboardType: TextInputType.number,
        ),
        SizedBox(height: 12.h),
        Text('طبيعة المحتوى', style: TextStyle(fontSize: 12.sp, color: AppColorsDark.textGrey)),
        SizedBox(height: 8.h),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 2.5,
          crossAxisSpacing: 8.w,
          mainAxisSpacing: 8.h,
          children: warnings.keys.map((key) {
            return CheckboxListTile(
              title: Text(key, style: TextStyle(fontSize: 11.sp)),
              value: warnings[key],
              onChanged: (_) => notifier.toggle(key),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8.r),
                side: BorderSide(color: AppColorsDark.textGrey.withOpacity(0.3)),
              ),
            );
          }).toList(),
        ),
        SizedBox(height: 12.h),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            minimumSize: Size(double.infinity, 45.h),
            side: BorderSide(color: AppColorsDark.accentBlue.withOpacity(0.5)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
          ),
          onPressed: () {},
          icon: Icon(Icons.add_circle_outline, color: AppColorsDark.accentBlue, size: 18.sp),
          label: Text('إضافة عنصر آخر', style: TextStyle(fontSize: 14.sp, color: AppColorsDark.textWhite)),
        ),
      ],
    );
  }
}
