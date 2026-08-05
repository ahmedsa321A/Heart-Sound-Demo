import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../providers/auth_provider.dart';
import '../../utils/validators.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/dashboard_layout.dart';
import '../../widgets/form/form_input.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../widgets/common/app_loader.dart';
import '../../config/theme.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showCurrentPassword = false;
  bool _showNewPasswords = false;

  String? _successMessage;
  String? _passwordSuccessMessage;
  String? _profileError;
  String? _passwordError;

  Map<String, String> _profileErrors = {};
  Map<String, String> _passwordErrors = {};

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    if (user != null) {
      _nameController.text = user.fullName;
      _ageController.text = user.age?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdateProfile() async {
    setState(() {
      _successMessage = null;
      _profileError = null;
      _profileErrors = {};
    });

    final errors = validateProfile(
      fullName: _nameController.text,
      age: _ageController.text,
    );

    if (errors.isNotEmpty) {
      setState(() {
        _profileErrors = errors;
        _profileError = errors.values.join('\n');
      });
      return;
    }

    final success = await ref.read(authProvider.notifier).updateProfile(
          fullName: _nameController.text.trim(),
          age: int.tryParse(_ageController.text),
        );

    if (!mounted) return;

    if (success) {
      setState(() => _successMessage = 'profile.updateSuccess'.tr());
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _successMessage = null);
      });
    } else {
      final authState = ref.read(authProvider);
      setState(() => _profileError = authState.error);
    }
  }

  Future<void> _handleChangePassword() async {
    setState(() {
      _passwordSuccessMessage = null;
      _passwordError = null;
      _passwordErrors = {};
    });

    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    final errors = validateChangePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );

    if (errors.isNotEmpty) {
      setState(() {
        _passwordErrors = errors;
        _passwordError = errors.values.join('\n');
      });
      return;
    }

    final success = await ref.read(authProvider.notifier).changePassword(
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        );

    if (!mounted) return;

    if (success) {
      setState(() =>
          _passwordSuccessMessage = 'profile.passwordChangedSuccess'.tr());
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();

      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        await ref.read(authProvider.notifier).logout();
        if (mounted) context.go('/login');
      }
    } else {
      final authState = ref.read(authProvider);
      setState(() => _passwordError = authState.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null) {
      return const DashboardLayout(
        child: Center(child: AppLoader(size: 40)),
      );
    }

    return DashboardLayout(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Back button
          TextButton.icon(
            onPressed: () => context.go('/dashboard'),
            icon: Icon(
              context.locale.languageCode == 'ar'
                  ? Icons.arrow_forward
                  : Icons.arrow_back,
              size: 16,
            ),
            label: Text('common.back'.tr()),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.gray600,
            ),
          ),
          const SizedBox(height: 16),

          // Main Card
          Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Card Header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'profile.title'.tr(),
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              'profile.subtitle'.tr(),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.cyan100,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Card Body - Personal Info
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_successMessage != null)
                        AlertCard(
                          message: _successMessage!,
                          variant: AlertVariant.success,
                          onClose: () => setState(() => _successMessage = null),
                        ),
                      if (_profileError != null)
                        AlertCard(
                          message: getTranslatedMessage(_profileError!),
                          variant: AlertVariant.error,
                          onClose: () => setState(() => _profileError = null),
                        ),

                      Text(
                        'profile.personalInfo'.tr(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.gray900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Divider(),
                      const SizedBox(height: 16),

                      FormInput(
                        label: 'profile.name'.tr(),
                        placeholder: 'auth.fullNamePlaceholder'.tr(),
                        controller: _nameController,
                        error: _profileErrors['fullName'],
                      ),
                      const SizedBox(height: 16),

                      FormInput(
                        label: 'profile.email'.tr(),
                        controller: TextEditingController(text: user.email),
                        enabled: false,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'profile.emailCannotChange'.tr(),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.gray500,
                        ),
                      ),
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
                              error: _profileErrors['age'],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FormInput(
                              label: 'auth.gender'.tr(),
                              controller: TextEditingController(
                                text: user.gender != null
                                    ? 'auth.${user.gender!.toLowerCase()}'.tr()
                                    : '',
                              ),
                              enabled: false,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      AppButton(
                        text: 'profile.saveChanges'.tr(),
                        onPressed: _handleUpdateProfile,
                        isLoading: authState.isLoading,
                        fullWidth: false,
                        icon: const Icon(Icons.save, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                ),

                // Card Body - Change Password
                Container(
                  decoration: const BoxDecoration(
                    color: AppTheme.gray50,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_passwordSuccessMessage != null)
                        AlertCard(
                          message: _passwordSuccessMessage!,
                          variant: AlertVariant.success,
                          onClose: () =>
                              setState(() => _passwordSuccessMessage = null),
                        ),
                      if (_passwordError != null)
                        AlertCard(
                          message: getTranslatedMessage(_passwordError!),
                          variant: AlertVariant.error,
                          onClose: () => setState(() => _passwordError = null),
                        ),

                      Text(
                        'profile.changePasswordTitle'.tr(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.gray900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Divider(),
                      const SizedBox(height: 16),

                      FormInput(
                        label: 'profile.currentPassword'.tr(),
                        placeholder: 'auth.passwordPlaceholder'.tr(),
                        controller: _currentPasswordController,
                        obscureText: true,
                        showPasswordToggle: true,
                        showPassword: _showCurrentPassword,
                        onTogglePassword: () => setState(
                            () => _showCurrentPassword = !_showCurrentPassword),
                        error: _passwordErrors['currentPassword'],
                      ),
                      const SizedBox(height: 16),

                      FormInput(
                        label: 'profile.newPassword'.tr(),
                        placeholder: 'auth.passwordPlaceholder'.tr(),
                        controller: _newPasswordController,
                        obscureText: true,
                        showPasswordToggle: true,
                        showPassword: _showNewPasswords,
                        onTogglePassword: () => setState(
                            () => _showNewPasswords = !_showNewPasswords),
                        error: _passwordErrors['newPassword'],
                      ),
                      const SizedBox(height: 16),

                      FormInput(
                        label: 'profile.confirmNewPassword'.tr(),
                        placeholder: 'auth.passwordPlaceholder'.tr(),
                        controller: _confirmPasswordController,
                        obscureText: true,
                        showPasswordToggle: true,
                        showPassword: _showNewPasswords,
                        onTogglePassword: () => setState(
                            () => _showNewPasswords = !_showNewPasswords),
                        error: _passwordErrors['confirmPassword'],
                      ),
                      const SizedBox(height: 24),

                      AppButton(
                        text: 'profile.updatePasswordBtn'.tr(),
                        onPressed: _handleChangePassword,
                        isLoading: authState.isLoading,
                        outlined: true,
                        fullWidth: false,
                      ),
                    ],
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
