import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/features/auth/login/provider/login_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class StorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
  );

  static const accessTokenKey = 'accessToken';
  static const refreshTokenKey = 'refreshToken';

  static const themeKey = 'isLightTheme';

  Future<void> saveToken(
    String accessToken,
    String refreshToken,
  ) async {
    await _storage.write(
      key: accessTokenKey,
      value: accessToken,
    );

    await _storage.write(
      key: refreshTokenKey,
      value: refreshToken,
    );
  }

  Future<LoginModel?> getTokens() async {
    final accessToken =
        await _storage.read(key: accessTokenKey);

    final refreshToken =
        await _storage.read(key: refreshTokenKey);

    if (accessToken == null || refreshToken == null) {
      return null;
    }

    return LoginModel(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<void> clear() async {
    await _storage.delete(key: accessTokenKey);
    await _storage.delete(key: refreshTokenKey);
  }

  Future<void> saveThemePreference(bool isLightTheme) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setBool(
      themeKey,
      isLightTheme,
    );
  }

  Future<bool?> getThemePreference() async {
    final prefs = await SharedPreferences.getInstance();

    return prefs.getBool(themeKey);
  }
}