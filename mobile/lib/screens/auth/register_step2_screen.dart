import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../models/auth.dart';
import '../../providers/auth_provider.dart';
import '../../utils/validators.dart';
import '../../utils/message_translator.dart';
import '../../widgets/layouts/auth_layout.dart';
import '../../widgets/form/form_radio_group.dart';
import '../../widgets/form/form_checkbox_group.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../config/theme.dart';

class RegisterStep2Screen extends ConsumerStatefulWidget {
  const RegisterStep2Screen({super.key});
  @override
  ConsumerState<RegisterStep2Screen> createState() => _RegisterStep2ScreenState();
}

class _RegisterStep2ScreenState extends ConsumerState<RegisterStep2Screen> {
  String _familyHistory = '';
  String _hypertension = '';
  String _diabetes = '';
  String _renalPathologies = '';
  List<String> _chronicCardiac = [];
  Map<String, String> _errors = {};
  String? _successMessage;
  String? _generalError;

  @override
  void initState() {
    super.initState();
    final reg = ref.read(authProvider).registrationData;
    if (reg == null || reg.email == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/register'));
      return;
    }
    _familyHistory = reg.familyHistory ?? '';
    _hypertension = reg.hypertension ?? '';
    _diabetes = reg.diabetes ?? '';
    _renalPathologies = reg.renalPathologies ?? '';
    _chronicCardiac = List<String>.from(reg.chronicCardiac ?? []);
  }

  Future<void> _handleSubmit() async {
    final errors = validateRegisterStep2(
      familyHistory: _familyHistory, hypertension: _hypertension,
      diabetes: _diabetes, renalPathologies: _renalPathologies,
    );
    if (errors.isNotEmpty) {
      setState(() { _errors = errors; _generalError = errors.values.join('\n'); });
      return;
    }
    setState(() { _errors = {}; _generalError = null; });

    final step2 = RegisterData(
      familyHistory: _familyHistory, hypertension: _hypertension,
      diabetes: _diabetes, renalPathologies: _renalPathologies,
      chronicCardiac: _chronicCardiac,
    );
    ref.read(authProvider.notifier).setRegistrationData(step2);

    final fullData = ref.read(authProvider).registrationData!;
    final success = await ref.read(authProvider.notifier).register(fullData);

    if (!mounted) return;
    if (success) {
      setState(() => _successMessage = 'auth.registrationSuccess'.tr());
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.push('/verify-otp', extra: {'email': fullData.email, 'mode': 'register'});
      }
    } else {
      final authState = ref.read(authProvider);
      setState(() => _generalError = authState.error ?? 'Registration failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final yesNo = [RadioOption(value: 'yes', label: 'auth.yes'.tr()), RadioOption(value: 'no', label: 'auth.no'.tr())];
    final cardiacOpts = [
      CheckboxOption(value: 'mi', label: 'auth.mi'.tr()),
      CheckboxOption(value: 'heart-failure', label: 'auth.heartFailure'.tr()),
      CheckboxOption(value: 'ischemia', label: 'auth.ischemia'.tr()),
    ];

    return AuthLayout(
      title: 'auth.medicalInfo'.tr(),
      subtitle: 'auth.step2Subtitle'.tr(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => context.go('/'),
            child: Text('common.heartAI'.tr(), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.gray900)),
          ),
          const SizedBox(height: 16),
          // Progress
          Row(children: [
            Expanded(child: Column(children: [
              Container(height: 4, decoration: BoxDecoration(color: AppTheme.cyan600, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 4),
              Text('auth.personalInfo'.tr(), style: const TextStyle(fontSize: 12, color: AppTheme.cyan600, fontWeight: FontWeight.w500)),
            ])),
            const SizedBox(width: 16),
            Expanded(child: Column(children: [
              Container(height: 4, decoration: BoxDecoration(color: AppTheme.cyan600, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 4),
              Text('auth.medicalInfo'.tr(), style: const TextStyle(fontSize: 12, color: AppTheme.cyan600, fontWeight: FontWeight.w500)),
            ])),
          ]),
          const SizedBox(height: 24),
          if (_successMessage != null) AlertCard(message: _successMessage!, variant: AlertVariant.success, onClose: () => setState(() => _successMessage = null)),
          if (_generalError != null) AlertCard(message: getTranslatedMessage(_generalError!), variant: AlertVariant.error, onClose: () => setState(() => _generalError = null)),
          const SizedBox(height: 8),
          FormRadioGroup(label: 'auth.familyHistory'.tr(), value: _familyHistory, options: yesNo, onChanged: (v) => setState(() => _familyHistory = v ?? ''), error: _errors['familyHistory'], required: true),
          const SizedBox(height: 16),
          FormRadioGroup(label: 'auth.hypertension'.tr(), value: _hypertension, options: yesNo, onChanged: (v) => setState(() => _hypertension = v ?? ''), error: _errors['hypertension'], required: true),
          const SizedBox(height: 16),
          FormRadioGroup(label: 'auth.diabetes'.tr(), value: _diabetes, options: yesNo, onChanged: (v) => setState(() => _diabetes = v ?? ''), error: _errors['diabetes'], required: true),
          const SizedBox(height: 16),
          FormCheckboxGroup(label: 'auth.chronicCardiac'.tr(), options: cardiacOpts, selectedValues: _chronicCardiac, onToggle: (v) {
            setState(() { _chronicCardiac.contains(v) ? _chronicCardiac.remove(v) : _chronicCardiac.add(v); });
          }),
          const SizedBox(height: 16),
          FormRadioGroup(label: 'auth.renalPathologies'.tr(), value: _renalPathologies, options: yesNo, onChanged: (v) => setState(() => _renalPathologies = v ?? ''), error: _errors['renalPathologies'], required: true),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(child: AppButton(text: 'auth.back'.tr(), onPressed: () { ref.read(authProvider.notifier).setRegistrationData(RegisterData(familyHistory: _familyHistory, hypertension: _hypertension, diabetes: _diabetes, renalPathologies: _renalPathologies, chronicCardiac: _chronicCardiac)); context.pop(); }, outlined: true)),
            const SizedBox(width: 12),
            Expanded(child: AppButton(text: 'auth.createAccount'.tr(), onPressed: _handleSubmit, isLoading: authState.isLoading)),
          ]),
        ],
      ),
    );
  }
}
