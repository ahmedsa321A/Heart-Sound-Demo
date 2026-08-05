import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../providers/auth_provider.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/auth_layout.dart';
import '../../widgets/form/form_input.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../config/theme.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  String? _validationError;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authProvider.notifier).clearError();
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    setState(() {
      _validationError = null;
      _successMessage = null;
    });

    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _validationError = 'validation.emailRequired'.tr());
      return;
    }

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(email)) {
      setState(() => _validationError = 'validation.invalidEmail'.tr());
      return;
    }

    final success =
        await ref.read(authProvider.notifier).forgotPassword(email);

    if (!mounted) return;

    if (success) {
      setState(() => _successMessage = 'auth.forgotPasswordEmailSent'.tr());
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.push('/verify-otp', extra: {'email': email, 'mode': 'reset'});
      }
    } else {
      final authState = ref.read(authProvider);
      setState(() => _validationError = authState.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return AuthLayout(
      title: 'auth.forgotPasswordTitle'.tr(),
      subtitle: 'auth.forgotPasswordSubtitle'.tr(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => context.go('/login'),
            child: Row(
              children: [
                Icon(
                  context.locale.languageCode == 'ar'
                      ? Icons.arrow_forward
                      : Icons.arrow_back,
                  color: AppTheme.cyan600,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Text(
                  'auth.backToLogin'.tr(),
                  style: const TextStyle(
                    color: AppTheme.cyan600,
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'auth.forgotPasswordTitle'.tr(),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.gray900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'auth.forgotPasswordSubtitle'.tr(),
            style: const TextStyle(color: AppTheme.gray600),
          ),
          const SizedBox(height: 24),

          if (_successMessage != null)
            AlertCard(
              message: _successMessage!,
              variant: AlertVariant.success,
              onClose: () => setState(() => _successMessage = null),
            ),

          if (_validationError != null)
            AlertCard(
              message: getTranslatedMessage(_validationError!),
              variant: AlertVariant.error,
              onClose: () => setState(() => _validationError = null),
            ),

          const SizedBox(height: 8),

          FormInput(
            label: 'auth.email'.tr(),
            placeholder: 'auth.emailPlaceholder'.tr(),
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            error: _validationError != null ? '' : null,
          ),
          const SizedBox(height: 24),

          AppButton(
            text: 'auth.sendResetLink'.tr(),
            onPressed: _handleSubmit,
            isLoading: authState.isLoading,
          ),
        ],
      ),
    );
  }
}
