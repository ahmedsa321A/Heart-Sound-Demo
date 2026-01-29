import React from "react";

interface RadioOption {
    label: string;
    value: string;
}

interface FormRadioGroupProps {
    label: string;
    name: string;
    value: string;
    options: RadioOption[];
    error?: string;
    required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
    label,
    name,
    value,
    options,
    error,
    required,
    onChange
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-4">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`
                            flex items-center gap-2 cursor-pointer px-6 py-3 border-2 rounded-xl transition-colors
                            ${value === option.value
                                ? 'border-cyan-500 bg-cyan-50'
                                : 'border-gray-300 hover:border-cyan-500'
                            }
                        `}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={onChange}
                            className="text-cyan-600 accent-cyan-600"
                        />
                        <span className="font-medium text-gray-700 capitalize">{option.label}</span>
                    </label>
                ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};
