import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login as loginService } from '../services/authService';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      const response = await loginService(formData);
      const user = response.data.user;
      
      // Login user in context
      login(user);
      
      // Redirect based on role
      const role = user.role || 'developer';
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'projectManager':
          navigate('/manager/dashboard');
          break;
        case 'developer':
          navigate('/developer/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
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
      title="Welcome Back"
      subtitle="Sign in to continue to your workflow"
      footer={
        <div className="space-y-4">

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
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className={`text-sm font-medium transition-colors ${
              isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
            }`}
          >
            Forgot password?
          </Link>
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
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>
    </AuthShell>
  );
};

export default Login;