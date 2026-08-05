import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Gradient primary button — mirrors the React Button with cyan-teal gradient.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool fullWidth;
  final Widget? icon;
  final bool outlined;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.fullWidth = true,
    this.icon,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    if (outlined) {
      return SizedBox(
        width: fullWidth ? double.infinity : null,
        height: 56,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppTheme.gray300),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _buildContent(context, outlined: true),
        ),
      );
    }

    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: onPressed != null && !isLoading
              ? AppTheme.primaryGradient
              : null,
          color: onPressed == null || isLoading ? AppTheme.gray300 : null,
          borderRadius: BorderRadius.circular(12),
          boxShadow: onPressed != null && !isLoading
              ? [
                  BoxShadow(
                    color: AppTheme.cyan500.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            foregroundColor: Colors.white,
            disabledBackgroundColor: Colors.transparent,
            disabledForegroundColor: Colors.white70,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _buildContent(context),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, {bool outlined = false}) {
    if (isLoading) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation(
            outlined ? AppTheme.cyan600 : Colors.white,
          ),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
          const SizedBox(width: 8),
          icon!,
        ],
      );
    }

    return Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500));
  }
}
