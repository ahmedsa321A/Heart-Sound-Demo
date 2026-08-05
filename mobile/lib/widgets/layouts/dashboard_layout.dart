import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../config/app_config.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../common/language_switcher.dart';

/// Dashboard layout — mirrors React DashboardLayout + Navbar.
class DashboardLayout extends ConsumerWidget {
  final Widget child;

  const DashboardLayout({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Column(
            children: [
              // App bar
              Container(
                color: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    // Logo
                    GestureDetector(
                      onTap: () => context.go('/'),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.asset(
                              'assets/images/logo.png',
                              width: 40,
                              height: 40,
                              fit: BoxFit.contain,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'common.heartAI'.tr(),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.gray900,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    const LanguageSwitcher(),
                    // Profile button
                    IconButton(
                      onPressed: () => context.push('/profile'),
                      icon: const Icon(Icons.person_outline,
                          color: AppTheme.gray600),
                      tooltip: 'common.userProfile'.tr(),
                    ),
                    // Logout button
                    IconButton(
                      onPressed: () async {
                        if (!AppConfig.isDemoMode) {
                          await ref.read(authProvider.notifier).logout();
                        }
                        if (context.mounted) context.go('/');
                      },
                      icon: const Icon(Icons.logout,
                          color: AppTheme.gray600),
                      tooltip: 'common.logout'.tr(),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: child,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
