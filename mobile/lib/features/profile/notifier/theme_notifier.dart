import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/storage_service.dart';

final initialThemeProvider = Provider<ThemeMode>((ref) {
  return ThemeMode.light;
});

class ThemeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    return ref.watch(initialThemeProvider);
  }

  Future<void> toggleTheme() async {
    final newTheme = state == ThemeMode.light
        ? ThemeMode.dark
        : ThemeMode.light;

    state = newTheme;

    await ref.read(storageServiceProvider).saveThemePreference(
          newTheme == ThemeMode.light,
        );
  }
}

final themeNotifierProvider =
    NotifierProvider<ThemeNotifier, ThemeMode>(
  ThemeNotifier.new,
);