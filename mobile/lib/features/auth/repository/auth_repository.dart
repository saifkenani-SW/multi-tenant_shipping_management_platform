import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/http_service.dart';
import 'package:mobile/core/services/storage_service.dart';
import 'package:mobile/features/auth/login/provider/login_dto.dart';
import 'package:mobile/features/auth/otp/providers/otp_model.dart';
import 'package:mobile/features/auth/register/register_dto.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final httpService = ref.read(httpServiceProvider);
  final storageService = ref.read(storageServiceProvider);

  return AuthRepository(httpService, storageService);
});

class AuthRepository {
  final HttpService _httpService;
  final StorageService _storageService;

  AuthRepository(this._httpService, this._storageService);

  Future<void> resendOtp(String email) async {
    Map<String, dynamic> dto = {'email': email};
    await _httpService.post(
      "customer/resend-otp",
      data: dto,
      requiresAuth: false,
    );
  }

  Future<void> verifyOtp(String email, String code) async {
    final dto = OtpModel(email: email, otp: code);
    await _httpService.post(
      "customer/verify-otp",
      data: dto.toJson(),
      requiresAuth: false,
    );
  }

  Future<void> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    final registerDto = RegisterDto(
      email: email,
      name: name,
      phone: phone,
      password: password,
    );
    log(registerDto.toString());
    await _httpService.post(
      "customer/register",
      data: registerDto.toJson(),
      requiresAuth: false,
    );
    log("message");
  }

  Future<void> login(String email, String password) async {
    LoginDto dto = LoginDto(email: email, password: password);
    log(dto.toString());
    log(dto.toJson().toString());

    final res = await _httpService.post(
      "auth/login",
      data: dto.toJson(),
      options: Options(headers: {"client-type": "MOBILE"}),
      requiresAuth: false,
    );
    if (res.data != null) {
      log(res.data['data']['accessToken'].toString());
      log(res.data['data']['refreshToken'].toString());

      await _storageService.saveToken(
        res.data['data']['accessToken'],
        res.data['data']['refreshToken'],
      );
    }
  }

  Future<void> logOut() async {
    final res = await _httpService.post(
      "auth/logout",
      options: Options(headers: {"client-type": "MOBILE"}),
    );
    log("logOut : " + res.data.toString());
    if (res.statusCode == 200) {
      await _storageService.clear();
    }
  }
}
