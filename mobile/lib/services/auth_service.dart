import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth.dart';
import '../models/user.dart';
import 'api_client.dart';

/// Auth service — mirrors React authService.ts
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(dioProvider));
});

class AuthService {
  final Dio _dio;

  AuthService(this._dio);

  Future<Map<String, dynamic>> register(RegisterData data) async {
    final response = await _dio.post('/auth/register', data: data.toJson());
    return response.data as Map<String, dynamic>;
  }

  Future<AuthResponse> verifyOTP(VerifyOtpData data) async {
    final response = await _dio.post('/auth/verify', data: data.toJson());
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponse> login(LoginCredentials credentials) async {
    final response = await _dio.post('/auth/login', data: credentials.toJson());
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // Always clear local state regardless
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      final response = await _dio.get('/auth/me');
      final data = response.data as Map<String, dynamic>;
      if (data['data'] != null) {
        return User.fromJson(data['data'] as Map<String, dynamic>);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response =
        await _dio.post('/auth/forgot-password', data: {'email': email});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyResetOTP(VerifyOtpData data) async {
    final response =
        await _dio.post('/auth/verify-reset-otp', data: data.toJson());
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> resetPassword(String newPassword) async {
    final response = await _dio.post('/auth/reset-password',
        data: {'newPassword': newPassword});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await _dio.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
      'confirmPassword': confirmPassword,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> resendVerificationOTP(String email) async {
    final response =
        await _dio.post('/auth/resend-otp', data: {'email': email});
    return response.data as Map<String, dynamic>;
  }
}
