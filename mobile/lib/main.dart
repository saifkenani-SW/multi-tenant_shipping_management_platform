import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import 'package:mobile/core/routing/router_provider.dart';
import 'package:mobile/core/services/notification_service.dart';
import 'package:mobile/core/services/storage_service.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/firebase_options.dart';

import 'features/profile/notifier/theme_notifier.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await setUp();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  await NotificationService.instance.initialize();

  final storage = StorageService();

  final savedTheme =
      await storage.getThemePreference();

  final initialTheme = savedTheme == null
      ? ThemeMode.light
      : savedTheme
          ? ThemeMode.light
          : ThemeMode.dark;

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  runApp(
    ProviderScope(
      overrides: [
        initialThemeProvider.overrideWithValue(
          initialTheme,
        ),
      ],
      child: const SwiftPostApp(),
    ),
  );
}

Future<void> setUp() async {
  await dotenv.load(
    fileName: '.env',
  );

  mapbox.MapboxOptions.setAccessToken(
    dotenv.env['MAPBOX_ACCESS_TOKEN']!,
  );
}

class SwiftPostApp extends ConsumerWidget {
  const SwiftPostApp({super.key});

  // مهم جدًا:
  // Router يتم إنشاؤه مرة واحدة فقط.
  static final _router =
      RouterProvider.mainRouterGenerator();

  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {
    final themeMode =
        ref.watch(themeNotifierProvider);

    return ScreenUtilInit(
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp.router(
          debugShowCheckedModeBanner: false,

          title: 'SwiftPost',

          locale: const Locale('ar'),

          theme: AppThemes.buildLightTheme(),

          darkTheme: AppThemes.buildDarkTheme(),

          themeMode: themeMode,

          routerConfig: _router,

          builder: (context, child) {
            return Directionality(
              textDirection: TextDirection.ltr,
              child: child!,
            );
          },
        );
      },
    );
  }
}