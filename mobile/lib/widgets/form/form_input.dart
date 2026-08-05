import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Form text input — mirrors React FormInput component.
class FormInput extends StatelessWidget {
  final String? label;
  final String? placeholder;
  final String? error;
  final TextEditingController? controller;
  final bool obscureText;
  final bool showPasswordToggle;
  final bool showPassword;
  final VoidCallback? onTogglePassword;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final int? maxLength;

  const FormInput({
    super.key,
    this.label,
    this.placeholder,
    this.error,
    this.controller,
    this.obscureText = false,
    this.showPasswordToggle = false,
    this.showPassword = false,
    this.onTogglePassword,
    this.keyboardType = TextInputType.text,
    this.onChanged,
    this.enabled = true,
    this.maxLength,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Row(
            children: [
              Text(
                label!,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.gray700,
                ),
              ),
              const Text(' *',
                  style: TextStyle(color: AppTheme.red500, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 8),
        ],
        TextField(
          controller: controller,
          obscureText: obscureText && !showPassword,
          keyboardType: keyboardType,
          onChanged: onChanged,
          enabled: enabled,
          maxLength: maxLength,
          style: TextStyle(
            color: enabled ? AppTheme.gray900 : AppTheme.gray500,
          ),
          decoration: InputDecoration(
            hintText: placeholder,
            counterText: '',
            suffixIcon: showPasswordToggle
                ? IconButton(
                    icon: Icon(
                      showPassword ? Icons.visibility_off : Icons.visibility,
                      color: AppTheme.gray400,
                      size: 20,
                    ),
                    onPressed: onTogglePassword,
                  )
                : null,
            filled: true,
            fillColor: enabled ? AppTheme.inputBackground : AppTheme.gray100,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: error != null
                  ? const BorderSide(color: AppTheme.red500)
                  : BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: error != null ? AppTheme.red500 : AppTheme.cyan600,
                width: 1.5,
              ),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
        if (error != null && error!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            error!,
            style: const TextStyle(color: AppTheme.red500, fontSize: 12),
          ),
        ],
      ],
    );
  }
}
