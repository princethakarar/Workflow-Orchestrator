import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { forgotPassword } from '../services/authService';
import AuthShell from '../components/auth/AuthShell';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import AuthAlert from '../components/auth/AuthAlert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await forgotPassword(email);
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you a reset link to continue."
      footer={
        <Link
          to="/login"
          className={`text-xs font-medium transition-colors ${
            isDark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <ArrowLeft size={14} />
            Back to Login
          </span>
        </Link>
      }
    >
      {error && <AuthAlert type="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <AuthInput
            icon={Mail}
            id="email"
            name="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={handleEmailChange}
            required
            invalid={!!error}
          />
        </div>

        <AuthButton
          loading={isSubmitting}
          loadingLabel="Sending..."
          label="Send Reset Link"
        />
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
