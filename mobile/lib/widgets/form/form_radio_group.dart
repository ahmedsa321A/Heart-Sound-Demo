import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Radio button group — mirrors React FormRadioGroup.
class FormRadioGroup extends StatelessWidget {
  final String label;
  final String? value;
  final List<RadioOption> options;
  final ValueChanged<String?> onChanged;
  final String? error;
  final bool required;

  const FormRadioGroup({
    super.key,
    required this.label,
    this.value,
    required this.options,
    required this.onChanged,
    this.error,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.gray700)),
            ),
            if (required)
              const Text(' *',
                  style: TextStyle(color: AppTheme.red500, fontSize: 14)),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: options.map((option) {
            final isSelected = value == option.value;
            return GestureDetector(
              onTap: () => onChanged(option.value),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? AppTheme.cyan500 : AppTheme.gray300,
                    width: 2,
                  ),
                  color: isSelected ? AppTheme.cyan50 : Colors.transparent,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isSelected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color:
                          isSelected ? AppTheme.cyan600 : AppTheme.gray400,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      option.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: AppTheme.gray700,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(error!,
              style: const TextStyle(color: AppTheme.red500, fontSize: 12)),
        ],
      ],
    );
  }
}

class RadioOption {
  final String value;
  final String label;

  const RadioOption({required this.value, required this.label});
}
