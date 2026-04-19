import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const AuthInput = ({
  icon: Icon,
  type = 'text',
  id,
  name,
  placeholder,
  value,
  onChange,
  required,
  invalid,
  ...rest
}) => {
  const { isDark } = useTheme();

  const inputClasses = isDark
    ? 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-500/50'
    : 'bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500';

  const iconClasses = invalid
    ? isDark
      ? 'text-red-400 group-focus-within:text-red-300'
      : 'text-red-500 group-focus-within:text-red-400'
    : isDark
      ? 'text-slate-500 group-focus-within:text-indigo-400'
      : 'text-gray-400 group-focus-within:text-indigo-500';

  const invalidTailwind = invalid
    ? isDark
      ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
      : 'border-red-300 focus:border-red-500 focus:ring-red-200/30'
    : '';

  return (
    <div className="relative group">
      {!!Icon && (
        <div
          className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${iconClasses}`}
        >
          <Icon size={18} />
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${inputClasses} ${invalidTailwind}`}
        {...rest}
      />
    </div>
  );
};

export default AuthInput;

