import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom dropdown select component
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Array of {value, label} options
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {string} props.width - Width class (e.g., 'w-auto', 'w-20')
 * @param {Object} props.theme - Theme object with colors
 */
const CustomSelect = ({ value, onChange, options, disabled, width = 'w-auto', theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    return (
        <div className={`relative ${width}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full h-8 px-2.5 text-xs rounded-lg border font-medium transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                style={{
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                }}
            >
                <span className="truncate mr-1">{selectedLabel}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-1 left-0 w-full rounded-lg border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ backgroundColor: theme.colors.panelBg, borderColor: theme.colors.border }}>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange({ target: { value: opt.value } }); setIsOpen(false); }}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between ${value === opt.value ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <Check size={10} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
