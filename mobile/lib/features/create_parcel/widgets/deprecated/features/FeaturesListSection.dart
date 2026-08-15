
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/features/create_parcel/widgets/deprecated/features/FeatureCard.dart';

// 5. الميزات الإضافية (تأمين شامل، توصيل سريع، دعم 24/7)
class FeaturesListSection extends StatelessWidget {
  const FeaturesListSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const FeatureCard(icon: Icons.verified_user_outlined, title: 'تأمين شامل', subtitle: 'شحنتك في أمان تام'),
        SizedBox(height: 8.h),
        const FeatureCard(icon: Icons.bolt, title: 'توصيل سريع', subtitle: 'أسرع الخيارات اللوجستية'),
        SizedBox(height: 8.h),
        const FeatureCard(icon: Icons.support_agent, title: 'دعم في 24/7', subtitle: 'دائماً بجانبك'),
      ],
    );
  }
}
