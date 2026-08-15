import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:mobile/core/theme/app_color.dart';


class AppThemes {
  // ===========================================================================
  // LIGHT THEME
  // ===========================================================================

  static ThemeData buildLightTheme() {
    final colorScheme = ColorScheme.light(
      primary: AppColorsLight.accentBlue,
      onPrimary: Colors.white,

      primaryContainer: AppColorsBlue.light,
      onPrimaryContainer: AppColorsLight.textDark,

      secondary: AppColorsLight.accentOrange,
      onSecondary: Colors.white,

      secondaryContainer: AppColorsOrange.light,
      onSecondaryContainer: AppColorsOrange.darker,

      surface: AppColorsLight.cardBg,
      onSurface: AppColorsLight.textDark,

      surfaceContainerHighest: AppColorsLight.inputBg,
      onSurfaceVariant: AppColorsLight.textGrey,

      outline: AppColorsLight.border,
      outlineVariant: AppColorsLight.divider,

      error: AppColorsOrange.normal,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,

      colorScheme: colorScheme,

      scaffoldBackgroundColor:
          AppColorsLight.primaryBg,

      canvasColor:
          AppColorsLight.primaryBg,

      // ========================================================================
      // TEXT
      // ========================================================================

      textTheme: Typography.englishLike2021.apply(
        bodyColor: AppColorsLight.textDark,
        displayColor: AppColorsLight.textDark,
        fontFamily: 'Roboto',
      ),

      // ========================================================================
      // APP BAR
      // ========================================================================

      appBarTheme: const AppBarTheme(
        backgroundColor: AppColorsLight.primaryBg,
        foregroundColor: AppColorsLight.textDark,
        elevation: 0,
        centerTitle: false,
      ),

      // ========================================================================
      // CARD
      // ========================================================================

      cardTheme: CardThemeData(
        color: AppColorsLight.cardBg,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
          side: const BorderSide(
            color: AppColorsLight.border,
          ),
        ),
      ),

      // ========================================================================
      // INPUT
      // ========================================================================

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColorsLight.inputBg,

        contentPadding: EdgeInsets.symmetric(
          horizontal: 16.w,
          vertical: 16.h,
        ),

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
          borderSide: const BorderSide(
            color: AppColorsLight.accentBlue,
            width: 1.5,
          ),
        ),

        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(
            color: AppColorsOrange.normal,
          ),
        ),

        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(
            color: AppColorsOrange.normal,
            width: 1.5,
          ),
        ),

        hintStyle: TextStyle(
          color: AppColorsLight.textGrey,
          fontSize: 14.sp,
        ),

        labelStyle: TextStyle(
          color: AppColorsLight.textGrey,
          fontSize: 12.sp,
        ),
      ),

      // ========================================================================
      // ELEVATED BUTTON
      // ========================================================================

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColorsLight.accentBlue,
          foregroundColor: Colors.white,

          minimumSize: Size(
            double.infinity,
            54.h,
          ),

          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),

          textStyle: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.bold,
          ),

          elevation: 0,
        ),
      ),

      // ========================================================================
      // OUTLINED BUTTON
      // ========================================================================

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColorsLight.accentBlue,

          side: const BorderSide(
            color: AppColorsLight.accentBlue,
          ),

          minimumSize: Size(
            double.infinity,
            54.h,
          ),

          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
        ),
      ),

      // ========================================================================
      // TEXT BUTTON
      // ========================================================================

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColorsLight.accentBlue,
        ),
      ),

      // ========================================================================
      // SWITCH
      // ========================================================================

      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) {
            if (states.contains(WidgetState.selected)) {
              return Colors.white;
            }

            return AppColorsLight.textGrey;
          },
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) {
            if (states.contains(WidgetState.selected)) {
              return AppColorsLight.accentBlue;
            }

            return AppColorsLight.primaryBg;
          },
        ),
      ),

      // ========================================================================
      // DIVIDER
      // ========================================================================

      dividerTheme: const DividerThemeData(
        color: AppColorsLight.divider,
        thickness: 1,
      ),

      // ========================================================================
      // ICON
      // ========================================================================

      iconTheme: const IconThemeData(
        color: AppColorsLight.textDark,
      ),
    );
  }

  // ===========================================================================
  // DARK THEME
  // ===========================================================================

  static ThemeData buildDarkTheme() {
    final colorScheme = ColorScheme.dark(
      primary: AppColorsDark.accentBlue,
      onPrimary: Colors.white,

      primaryContainer: AppColorsBlue.dark,
      onPrimaryContainer: Colors.white,

      secondary: AppColorsDark.accentOrange,
      onSecondary: AppColorsOrange.darker,

      secondaryContainer: AppColorsOrange.dark,
      onSecondaryContainer: Colors.white,

      surface: AppColorsDark.cardBg,
      onSurface: AppColorsDark.textWhite,

      surfaceContainerHighest: AppColorsDark.inputBg,
      onSurfaceVariant: AppColorsDark.textGrey,

      outline: AppColorsDark.border,
      outlineVariant: AppColorsDark.divider,

      error: AppColorsOrange.lightActive,
      onError: AppColorsOrange.darker,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,

      colorScheme: colorScheme,

      scaffoldBackgroundColor:
          AppColorsDark.primaryBg,

      canvasColor:
          AppColorsDark.primaryBg,

      // ========================================================================
      // TEXT
      // ========================================================================

      textTheme: Typography.englishLike2021.apply(
        bodyColor: AppColorsDark.textWhite,
        displayColor: AppColorsDark.textWhite,
        fontFamily: 'Roboto',
      ),

      // ========================================================================
      // APP BAR
      // ========================================================================

      appBarTheme: const AppBarTheme(
        backgroundColor: AppColorsDark.primaryBg,
        foregroundColor: AppColorsDark.textWhite,
        elevation: 0,
        centerTitle: false,
      ),

      // ========================================================================
      // CARD
      // ========================================================================

      cardTheme: CardThemeData(
        color: AppColorsDark.cardBg,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
          side: const BorderSide(
            color: AppColorsDark.border,
          ),
        ),
      ),

      // ========================================================================
      // INPUT
      // ========================================================================

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColorsDark.inputBg,

        contentPadding: EdgeInsets.symmetric(
          horizontal: 16.w,
          vertical: 16.h,
        ),

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
          borderSide: const BorderSide(
            color: AppColorsDark.accentBlue,
            width: 1.5,
          ),
        ),

        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(
            color: AppColorsOrange.lightActive,
          ),
        ),

        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(
            color: AppColorsOrange.lightActive,
            width: 1.5,
          ),
        ),

        hintStyle: TextStyle(
          color: AppColorsDark.textGrey,
          fontSize: 14.sp,
        ),

        labelStyle: TextStyle(
          color: AppColorsDark.textGrey,
          fontSize: 12.sp,
        ),
      ),

      // ========================================================================
      // ELEVATED BUTTON
      // ========================================================================

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColorsBlue.normal,
          foregroundColor: Colors.white,

          minimumSize: Size(
            double.infinity,
            54.h,
          ),

          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),

          textStyle: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.bold,
          ),

          elevation: 0,
        ),
      ),

      // ========================================================================
      // OUTLINED BUTTON
      // ========================================================================

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColorsDark.accentBlue,

          side: const BorderSide(
            color: AppColorsDark.accentBlue,
          ),

          minimumSize: Size(
            double.infinity,
            54.h,
          ),

          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
        ),
      ),

      // ========================================================================
      // TEXT BUTTON
      // ========================================================================

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColorsDark.accentBlue,
        ),
      ),

      // ========================================================================
      // SWITCH
      // ========================================================================

      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) {
            if (states.contains(WidgetState.selected)) {
              return Colors.white;
            }

            return AppColorsDark.textGrey;
          },
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) {
            if (states.contains(WidgetState.selected)) {
              return AppColorsDark.accentBlue;
            }

            return AppColorsBlue.dark;
          },
        ),
      ),

      // ========================================================================
      // DIVIDER
      // ========================================================================

      dividerTheme: const DividerThemeData(
        color: AppColorsDark.divider,
        thickness: 1,
      ),

      // ========================================================================
      // ICON
      // ========================================================================

      iconTheme: const IconThemeData(
        color: AppColorsDark.textWhite,
      ),
    );
  }
}