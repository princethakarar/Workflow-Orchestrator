import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Key, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { verifyForgotOTP, resetPassword } from '../services/authService';
import AuthShell from '../components/auth/AuthShell';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import AuthAlert from '../components/auth/AuthAlert';

const ResetPassword = () => {
  const [step, setStep] = useState(1); // 1: OTP, 2: New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const email = location.state?.email;

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await verifyForgotOTP(email, otp);
      if (response.data?.resetToken) {
        setResetToken(response.data.resetToken);
        setStep(2);
        setMessage('OTP Verified. Please set your new password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await resetPassword(resetToken, newPassword);
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = step === 1 ? 'Verify OTP' : 'Set New Password';
  const subtitle =
    step === 1 ? `Enter the code sent to ${email}` : 'Create a strong password for your account';

  const invalidOtp = step === 1 && !!error;
  const invalidPasswords = step === 2 && !!error;

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
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
      {message && <AuthAlert type="success">{message}</AuthAlert>}

      {step === 1 ? (
        <form onSubmit={handleVerifyOTP} className="space-y-5">
          <div className="space-y-4">
            <AuthInput
              icon={Key}
              id="otp"
              name="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={handleOtpChange}
              required
              invalid={invalidOtp}
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          <AuthButton loading={isSubmitting} loadingLabel="Verifying..." label="Verify Code" />
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-4">
            <AuthInput
              icon={Lock}
              id="password"
              name="password"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={handlePasswordChange(setNewPassword)}
              required
              invalid={invalidPasswords}
            />

            <AuthInput
              icon={Lock}
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={handlePasswordChange(setConfirmPassword)}
              required
              invalid={invalidPasswords}
            />
          </div>

          <AuthButton loading={isSubmitting} loadingLabel="Resetting..." label="Reset Password" />
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
