import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/profile/repository/profile_repository.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();

    _checkAuthentication();
  }

  Future<void> _checkAuthentication() async {
    try {
      log('CHECKING AUTHENTICATION...');

      await ref
          .read(profileRepositoryProvider)
          .loadProfile();

      log('AUTHENTICATED');

      if (!mounted) return;

      context.goNamed(AppRoutes.homeScreen);
    } on DioException catch (e) {
      log('AUTHENTICATION FAILED');
      log('STATUS: ${e.response?.statusCode}');
      log('BODY: ${e.response?.data}');

      if (!mounted) return;

      if (e.response?.statusCode == 401) {
        context.goNamed(AppRoutes.loginScreen);
      } else {
        // خطأ في الشبكة أو السيرفر
        // يمكنك هنا إظهار شاشة خطأ بدل Login
        context.goNamed(AppRoutes.loginScreen);
      }
    } catch (e, stackTrace) {
      log(
        'UNEXPECTED AUTH ERROR: $e',
        stackTrace: stackTrace,
      );

      if (!mounted) return;

      context.goNamed(AppRoutes.loginScreen);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF1A56E7),
              Color(0xFF0845C8),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(flex: 8),

              // Logo
              Container(
                width: 174.w,
                height: 174.w,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(22.r),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.20),
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.speed_rounded,
                    size: 80.sp,
                    color: const Color(0xFFFF9800),
                  ),
                ),
              ),

              SizedBox(height: 30.h),

              // App name
              Text(
                'Kinetic Post',
                style: TextStyle(
                  fontSize: 43.sp,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: -1.2,
                ),
              ),

              const Spacer(flex: 11),

              // English slogan
              Text(
                'Your Package, Our Priority',
                style: TextStyle(
                  fontSize: 21.sp,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
              ),

              SizedBox(height: 18.h),

              // Arabic slogan
              Text(
                'طردك، أولويتنا',
                textDirection: TextDirection.rtl,
                style: TextStyle(
                  fontSize: 23.sp,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFFFF9D00),
                ),
              ),

              SizedBox(height: 70.h),

              // Loading
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 44.w),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10.r),
                  child: Container(
                    height: 7.h,
                    color: Colors.white.withValues(alpha: 0.20),
                    child: const LinearProgressIndicator(
                      backgroundColor: Colors.transparent,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Colors.white,
                      ),
                    ),
                  ),
                ),
              ),

              SizedBox(height: 65.h),

              // Version
              Text(
                'v 2.0.4',
                style: TextStyle(
                  fontSize: 21.sp,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withValues(alpha: 0.35),
                ),
              ),

              const Spacer(flex: 4),
            ],
          ),
        ),
      ),
    );
  }
}