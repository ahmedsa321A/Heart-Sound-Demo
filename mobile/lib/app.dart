import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'config/theme.dart';
import 'config/routes.dart';

class HeartAIApp extends ConsumerWidget {
  const HeartAIApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'HeartAI',
      debugShowCheckedModeBanner: false,

      // Internationalization
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,

      // Theme
      theme: AppTheme.lightTheme,

      // Router
      routerConfig: router,
    );
  }
}
