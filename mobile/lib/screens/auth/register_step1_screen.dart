import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../config/theme.dart';
import '../../models/auth.dart';
import '../../providers/auth_provider.dart';
import '../../utils/validators.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/auth_layout.dart';
import '../../widgets/form/form_input.dart';
import '../../widgets/form/form_select.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';

class RegisterStep1Screen extends ConsumerStatefulWidget {
  const RegisterStep1Screen({super.key});

  @override
  ConsumerState<RegisterStep1Screen> createState() => _RegisterStep1ScreenState();
}

class _RegisterStep1ScreenState extends ConsumerState<RegisterStep1Screen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _ageController = TextEditingController();
  String _gender = '';

  bool _showPassword = false;
  String? _localError;
  Map<String, String> _errors = {};

  @override
  void initState() {
    super.initState();
    // Pre-populate if registrationData already exists
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final regData = ref.read(authProvider).registrationData;
      if (regData != null) {
        _nameController.text = regData.fullName ?? '';
        _emailController.text = regData.email ?? '';
        _passwordController.text = regData.password ?? '';
        _ageController.text = regData.age?.toString() ?? '';
        setState(() {
          _gender = regData.gender ?? '';
        });
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    setState(() {
      _localError = null;
      _errors = {};
    });

    final name = _nameController.text;
    final email = _emailController.text;
    final password = _passwordController.text;
    final ageStr = _ageController.text;

    final validationErrors = validateRegisterStep1(
      fullName: name,
      email: email,
      password: password,
      age: ageStr,
      gender: _gender,
    );

    if (validationErrors.isNotEmpty) {
      setState(() {
        _errors = validationErrors;
        _localError = validationErrors.values.join('\n');
      });
      return;
    }

    final data = RegisterData(
      fullName: name,
      email: email.trim(),
      password: password,
      age: int.tryParse(ageStr),
      gender: _gender,
    );

    ref.read(authProvider.notifier).setRegistrationData(data);
    context.push('/register/step-2');
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'auth.createAccount'.tr(),
      subtitle: 'auth.step1Subtitle'.tr(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo & Back Link
          GestureDetector(
            onTap: () => context.go('/'),
            child: Text(
              'common.heartAI'.tr(),
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: AppTheme.gray900,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'auth.createAccount'.tr(),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.gray900,
            ),
          ),
          const SizedBox(height: 16),

          // Progress Indicator
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: AppTheme.cyan600,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'auth.personalInfo'.tr(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.cyan600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: AppTheme.gray200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'auth.medicalInfo'.tr(),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.gray400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (_localError != null)
            AlertCard(
              message: getTranslatedMessage(_localError!),
              variant: AlertVariant.error,
              onClose: () => setState(() => _localError = null),
            ),

          FormInput(
            label: 'auth.fullName'.tr(),
            placeholder: 'auth.fullNamePlaceholder'.tr(),
            controller: _nameController,
            error: _errors['fullName'],
          ),
          const SizedBox(height: 16),

          FormInput(
            label: 'auth.email'.tr(),
            placeholder: 'auth.emailPlaceholder'.tr(),
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            error: _errors['email'],
          ),
          const SizedBox(height: 16),

          FormInput(
            label: 'auth.password'.tr(),
            placeholder: 'auth.passwordPlaceholder'.tr(),
            controller: _passwordController,
            obscureText: true,
            showPasswordToggle: true,
            showPassword: _showPassword,
            onTogglePassword: () => setState(() => _showPassword = !_showPassword),
            error: _errors['password'],
          ),
          if (_errors['password'] == null) ...[
            const SizedBox(height: 4),
            Text(
              'auth.passwordHint'.tr(),
              style: const TextStyle(fontSize: 12, color: AppTheme.gray500),
            ),
          ],
          const SizedBox(height: 16),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: FormInput(
                  label: 'auth.age'.tr(),
                  placeholder: 'auth.agePlaceholder'.tr(),
                  controller: _ageController,
                  keyboardType: TextInputType.number,
                  error: _errors['age'],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: FormSelect(
                  label: 'auth.gender'.tr(),
                  value: _gender,
                  options: [
                    SelectOption(value: 'male', label: 'auth.male'.tr()),
                    SelectOption(value: 'female', label: 'auth.female'.tr()),
                  ],
                  onChanged: (val) => setState(() => _gender = val ?? ''),
                  error: _errors['gender'],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          AppButton(
            text: 'auth.nextStep'.tr(),
            onPressed: _handleSubmit,
            icon: Icon(
              context.locale.languageCode == 'ar'
                  ? Icons.chevron_left
                  : Icons.chevron_right,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),

          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'auth.alreadyHaveAccount'.tr(),
                  style: const TextStyle(color: AppTheme.gray600),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => context.go('/login'),
                  child: Text(
                    'auth.signIn'.tr(),
                    style: const TextStyle(
                      color: AppTheme.cyan600,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
