import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const AuthShell = ({ title, subtitle, children, footer }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className={`flex min-h-screen items-center justify-center overflow-hidden relative transition-colors duration-300 ${
        isDark ? 'bg-[#0a0c18]' : 'bg-gray-50'
      }`}
    >
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-xl border transition-all duration-300 ${
            isDark 
              ? 'bg-white/5 border-white/10 text-indigo-300 hover:bg-white/10' 
              : 'bg-white border-slate-200 text-indigo-600 shadow-sm hover:shadow-md'
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-500 ${
            isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/30'
          }`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-500 ${
            isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'
          }`}
        />
      </div>

      {/* Dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px)'
            : 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          opacity: isDark ? 1 : 0.5,
        }}
      />

      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10 p-6"
      >
        <div
          className={`rounded-2xl p-8 border backdrop-blur-xl transition-all duration-300 ${
            isDark
              ? 'bg-white/4 border-white/8 shadow-2xl shadow-indigo-500/5'
              : 'bg-white/80 border-white/50 shadow-xl shadow-indigo-500/10'
          }`}
        >
          {/* Logo / Brand */}
          <div className="flex justify-center mb-6">
            <img
              src="/workflow-orchestrator-icon.svg"
              alt="Workflow Orchestrator"
              className="h-12 w-12 mx-auto mb-4"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
              {title}
            </h2>
            {!!subtitle && (
              <p className={`mt-2 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>

        {footer && <div className="mt-4 text-center">{footer}</div>}
      </Motion.div>
    </div>
  );
};

export default AuthShell;

