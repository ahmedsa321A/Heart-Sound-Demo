import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../config/theme.dart';
import '../common/language_switcher.dart';

/// Auth layout — mirrors React AuthLayout component.
/// On mobile, shows only the form card (no split panel).
class AuthLayout extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;

  const AuthLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Column(
            children: [
              // Top bar with back button and language switcher
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () {
                        if (Navigator.of(context).canPop()) {
                          Navigator.of(context).pop();
                        }
                      },
                      icon: Icon(
                        context.locale.languageCode == 'ar'
                            ? Icons.arrow_forward
                            : Icons.arrow_back,
                        color: AppTheme.gray700,
                      ),
                    ),
                    const Spacer(),
                    const LanguageSwitcher(),
                  ],
                ),
              ),
              // Scrollable form content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: child,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
