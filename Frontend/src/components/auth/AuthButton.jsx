import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';

const AuthButton = ({
  label,
  loadingLabel = 'Please wait...',
  loading,
  disabled,
  type = 'submit',
  rightIcon: RightIcon = ArrowRight,
  onClick,
  ...rest
}) => {
  return (
    <Motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="w-full flex justify-center items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' }}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          {!!RightIcon && <RightIcon size={18} />}
        </>
      )}
    </Motion.button>
  );
};

export default AuthButton;

