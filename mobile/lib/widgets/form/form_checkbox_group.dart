import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Checkbox group — mirrors React FormCheckboxGroup.
class FormCheckboxGroup extends StatelessWidget {
  final String label;
  final List<CheckboxOption> options;
  final List<String> selectedValues;
  final ValueChanged<String> onToggle;
  final String? error;

  const FormCheckboxGroup({
    super.key,
    required this.label,
    required this.options,
    required this.selectedValues,
    required this.onToggle,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.gray700)),
        const SizedBox(height: 12),
        ...options.map((option) {
          final isSelected = selectedValues.contains(option.value);
          return GestureDetector(
            onTap: () => onToggle(option.value),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppTheme.cyan600 : AppTheme.gray300,
                  width: 2,
                ),
                color: isSelected ? AppTheme.cyan50 : Colors.transparent,
              ),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.cyan600
                            : AppTheme.gray300,
                        width: 2,
                      ),
                      color: isSelected ? AppTheme.cyan600 : Colors.transparent,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Text(option.label,
                      style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          color: AppTheme.gray700)),
                ],
              ),
            ),
          );
        }),
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(error!,
              style: const TextStyle(color: AppTheme.red500, fontSize: 12)),
        ],
      ],
    );
  }
}

class CheckboxOption {
  final String value;
  final String label;

  const CheckboxOption({required this.value, required this.label});
}
