import 'package:easy_localization/easy_localization.dart';

/// Maps backend error messages to i18n translation keys.
/// Mirrors React getTranslatedMessage from helper.ts.
String getTranslatedMessage(String message) {
  final lower = message.toLowerCase().trim();
  if (lower.isEmpty) return message;

  if (lower.contains('user already exists')) return 'auth.userExists'.tr();
  if (lower.contains('invalid credentials')) return 'auth.invalidCredentials'.tr();
  if (lower.contains('verify your email')) return 'auth.emailVerifyFirst'.tr();
  if (lower.contains('server error')) return 'auth.serverError'.tr();
  if (lower.contains('logged in successfully')) return 'auth.loginSuccess'.tr();
  if (lower.contains('email sent')) return 'auth.emailSent'.tr();
  if (lower.contains('login failed')) return 'auth.loginFailed'.tr();
  if (lower.contains('registration failed')) return 'auth.registrationFailed'.tr();
  if (lower.contains('verification failed')) return 'auth.verificationFailed'.tr();
  if (lower.contains('not authenticated')) return 'auth.notAuthenticated'.tr();
  if (lower.contains('password changed successfully')) return 'profile.passwordChangedSuccess'.tr();
  if (lower.contains('account verified! you can now login')) return 'auth.verifiedLogin'.tr();
  if (lower.contains('if that email exists')) return 'auth.forgotPasswordEmailSent'.tr();
  if (lower.contains('password reset code sent')) return 'auth.forgotPasswordEmailSent'.tr();
  if (lower.contains('invalid otp or otp has expired')) return 'auth.invalidOrExpiredOTP'.tr();
  if (lower.contains('password reset successful')) return 'auth.resetSuccess'.tr();
  if (lower.contains('otp verified successfully')) return 'auth.otpVerifiedReset'.tr();
  if (lower.contains('invalid or expired otp')) return 'auth.invalidOrExpiredOTP'.tr();
  if (lower.contains('please provide current password')) return 'validation.provideAllFields'.tr();
  if (lower.contains('new password and confirmation do not match')) return 'validation.newPasswordMismatch'.tr();
  if (lower.contains('new password must be at least 8 characters')) return 'validation.newPasswordLength'.tr();
  if (lower.contains('new password must be different')) return 'validation.samePassword'.tr();
  if (lower.contains('user not found')) return 'validation.userNotFound'.tr();
  if (lower.contains('current password is incorrect')) return 'validation.currentPasswordIncorrect'.tr();

  return message;
}

/// Extract error message from a Dio error response or generic exception.
String extractErrorMessage(dynamic error, {String fallback = 'An error occurred'}) {
  if (error is Exception) {
    try {
      // DioException has a response field
      final dynamic dioError = error;
      final data = dioError.response?.data;
      if (data is Map<String, dynamic>) {
        return data['msg'] as String? ?? data['message'] as String? ?? fallback;
      }
    } catch (_) {}
    return error.toString();
  }
  if (error is String) return error;
  return fallback;
}
