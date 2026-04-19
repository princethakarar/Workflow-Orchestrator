import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';
import { authFormClasses } from '../utils/authFormStyles';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const SetPassword = () => {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [tokenStatus, setTokenStatus] = useState('validating'); // validating, valid, invalid
  const [userEmail, setUserEmail] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenStatus('invalid');
        setError('No token provided');
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/api/v1/auth/verify-token`, { token });
        
        if (response.data.success) {
          setTokenStatus('valid');
          setUserEmail(response.data.data.email);
        } else {
          setTokenStatus('invalid');
          setError('Invalid or expired token');
        }
      } catch (err) {
        setTokenStatus('invalid');
        setError(err.response?.data?.message || 'Invalid or expired token');
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/set-password`, {
        token,
        password: formData.password
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Password set successfully! Please log in with your new password.');

        // Clear any stale session (e.g., admin who was logged in to send the invite)
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Use full page redirect (not SPA navigate) so AuthContext re-initializes
        // from the now-cleared localStorage — otherwise the stale admin session
        // in React state would intercept the /login route and redirect to admin dashboard.
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (tokenStatus === 'validating') {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-[#0a0c18]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenStatus === 'invalid') {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-[#0a0c18]' : 'bg-gray-50'}`}>
        <div className="w-full max-w-md p-6">
          <div className={`${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight} p-8 text-center`}>
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-red-500/15' : 'bg-red-100'}`}>
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Invalid or Expired Link</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mb-6`}>{error}</p>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'} mb-4`}>
              Please contact your administrator to request a new invitation link.
            </p>
            <button
              onClick={() => navigate('/login')}
              className={authFormClasses.primaryBtn}
              style={{ background: authFormClasses.primaryBtnBg }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Set password form
  return (
    <div className={`flex min-h-screen items-center justify-center overflow-hidden relative transition-colors duration-300 ${
      isDark ? 'bg-[#0a0c18]' : 'bg-gray-50'
    }`}>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/30'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 p-6"
      >
        <div className={`${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight} p-8`}>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
              Set Your Password
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Welcome to WorkFlow Orchestrator!
            </p>
            {userEmail && (
              <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{userEmail}</p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={isDark ? authFormClasses.errorBoxDark : authFormClasses.errorBoxLight}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`${authFormClasses.inputWithIcon} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight} pr-10`}
                  placeholder="New Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className={`${authFormClasses.inputWithIcon} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight} pr-10`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center items-center gap-2 ${authFormClasses.primaryBtn}`}
              style={{ background: authFormClasses.primaryBtnBg }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Setting password...</span>
                </>
              ) : (
                'Set Password'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SetPassword;
