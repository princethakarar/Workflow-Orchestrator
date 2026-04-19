import React from 'react';
import { motion as Motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AuthAlert = ({ type = 'error', children }) => {
  const { isDark } = useTheme();

  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle;

  const className = isError
    ? isDark
      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
      : 'bg-red-50 text-red-600 border border-red-100'
    : isDark
      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
      : 'bg-green-50 text-green-600 border border-green-100';

  return (
    <Motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={`mb-6 rounded-xl p-4 text-sm flex items-center gap-2 ${className}`}
    >
      <Icon size={16} />
      {children}
    </Motion.div>
  );
};

export default AuthAlert;

