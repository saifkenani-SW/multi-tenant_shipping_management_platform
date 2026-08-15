import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/create_parcel/models/global_location_model.dart';
import 'package:mobile/features/create_parcel/providers/states/location_state.dart';

class LocationDropdowns extends StatelessWidget {
  final List<LocationLevelState> levels;

  // final void Function(int index, String value) onSearch;

  final void Function(int index, GlobalLocation location) onSelected;

  // final void Function(int index) onLoadMore;

  const LocationDropdowns({
    super.key,
    required this.levels,
    // required this.onSearch,
    required this.onSelected,
    // required this.onLoadMore,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(levels.length, (index) {
        final level = levels[index];

        return _LocationDropdown(
          level: level,
          index: index,
          // onSearch: onSearch,
          onSelected: onSelected,
          // onLoadMore: onLoadMore,
        );
      }),
    );
  }
}

class _LocationDropdown extends StatelessWidget {
  final LocationLevelState level;
  final int index;

  // final void Function(int index, String value) onSearch;

  final void Function(int index, GlobalLocation location) onSelected;

  // final void Function(int index) onLoadMore;

  const _LocationDropdown({
    required this.level,
    required this.index,
    // required this.onSearch,
    required this.onSelected,
    // required this.onLoadMore,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Column(
        children: [
          Text(
            'اختر ${_getLabel(level.type)}',
            style: TextStyle(color: Colors.amber),
          ),
          SizedBox(height: 12.h),
          DropdownButtonFormField<String>(
            dropdownColor: AppColorsDark.textGrey,

            initialValue: level.selectedLocation?.id,

            items: level.locations.map((location) {
              return DropdownMenuItem<String>(
                value: location.id,
                child: Text(location.name, overflow: TextOverflow.ellipsis),
              );
            }).toList(),

            onChanged: level.locations.isEmpty
                ? null
                : (value) {
                    if (value == null) return;

                    final location = level.locations.firstWhere(
                      (location) => location.id == value,
                    );

                    onSelected(index, location);
                  },
          ),
        ],
      ),
    );
  }

  String _getLabel(String type) {
    switch (type) {
      case 'COUNTRY':
        return 'الدولة';

      case 'GOVERNORATE':
        return 'المحافظة';

      case 'CITY':
        return 'المدينة';

      case 'AREA':
        return 'المنطقة';

      case 'DISTRICT':
        return 'الحي';

      default:
        return type;
    }
  }
}
