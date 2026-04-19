import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { register as registerService } from '../services/authService';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Call the service to hit the backend
      const payload = {
        username: formData.username.toLowerCase(),
        email: formData.email,
        password: formData.password
      };
      const response = await registerService(payload);

      // 2. Redirect to verify-email (Do not login yet)
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          otpExpiry: response.data?.otpExpiry 
        } 
      });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable input classes
  const inputClasses = isDark
    ? 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-500/50'
    : 'bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500';

  const iconClasses = isDark
    ? 'text-slate-500 group-focus-within:text-indigo-400'
    : 'text-gray-400 group-focus-within:text-indigo-500';

  return (
    <div className={`flex min-h-screen items-center justify-center overflow-hidden relative transition-colors duration-300 ${
      isDark ? 'bg-[#0a0c18]' : 'bg-gray-50'
    }`}>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${
          isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/30'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${
          isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'
        }`} />
      </div>

      {/* Dot-grid overlay (dark mode only) */}
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          }}
        />
      )}

      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10 p-6"
      >
        <div className={`rounded-2xl p-8 border backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08] shadow-2xl shadow-indigo-500/5'
            : 'bg-white/80 border-white/50 shadow-xl shadow-indigo-500/10'
        }`}>
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
              Create Account
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Join us and start orchestrating your workflows
            </p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-6 rounded-xl p-4 text-sm flex items-center gap-2 ${
                isDark
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Username */}
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${iconClasses}`}>
                  <User size={18} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${inputClasses}`}
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${iconClasses}`}>
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${inputClasses}`}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${iconClasses}`}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${inputClasses}`}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${iconClasses}`}>
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${inputClasses}`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
          
          <div className={`mt-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Already have an account?{' '}
            <Link
              to="/login"
              className={`font-semibold transition-colors relative after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-0.5 after:transition-all hover:after:w-full ${
                isDark
                  ? 'text-indigo-400 hover:text-indigo-300 after:bg-indigo-400'
                  : 'text-indigo-600 hover:text-indigo-500 after:bg-indigo-600'
              }`}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-4 text-center">
          <Link
            to="/"
            className={`text-xs font-medium transition-colors ${
              isDark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
