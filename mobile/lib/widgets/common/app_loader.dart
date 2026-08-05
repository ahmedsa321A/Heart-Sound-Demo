import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Loading spinner — mirrors React Loader component.
class AppLoader extends StatelessWidget {
  final double size;
  final bool fullScreen;
  final Color? color;

  const AppLoader({
    super.key,
    this.size = 24,
    this.fullScreen = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final spinner = SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2.5,
        valueColor: AlwaysStoppedAnimation(color ?? AppTheme.cyan600),
      ),
    );

    if (fullScreen) {
      return Scaffold(
        backgroundColor: Colors.white.withValues(alpha: 0.8),
        body: Center(
          child: SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: const AlwaysStoppedAnimation(AppTheme.cyan600),
            ),
          ),
        ),
      );
    }

    return spinner;
  }
}
