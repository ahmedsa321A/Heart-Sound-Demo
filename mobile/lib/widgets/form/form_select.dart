import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Dropdown select — mirrors React FormSelect.
class FormSelect extends StatelessWidget {
  final String label;
  final String? value;
  final List<SelectOption> options;
  final ValueChanged<String?> onChanged;
  final String? error;

  const FormSelect({
    super.key,
    required this.label,
    this.value,
    required this.options,
    required this.onChanged,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.gray700)),
            const Text(' *',
                style: TextStyle(color: AppTheme.red500, fontSize: 14)),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.inputBackground,
            borderRadius: BorderRadius.circular(12),
            border: error != null
                ? Border.all(color: AppTheme.red500)
                : null,
          ),
          child: DropdownButtonFormField<String>(
            initialValue: value?.isEmpty == true ? null : value,
            items: options
                .map((o) => DropdownMenuItem(
                      value: o.value,
                      child: Text(o.label),
                    ))
                .toList(),
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: 'Select $label',
              hintStyle: TextStyle(color: AppTheme.gray400.withOpacity(0.7)),
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            dropdownColor: AppTheme.inputBackground,
            icon: const Icon(Icons.keyboard_arrow_down, color: AppTheme.gray400),
          ),
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

class SelectOption {
  final String value;
  final String label;

  const SelectOption({required this.value, required this.label});
}
