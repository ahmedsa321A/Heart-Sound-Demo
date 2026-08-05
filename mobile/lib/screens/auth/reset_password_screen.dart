import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../providers/auth_provider.dart';
import '../../utils/validators.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/auth_layout.dart';
import '../../widgets/form/form_input.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../config/theme.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String email;

  const ResetPasswordScreen({super.key, required this.email});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _showPasswords = false;
  String? _localError;
  String? _successMessage;
  Map<String, String> _errors = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.email.isEmpty) {
        context.go('/forgot-password');
      }
      ref.read(authProvider.notifier).clearError();
    });
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    setState(() {
      _localError = null;
      _successMessage = null;
    });

    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    final validationErrors = validateResetPassword(
      password: password,
      confirmPassword: confirmPassword,
    );

    if (validationErrors.isNotEmpty) {
      setState(() {
        _errors = validationErrors;
        _localError = validationErrors.values.join('\n');
      });
      return;
    }

    setState(() => _errors = {});

    final success =
        await ref.read(authProvider.notifier).resetPassword(password);

    if (!mounted) return;

    if (success) {
      setState(() => _successMessage = 'auth.resetSuccess'.tr());
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.go('/login');
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
      title: 'auth.resetPasswordTitle'.tr(),
      subtitle: 'auth.resetPasswordSubtitle'.tr(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => context.go('/login'),
            child: Text('common.heartAI'.tr(),
                style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.gray900)),
          ),
          const SizedBox(height: 16),
          Text(
            'auth.resetPasswordTitle'.tr(),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.gray900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'auth.resetPasswordSubtitle'.tr(),
            style: const TextStyle(color: AppTheme.gray600),
          ),
          const SizedBox(height: 24),

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

          FormInput(
            label: 'profile.newPassword'.tr(),
            placeholder: 'auth.passwordPlaceholder'.tr(),
            controller: _passwordController,
            obscureText: true,
            showPasswordToggle: true,
            showPassword: _showPasswords,
            onTogglePassword: () =>
                setState(() => _showPasswords = !_showPasswords),
            error: _errors['password'],
          ),
          const SizedBox(height: 16),

          FormInput(
            label: 'profile.confirmNewPassword'.tr(),
            placeholder: 'auth.passwordPlaceholder'.tr(),
            controller: _confirmPasswordController,
            obscureText: true,
            showPasswordToggle: true,
            showPassword: _showPasswords,
            onTogglePassword: () =>
                setState(() => _showPasswords = !_showPasswords),
            error: _errors['confirmPassword'],
          ),
          const SizedBox(height: 24),

          AppButton(
            text: 'auth.resetPasswordBtn'.tr(),
            onPressed: _handleSubmit,
            isLoading: authState.isLoading,
          ),
        ],
      ),
    );
  }
}
