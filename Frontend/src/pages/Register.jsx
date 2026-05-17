import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { register as registerService } from '../services/authService';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      const payload = {
        username: formData.username.toLowerCase(),
        email: formData.email,
        password: formData.password
      };
      const response = await registerService(payload);

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

  const inputClasses = isDark
    ? 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-500/50'
    : 'bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500';

  const iconClasses = isDark
    ? 'text-slate-500 group-focus-within:text-indigo-400'
    : 'text-gray-400 group-focus-within:text-indigo-500';

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join us and start orchestrating your workflows"
      footer={
        <div className="space-y-4">
          <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
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
          <Link
            to="/"
            className={`block text-xs font-medium transition-colors ${
              isDark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ← Back to home
          </Link>
        </div>
      }
    >
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
    </AuthShell>
  );
};

export default Register;
