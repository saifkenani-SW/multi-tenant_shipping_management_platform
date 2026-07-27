import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/routing/router_generator.dart';
import 'package:mobile/core/theme/app_theme.dart';

// ==============================================================================
// 1. نقطة الدخول الرئيسية (Main Entry Point)
// ==============================================================================

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]).then((
    _,
  ) {
    runApp(const ProviderScope(child: SwiftPostApp()));
  });
}

// ==============================================================================
// 2. إعدادات التطبيق الرئيسية والثيم (App & Theme Configuration)
// ==============================================================================

class SwiftPostApp extends StatelessWidget {
  const SwiftPostApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          title: 'SwiftPost',
          theme: AppThemes.buildLightTheme(context),
          routerConfig: RouterGenerationConfig.mainRouterGenerator(),
        );
      },
    );
  }
}



