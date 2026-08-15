
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/my_shipments/notifier/selectedFilterProvider.dart';

class FilterChipsSection extends ConsumerWidget {
  const FilterChipsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedFilter = ref.watch(selectedFilterProvider);
    final filters = ['All Parcels', 'In Transit', 'Pending'];

    return SizedBox(
      height: 40.h,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (context, index) => SizedBox(width: 10.w),
        itemBuilder: (context, index) {
          final isSelected = selectedFilter == index;
          return ChoiceChip(
            label: Text(filters[index]),
            selected: isSelected,
            onSelected: (bool selected) {
              ref.read(selectedFilterProvider.notifier).state = index;
            },
            selectedColor: AppColorsDark.accentBlue,
            backgroundColor: AppColorsDark.cardBg,
            labelStyle: TextStyle(
              fontSize: 13.sp,
              color: isSelected ? Colors.white : AppColorsDark.textGrey,
              fontWeight: FontWeight.w500,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20.r),
              side: BorderSide.none,
            ),
          );
        },
      ),
    );
  }
}
