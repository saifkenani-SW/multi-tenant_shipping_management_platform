import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_colors.dart';

class AppThemes {

  static ThemeData buildLightTheme(BuildContext context) {

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColorsLight.primaryBg,
      colorScheme: const ColorScheme.light(
        primary: AppColorsLight.accentBlue,
        surface: AppColorsLight.cardBg,
        onSurface: AppColorsLight.textDark,
        onSurfaceVariant: AppColorsLight.textGrey,
      ),
      textTheme: Typography.englishLike2021.apply(
        bodyColor: AppColorsLight.textDark,
        displayColor: AppColorsLight.textDark,
        fontFamily: 'Roboto',
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColorsLight.inputBg,
        contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(color: AppColorsLight.accentBlue, width: 1.5),
        ),
        hintStyle: TextStyle(color: AppColorsLight.textGrey.withOpacity(0.6), fontSize: 14.sp),
        labelStyle: TextStyle(color: AppColorsLight.textGrey, fontSize: 12.sp),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColorsLight.accentBlue,
          foregroundColor: Colors.white,
          minimumSize: Size(double.infinity, 54.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          textStyle: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
          elevation: 0,
        ),
      ),
    );
  }

  static ThemeData buildDarkTheme(BuildContext context) {

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColorsDark.primaryBg,
      colorScheme: const ColorScheme.dark(
        primary: AppColorsDark.accentBlue,
        surface: AppColorsDark.cardBg,
        onPrimary: AppColorsDark.textWhite,
        onSurface: AppColorsDark.textWhite,
        onSurfaceVariant: AppColorsDark.textGrey,
      ),
      textTheme: Typography.englishLike2021.apply(
        bodyColor: AppColorsDark.textWhite,
        displayColor: AppColorsDark.textWhite,
        fontFamily: 'Roboto',
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.transparent,
        contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.r),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.r),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.r),
          borderSide: const BorderSide(color: AppColorsDark.accentBlue, width: 2),
        ),
        hintStyle: TextStyle(color: AppColorsDark.textGrey, fontSize: 14.sp),
        labelStyle: TextStyle(color: AppColorsDark.textGrey, fontSize: 12.sp),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColorsDark.accentBlue,
          foregroundColor: AppColorsDark.textWhite,
          minimumSize: Size(double.infinity, 50.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.r),
          ),
          textStyle: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }



}