import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../models/auth.dart';
import '../../providers/auth_provider.dart';
import '../../utils/validators.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/auth_layout.dart';
import '../../widgets/form/form_input.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../config/theme.dart';

/// Login screen — mirrors React LoginPage.tsx
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  String? _localError;
  String? _successMessage;
  Map<String, String> _errors = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authProvider.notifier).clearError();
      ref.read(authProvider.notifier).clearRegistrationData();
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    setState(() {
      _localError = null;
      _successMessage = null;
    });

    final errors = validateLogin(
      email: _emailController.text,
      password: _passwordController.text,
    );

    if (errors.isNotEmpty) {
      setState(() {
        _errors = errors;
        _localError = errors.values.join('\n');
      });
      return;
    }

    setState(() => _errors = {});

    final credentials = LoginCredentials(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    final response = await ref.read(authProvider.notifier).login(credentials);

    if (!mounted) return;

    if (response != null && response.success) {
      final msg = response.msg ?? 'auth.loginSuccess'.tr();
      setState(() => _successMessage = getTranslatedMessage(msg));
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) context.go('/dashboard');
    } else {
      final authState = ref.read(authProvider);
      if (authState.error != null) {
        setState(() => _localError = getTranslatedMessage(authState.error!));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return AuthLayout(
      title: 'auth.welcomeBack'.tr(),
      subtitle: 'auth.accessDashboard'.tr(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          GestureDetector(
            onTap: () => context.go('/'),
            child: Text('common.heartAI'.tr(),
                style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.gray900)),
          ),
          const SizedBox(height: 16),
          Text('auth.signInTitle'.tr(),
              style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.gray900)),
          const SizedBox(height: 4),
          Text('auth.enterCredentials'.tr(),
              style: const TextStyle(color: AppTheme.gray600)),
          const SizedBox(height: 24),

          // Success alert
          if (_successMessage != null)
            AlertCard(
              message: _successMessage!,
              variant: AlertVariant.success,
              onClose: () => setState(() => _successMessage = null),
            ),

          // Error alert
          if (_localError != null || authState.error != null)
            AlertCard(
              message: getTranslatedMessage(
                  _localError ?? authState.error ?? ''),
              variant: AlertVariant.error,
              onClose: () {
                setState(() => _localError = null);
                ref.read(authProvider.notifier).clearError();
              },
            ),

          const SizedBox(height: 8),

          // Email
          FormInput(
            label: 'auth.email'.tr(),
            placeholder: 'auth.emailPlaceholder'.tr(),
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            error: _errors['email'],
            onChanged: (_) {
              if (_errors.containsKey('email')) {
                setState(() => _errors.remove('email'));
              }
            },
          ),
          const SizedBox(height: 16),

          // Password
          FormInput(
            label: 'auth.password'.tr(),
            placeholder: 'auth.passwordPlaceholder'.tr(),
            controller: _passwordController,
            obscureText: true,
            showPasswordToggle: true,
            showPassword: _showPassword,
            onTogglePassword: () =>
                setState(() => _showPassword = !_showPassword),
            error: _errors['password'],
            onChanged: (_) {
              if (_errors.containsKey('password')) {
                setState(() => _errors.remove('password'));
              }
            },
          ),
          const SizedBox(height: 12),

          // Forgot password
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              onPressed: () => context.push('/forgot-password'),
              child: Text('auth.forgotPassword'.tr(),
                  style: const TextStyle(
                      color: AppTheme.cyan600,
                      fontWeight: FontWeight.w500,
                      fontSize: 14)),
            ),
          ),
          const SizedBox(height: 16),

          // Submit
          AppButton(
            text: 'auth.signIn'.tr(),
            onPressed: _handleSubmit,
            isLoading: authState.isLoading,
          ),
          const SizedBox(height: 24),

          // Register link
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('auth.dontHaveAccount'.tr(),
                    style: const TextStyle(color: AppTheme.gray600)),
                TextButton(
                  onPressed: () => context.push('/register'),
                  child: Text('auth.register'.tr(),
                      style: const TextStyle(
                          color: AppTheme.cyan600,
                          fontWeight: FontWeight.w500)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
