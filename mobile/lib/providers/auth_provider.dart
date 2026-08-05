import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../models/auth.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/profile_service.dart';
import '../services/demo/demo_auth_service.dart';
import '../utils/message_translator.dart';

/// Auth state — mirrors React AuthState from authSlice.ts
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final RegisterData? registrationData;
  final bool isInitialized;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.registrationData,
    this.isInitialized = false,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    RegisterData? registrationData,
    bool? isInitialized,
    bool clearUser = false,
    bool clearError = false,
    bool clearRegistrationData = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      registrationData: clearRegistrationData
          ? null
          : (registrationData ?? this.registrationData),
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }
}

/// Auth state notifier — mirrors React authSlice.ts actions & reducers.
/// In demo mode, uses DemoAuthService (no network).
/// In production mode, uses original AuthService + ProfileService.
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService? _authService;
  final ProfileService? _profileService;
  final DemoAuthService? _demoAuthService;

  AuthNotifier(this._authService, this._profileService, this._demoAuthService)
      : super(const AuthState()) {
    checkAuth();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void setRegistrationData(RegisterData data) {
    final current = state.registrationData;
    state = state.copyWith(
      registrationData: current != null ? current.merge(data) : data,
    );
  }

  void clearRegistrationData() {
    state = state.copyWith(clearRegistrationData: true);
  }

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);

    if (AppConfig.isDemoMode) {
      // Demo mode: instant demo user
      final user = await _demoAuthService!.getCurrentUser();
      state = state.copyWith(
        user: user,
        isLoading: false,
        isInitialized: true,
      );
      return;
    }

    // Production mode: check with backend
    try {
      final user = await _authService!.getCurrentUser();
      state = state.copyWith(
        user: user,
        isLoading: false,
        isInitialized: true,
        clearUser: user == null,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        isInitialized: true,
      );
    }
  }

  Future<AuthResponse?> login(LoginCredentials credentials) async {
    state = state.copyWith(isLoading: true, clearError: true);

    if (AppConfig.isDemoMode) {
      final response = await _demoAuthService!.login(credentials);
      state = state.copyWith(
        isLoading: false,
        user: response.user,
        isInitialized: true,
      );
      return response;
    }

    try {
      final response = await _authService!.login(credentials);
      if (!response.success) {
        state = state.copyWith(
          isLoading: false,
          error: response.msg ?? 'Login failed',
        );
        return response;
      }
      state = state.copyWith(
        isLoading: false,
        user: response.user,
        isInitialized: true,
      );
      return response;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Login failed');
      state = state.copyWith(isLoading: false, error: msg);
      return null;
    }
  }

  Future<bool> register(RegisterData data) async {
    if (AppConfig.isDemoMode) return true; // No-op in demo

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _authService!.register(data);
      state = state.copyWith(isLoading: false);
      final success = response['success'] as bool? ?? true;
      if (!success) {
        state = state.copyWith(
          error: response['msg'] as String? ?? 'Registration failed',
        );
      }
      return success;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Registration failed');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> verifyOTP(VerifyOtpData data) async {
    if (AppConfig.isDemoMode) return true;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _authService!.verifyOTP(data);
      state = state.copyWith(
        isLoading: false,
        user: response.user,
      );
      return response.success;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Verification failed');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> verifyResetOTP(VerifyOtpData data) async {
    if (AppConfig.isDemoMode) return true;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authService!.verifyResetOTP(data);
      state = state.copyWith(isLoading: false);
      return true;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Verification failed');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    if (AppConfig.isDemoMode) return true;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authService!.forgotPassword(email);
      state = state.copyWith(isLoading: false);
      return true;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Failed to process request');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> resetPassword(String newPassword) async {
    if (AppConfig.isDemoMode) return true;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authService!.resetPassword(newPassword);
      state = state.copyWith(isLoading: false);
      return true;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Reset failed');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    if (AppConfig.isDemoMode) return true;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authService!.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      state = state.copyWith(isLoading: false);
      return true;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Change password failed');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> resendVerificationOTP(String email) async {
    if (AppConfig.isDemoMode) return true;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authService!.resendVerificationOTP(email);
      state = state.copyWith(isLoading: false);
      return true;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Failed to resend OTP');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<bool> updateProfile({String? fullName, int? age}) async {
    if (AppConfig.isDemoMode) {
      await _demoAuthService!.updateProfile(fullName: fullName, age: age);
      return true;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final updates = <String, dynamic>{};
      if (fullName != null) updates['fullName'] = fullName;
      if (age != null) updates['age'] = age;

      final updated = await _profileService!.updateProfile(updates);
      state = state.copyWith(
        isLoading: false,
        user: state.user?.copyWith(
          fullName: updated.fullName,
          age: updated.age,
        ),
      );
      return true;
    } on DioException catch (e) {
      final msg = extractErrorMessage(e, fallback: 'Update failed');
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    }
  }

  Future<void> logout() async {
    if (!AppConfig.isDemoMode) {
      await _authService!.logout();
    }
    state = state.copyWith(
      clearUser: true,
      clearRegistrationData: true,
    );
  }
}

/// Main auth state provider.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  if (AppConfig.isDemoMode) {
    return AuthNotifier(null, null, DemoAuthService());
  }
  return AuthNotifier(
    ref.read(authServiceProvider),
    ref.read(profileServiceProvider),
    null,
  );
});
