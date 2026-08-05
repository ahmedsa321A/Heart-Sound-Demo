import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';

/// Provides a singleton [CookieJar] for cookie persistence.
final cookieJarProvider = Provider<CookieJar>((ref) => CookieJar());

/// Provides a configured [Dio] instance with cookie management and
/// automatic token-refresh interceptor — mirrors the React Axios setup.
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    contentType: 'application/json',
    extra: const {'withCredentials': true},
  ));

  // Cookie manager — simulates withCredentials: true on mobile
  if (!kIsWeb) {
    final cookieJar = ref.read(cookieJarProvider);
    dio.interceptors.add(CookieManager(cookieJar));
  }

  // Token refresh interceptor — mirrors api.ts interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 &&
            error.requestOptions.extra['_retry'] != true) {
          error.requestOptions.extra['_retry'] = true;

          try {
            // Attempt to refresh
            await dio.post('/auth/refresh');

            // Retry the original request
            final opts = Options(
              method: error.requestOptions.method,
              headers: error.requestOptions.headers,
              extra: error.requestOptions.extra,
            );
            final retryResponse = await dio.request(
              error.requestOptions.path,
              data: error.requestOptions.data,
              queryParameters: error.requestOptions.queryParameters,
              options: opts,
            );
            return handler.resolve(retryResponse);
          } on DioException {
            // Refresh failed — session is dead.
            // The auth provider will handle navigation to login.
            return handler.reject(error);
          }
        }
        return handler.next(error);
      },
    ),
  );

  return dio;
});
