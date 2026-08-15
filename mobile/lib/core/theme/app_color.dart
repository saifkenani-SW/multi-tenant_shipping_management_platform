import 'package:flutter/material.dart';

/// ============================================================================
/// BLUE PALETTE
/// ============================================================================

class AppColorsBlue {
  // Light
  static const Color light = Color(0xFFE8EEFD);
  static const Color lightHover = Color(0xFFDDE6FC);
  static const Color lightActive = Color(0xFFB8CBF8);

  // Normal
  static const Color normal = Color(0xFF1A56E8);
  static const Color normalHover = Color(0xFF174DD1);
  static const Color normalActive = Color(0xFF1545AB);

  // Dark
  static const Color dark = Color(0xFF1441AE);
  static const Color darkHover = Color(0xFF10348B);
  static const Color darkActive = Color(0xFF0C2768);

  // Darker
  static const Color darker = Color(0xFF091E51);
}

/// ============================================================================
/// ORANGE PALETTE
/// ============================================================================

class AppColorsOrange {
  // Light
  static const Color light = Color(0xFFFBE8E6);
  static const Color lightHover = Color(0xFFF8E1D9);
  static const Color lightActive = Color(0xFFF1C1B0);

  // Normal
  static const Color normal = Color(0xFFD23600);
  static const Color normalHover = Color(0xFFBD3100);
  static const Color normalActive = Color(0xFFA82B00);

  // Dark
  static const Color dark = Color(0xFF9E2900);
  static const Color darkHover = Color(0xFF7E2000);
  static const Color darkActive = Color(0xFF5E1800);

  // Darker
  static const Color darker = Color(0xFF4A1300);
}

/// ============================================================================
/// LIGHT THEME COLORS
/// ============================================================================

class AppColorsLight {
  // Backgrounds
  static const Color primaryBg = Color(0xFFF8FAFF);
  static const Color cardBg = Colors.white;
  static const Color inputBg = Color(0xFFE8EEFD);

  // Brand
  static const Color accentBlue = AppColorsBlue.normal;
  static const Color accentBlueHover = AppColorsBlue.normalHover;
  static const Color accentBlueActive = AppColorsBlue.normalActive;

  // Text
  static const Color textDark = Color(0xFF091E51);
  static const Color textGrey = Color(0xFF5F6F8F);
  static const Color textLight = Color(0xFF8A97B0);

  // Borders / dividers
  static const Color border = Color(0xFFDDE6FC);
  static const Color divider = Color(0xFFE8EEFD);

  // Secondary orange
  static const Color accentOrange = AppColorsOrange.normal;
  static const Color accentOrangeLight = AppColorsOrange.light;
}

/// ============================================================================
/// DARK THEME COLORS
/// ============================================================================

class AppColorsDark {
  // Backgrounds
  static const Color primaryBg = AppColorsBlue.darker;
  static const Color cardBg = Color(0xFF0C2768);
  static const Color inputBg = Color(0xFF10348B);

  // Brand
  static const Color accentBlue = Color(0xFF4D7FF0);
  static const Color accentBlueHover = AppColorsBlue.lightActive;
  static const Color accentBlueActive = AppColorsBlue.normal;

  // Text
  static const Color textWhite = Color(0xFFF8FAFF);
  static const Color textGrey = Color(0xFFB8C6E2);
  static const Color textLight = Color(0xFF8FA3C7);

  // Borders / dividers
  static const Color border = Color(0xFF1441AE);
  static const Color divider = Color(0xFF10348B);

  // Secondary orange
  static const Color accentOrange = AppColorsOrange.lightActive;
  static const Color accentOrangeDark = AppColorsOrange.normal;
}