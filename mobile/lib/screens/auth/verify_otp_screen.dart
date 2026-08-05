import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../providers/auth_provider.dart';
import '../../models/auth.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/auth_layout.dart';
import '../../widgets/form/form_input.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../config/theme.dart';

class VerifyOTPScreen extends ConsumerStatefulWidget {
  final String email;
  final String mode; // 'register' | 'reset'

  const VerifyOTPScreen({
    super.key,
    required this.email,
    required this.mode,
  });

  @override
  ConsumerState<VerifyOTPScreen> createState() => _VerifyOTPScreenState();
}

class _VerifyOTPScreenState extends ConsumerState<VerifyOTPScreen> {
  final _otpController = TextEditingController();
  int _timer = 30;
  Timer? _countdownTimer;
  String? _localError;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.email.isEmpty) {
        context.go(widget.mode == 'register' ? '/register' : '/forgot-password');
      }
      ref.read(authProvider.notifier).clearError();
    });
  }

  void _startTimer() {
    _countdownTimer?.cancel();
    setState(() => _timer = 30);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timer > 0) {
        setState(() => _timer--);
      } else {
        _countdownTimer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleResend() async {
    if (_timer > 0 || widget.email.isEmpty) return;

    bool success;
    if (widget.mode == 'register') {
      success = await ref
          .read(authProvider.notifier)
          .resendVerificationOTP(widget.email);
    } else {
      success = await ref
          .read(authProvider.notifier)
          .forgotPassword(widget.email);
    }

    if (success) {
      _startTimer();
      setState(() => _successMessage = 'auth.otpResent'.tr());
    } else {
      final authState = ref.read(authProvider);
      setState(() => _localError = authState.error);
    }
  }

  Future<void> _handleSubmit() async {
    setState(() {
      _localError = null;
      _successMessage = null;
    });

    final otp = _otpController.text.trim();
    if (otp.isEmpty || otp.length < 6) {
      setState(() => _localError = 'auth.invalidOTP'.tr());
      return;
    }

    final data = VerifyOtpData(email: widget.email, otp: otp);
    bool success;

    if (widget.mode == 'register') {
      success = await ref.read(authProvider.notifier).verifyOTP(data);
    } else {
      success = await ref.read(authProvider.notifier).verifyResetOTP(data);
    }

    if (!mounted) return;

    if (success) {
      final message = widget.mode == 'register'
          ? 'auth.verifiedSuccess'.tr()
          : 'auth.otpVerifiedReset'.tr();
      setState(() => _successMessage = message);

      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        if (widget.mode == 'register') {
          context.go('/login');
        } else {
          context.go('/reset-password', extra: {'email': widget.email});
        }
      }
    } else {
      final authState = ref.read(authProvider);
      setState(() => _localError = authState.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return AuthLayout(
      title: 'auth.verifyAccount'.tr(),
      subtitle: 'auth.enterCode'.tr(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => context.go('/'),
            child: Text('common.heartAI'.tr(),
                style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.gray900)),
          ),
          const SizedBox(height: 16),
          Text('auth.verifyAccount'.tr(),
              style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.gray900)),
          const SizedBox(height: 16),

          // Progress indicator for registration only
          if (widget.mode == 'register') ...[
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Container(
                          height: 4,
                          decoration: BoxDecoration(
                              color: AppTheme.cyan600,
                              borderRadius: BorderRadius.circular(2))),
                      const SizedBox(height: 4),
                      Text('auth.personalInfo'.tr(),
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.cyan600,
                              fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    children: [
                      Container(
                          height: 4,
                          decoration: BoxDecoration(
                              color: AppTheme.cyan600,
                              borderRadius: BorderRadius.circular(2))),
                      const SizedBox(height: 4),
                      Text('auth.medicalInfo'.tr(),
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.cyan600,
                              fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    children: [
                      Container(
                          height: 4,
                          decoration: BoxDecoration(
                              color: AppTheme.cyan600,
                              borderRadius: BorderRadius.circular(2))),
                      const SizedBox(height: 4),
                      Text('auth.verification'.tr(),
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.cyan600,
                              fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],

          if (_successMessage != null)
            AlertCard(
              message: _successMessage!,
              variant: AlertVariant.success,
              onClose: () => setState(() => _successMessage = null),
            ),

          if (_localError != null)
            AlertCard(
              message: getTranslatedMessage(_localError!),
              variant: AlertVariant.error,
              onClose: () => setState(() => _localError = null),
            ),

          const SizedBox(height: 8),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.blue50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppTheme.blue700, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(color: AppTheme.blue800, fontSize: 14),
                      children: [
                        TextSpan(text: 'auth.codeSentTo'.tr()),
                        const TextSpan(text: ' '),
                        TextSpan(
                          text: widget.email,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const TextSpan(text: '.'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          FormInput(
            label: 'auth.verificationCode'.tr(),
            placeholder: 'auth.enter6DigitCode'.tr(),
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            error: _localError != null ? '' : null,
          ),
          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: 'common.back'.tr(),
                  onPressed: () => context.pop(),
                  outlined: true,
                  icon: const Icon(Icons.chevron_left, size: 20),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppButton(
                  text: 'auth.verifyBtn'.tr(),
                  onPressed: _handleSubmit,
                  isLoading: authState.isLoading,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          Center(
            child: TextButton(
              onPressed: _timer > 0 ? null : _handleResend,
              child: Text(
                _timer > 0
                    ? '${'auth.resendIn'.tr()} ${_timer}s'
                    : 'auth.resendOTP'.tr(),
                style: TextStyle(
                  color: _timer > 0 ? AppTheme.gray400 : AppTheme.cyan600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
