import 'package:flutter/foundation.dart';

/// Application-wide configuration constants.
class AppConfig {
  AppConfig._();

  /// Demo mode flag — set to true for offline APK, false for production.
  /// When true: no backend, no database, model runs locally on device.
  /// When false: uses backend API + AI service (original behavior).
  static const bool isDemoMode = true;

  /// Base URL for the backend API.
  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;

    if (kIsWeb) {
      return 'http://localhost:3000';
    }
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000';
  }

  /// Maximum recording duration in seconds.
  static const int maxRecordingDuration = 30;

  /// OTP resend cooldown in seconds.
  static const int otpResendCooldown = 30;

  /// Alert auto-dismiss duration in milliseconds.
  static const int alertDismissDuration = 3000;
}
