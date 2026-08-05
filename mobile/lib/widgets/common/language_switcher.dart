import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../config/theme.dart';

/// Language toggle button — mirrors React LanguageSwitcher.
class LanguageSwitcher extends StatelessWidget {
  const LanguageSwitcher({super.key});

  @override
  Widget build(BuildContext context) {
    final isArabic = context.locale.languageCode == 'ar';

    return TextButton.icon(
      onPressed: () {
        final newLocale = isArabic ? const Locale('en') : const Locale('ar');
        context.setLocale(newLocale);
      },
      icon: const Icon(Icons.language, size: 18),
      label: Text(
        isArabic ? 'English' : 'العربية',
        style: const TextStyle(fontSize: 14),
      ),
      style: TextButton.styleFrom(
        foregroundColor: AppTheme.gray600,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
}
