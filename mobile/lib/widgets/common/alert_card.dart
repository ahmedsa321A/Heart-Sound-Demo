import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Animated alert card — mirrors React AlertCard component.
class AlertCard extends StatefulWidget {
  final String message;
  final String? title;
  final AlertVariant variant;
  final VoidCallback? onClose;
  final Duration duration;

  const AlertCard({
    super.key,
    required this.message,
    this.title,
    this.variant = AlertVariant.success,
    this.onClose,
    this.duration = const Duration(seconds: 3),
  });

  @override
  State<AlertCard> createState() => _AlertCardState();
}

enum AlertVariant { success, error }

class _AlertCardState extends State<AlertCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _slideAnimation = Tween(
      begin: const Offset(0, -0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _controller.forward();

    if (widget.onClose != null) {
      Future.delayed(widget.duration, () {
        if (mounted) widget.onClose?.call();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSuccess = widget.variant == AlertVariant.success;
    final bgColor = isSuccess ? AppTheme.green50 : AppTheme.red50;
    final iconColor = isSuccess ? AppTheme.green600 : AppTheme.red500;
    final icon = isSuccess ? Icons.check_circle_outline : Icons.error_outline;

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: iconColor.withOpacity(0.3),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (widget.title != null)
                      Text(
                        widget.title!,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AppTheme.gray900,
                        ),
                      ),
                    Text(
                      widget.message,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.gray700,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.onClose != null)
                GestureDetector(
                  onTap: widget.onClose,
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Icon(Icons.close,
                        size: 16, color: AppTheme.gray500),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
