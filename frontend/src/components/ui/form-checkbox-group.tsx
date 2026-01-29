import React from "react";
import { Check } from "lucide-react";

interface CheckboxOption {
    label: string;
    value: string;
}

interface FormCheckboxGroupProps {
    label: string;
    options: CheckboxOption[];
    selectedValues: string[];
    onChange: (value: string) => void;
    error?: string;
}

export const FormCheckboxGroup: React.FC<FormCheckboxGroupProps> = ({
    label,
    options,
    selectedValues,
    onChange,
    error
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
                {label}
            </label>
            <div className="space-y-3">
                {options.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                        <label
                            key={option.value}
                            className={`
                                flex items-center gap-3 p-4 border-2 rounded-xl transition-colors cursor-pointer
                                ${isSelected
                                    ? 'border-cyan-600 bg-cyan-50'
                                    : 'border-gray-300 hover:border-cyan-500'
                                }
                            `}
                        >
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onChange(option.value)}
                                    className="sr-only"
                                />
                                <div className={`
                                    w-6 h-6 border-2 rounded-md flex items-center justify-center transition-colors
                                    ${isSelected
                                        ? 'bg-cyan-600 border-cyan-600'
                                        : 'border-gray-300'
                                    }
                                `}>
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-white" />
                                    )}
                                </div>
                            </div>
                            <span className="font-medium text-gray-700">{option.label}</span>
                        </label>
                    );
                })}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};
