// ج) معلومات المرسل
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';


// ز) تذييل إعادة تعيين الحقول
class ResetFieldsFooter extends StatelessWidget {
  const ResetFieldsFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: GestureDetector(
        onTap: () {},
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'إعادة تعيين الحقول',
              style: TextStyle(
                fontSize: 13.sp,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            SizedBox(width: 6.w),
            Icon(
              Icons.refresh,
              size: 16.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ],
        ),
      ),
    );
  }
}
