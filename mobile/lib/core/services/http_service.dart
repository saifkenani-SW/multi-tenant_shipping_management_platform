import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/services/storage_service.dart';

final httpServiceProvider = Provider<HttpService>((ref) {
  return HttpService(ref.read(storageServiceProvider));
});

class HttpService {
  final StorageService _storageService;

  late final Dio _dio;

  static const String baseUrl = 'https://saifkenani.me/';

  HttpService(this._storageService) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ),
    );

    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        // ==========================================================
        // REQUEST
        // ==========================================================
        onRequest: (options, handler) async {
          final requiresAuth = options.extra['requiresAuth'] ?? true;

          // الطلب لا يحتاج Authentication
          if (!requiresAuth) {
            handler.next(options);
            return;
          }

          final tokens = await _storageService.getTokens();

          if (tokens != null) {
            options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
          }

          handler.next(options);
        },

        // ==========================================================
        // ERROR
        // ==========================================================
        onError: (error, handler) async {
          final response = error.response;
          final requestOptions = error.requestOptions;

          // --------------------------------------------------------
          // إذا الخطأ ليس 401
          // --------------------------------------------------------

          if (response?.statusCode != 401) {
            handler.next(error);
            return;
          }

          // --------------------------------------------------------
          // الطلب تم عمل Retry له مسبقًا
          // لا نريد Loop لا نهائي
          // --------------------------------------------------------

          if (requestOptions.extra['retried'] == true) {
            log('REQUEST FAILED AFTER RETRY');

            await _storageService.clear();

            handler.next(error);
            return;
          }

          // --------------------------------------------------------
          // إذا كان الطلب نفسه لا يحتاج Authentication
          // فلا نعمل Refresh
          // --------------------------------------------------------

          final requiresAuth = requestOptions.extra['requiresAuth'] ?? true;

          if (!requiresAuth) {
            handler.next(error);
            return;
          }

          try {
            // ======================================================
            // 1. الحصول على Tokens الحالية
            // ======================================================

            final tokens = await _storageService.getTokens();

            if (tokens == null) {
              log('NO TOKENS FOUND');

              await _storageService.clear();

              handler.next(error);
              return;
            }

            final refreshToken = tokens.refreshToken;

            // ======================================================
            // 2. طلب Refresh
            // ======================================================

            log('ACCESS TOKEN EXPIRED');
            log('TRYING TO REFRESH TOKEN');

            final refreshResponse = await _dio.post(
              'auth/refresh',
              data: {'refreshToken': refreshToken},
              options: Options(extra: {'requiresAuth': false}),
            );

            // ======================================================
            // 3. قراءة Response
            // ======================================================

            final data = refreshResponse.data['data'];

            final newAccessToken = data['accessToken'] as String;

            final newRefreshToken = data['refreshToken'] as String;

            log('TOKEN REFRESH SUCCESS');

            // ======================================================
            // 4. حفظ Tokens الجديدة
            // ======================================================

            await _storageService.saveToken(newAccessToken, newRefreshToken);

            // ======================================================
            // 5. تعديل Authorization للطلب الأصلي
            // ======================================================

            requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';

            // منع Retry مرة أخرى بشكل لا نهائي
            requestOptions.extra['retried'] = true;

            // ======================================================
            // 6. إعادة تنفيذ الطلب الأصلي
            // ======================================================

            log(
              'RETRYING: '
              '${requestOptions.method} '
              '${requestOptions.uri}',
            );

            final retryResponse = await _dio.fetch(requestOptions);

            // ======================================================
            // 7. إرسال Response للمستدعي الأصلي
            // ======================================================

            handler.resolve(retryResponse);
          } on DioException catch (e) {
            // ======================================================
            // Refresh فشل
            // ======================================================

            log('REFRESH FAILED');

            log('URL: ${e.requestOptions.uri}');
            log('STATUS: ${e.response?.statusCode}');
            log('BODY: ${e.response?.data}');

            await _storageService.clear();

            handler.next(error);
          } catch (e, stackTrace) {
            log('UNEXPECTED REFRESH ERROR: $e', stackTrace: stackTrace);

            await _storageService.clear();

            handler.next(error);
          }
        },
      ),
    );
  }

  // ==============================================================
  // GET
  // ==============================================================

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool requiresAuth = true,
  }) async {
    options ??= Options();

    options.extra = {...?options.extra, 'requiresAuth': requiresAuth};

    return await _dio.get(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  // ==============================================================
  // POST
  // ==============================================================

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool requiresAuth = true,
  }) async {
    options ??= Options();

    options.extra = {...?options.extra, 'requiresAuth': requiresAuth};

    final res = await _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );

    log(res.data.toString());

    return res;
  }

  // ==============================================================
  // PUT
  // ==============================================================

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool requiresAuth = true,
  }) async {
    options ??= Options();

    options.extra = {...?options.extra, 'requiresAuth': requiresAuth};

    return await _dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}
