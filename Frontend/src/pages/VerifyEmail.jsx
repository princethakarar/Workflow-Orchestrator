import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmailOTP, resendOTP } from '../services/authService';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authFormClasses } from '../utils/authFormStyles';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark } = useTheme();

  const email = location.state?.email;
  const [expiry, setExpiry] = useState(location.state?.otpExpiry);

  useEffect(() => {
    if (expiry) {
        const calculateTimeLeft = () => {
            const difference = new Date(expiry).getTime() - new Date().getTime();
            return difference > 0 ? Math.floor(difference / 1000) : 0;
        };
        setTimeLeft(calculateTimeLeft());
        
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (left <= 0) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }
  }, [expiry]);

  const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!email) {
     // navigate('/register'); 
     // return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await verifyEmailOTP({ email, otp });
      // Backend now returns user and tokens (auto-login)
      if (response.data?.user) {
          login(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user)); // Should ideally be in context login() or service
      }
      
      setMessage('Email verified successfully! Logging you in...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
        setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
      try {
          const response = await resendOTP(email);
          setMessage('Verification code resent to your email.');
          if(response.data?.otpExpiry) {
             setExpiry(response.data.otpExpiry);
          }
      } catch (err) {
          setError('Failed to resend code.');
      }
  };
  
  // Note: For above to work perfectly, use a state for expiry
  // I should refactor to use a state `expiry` initialized from props.

  return (
    <div className={`flex min-h-screen items-center justify-center overflow-hidden relative transition-colors duration-300 ${
      isDark ? 'bg-[#0a0c18]' : 'bg-gray-50'
    }`}>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/30'}`} />
         <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'}`} />
      </div>

       <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10 p-6"
      >
        <div className={`${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight} p-8`}>
             <div className="text-center mb-8">
                <CheckCircle className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Verify your email</h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  We sent a code to <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{email}</span>
                </p>
                {timeLeft > 0 ? (
                    <p className={`mt-2 text-sm font-medium inline-block px-3 py-1 rounded-full ${isDark ? 'text-indigo-300 bg-indigo-500/20' : 'text-indigo-600 bg-indigo-50'}`}>
                        Expires in: {formatTime(timeLeft)}
                    </p>
                ) : (
                    <p className="mt-2 text-sm text-red-500 font-medium">
                        OTP Expired
                    </p>
                )}
             </div>

             {error && (
                <div className={isDark ? authFormClasses.errorBoxDark : authFormClasses.errorBoxLight}>
                  <AlertCircle size={16} />
                  {error}
                </div>
             )}

             {message && (
                <div className={isDark ? authFormClasses.successBoxDark : authFormClasses.successBoxLight}>
                  <CheckCircle size={16} />
                  {message}
                </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="otp" className="sr-only">OTP Code</label>
                    <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className={`${authFormClasses.input} text-center text-2xl tracking-widest ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                        maxLength={6}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full ${authFormClasses.primaryBtn} flex justify-center items-center gap-2`}
                    style={{ background: authFormClasses.primaryBtnBg }}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Verifying...
                        </>
                    ) : (
                        "Verify Email"
                    )}
                </button>
             </form>
             
             <div className="mt-6 text-center">
                 <button 
                    onClick={handleResend}
                    className={`text-sm font-medium ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
                 >
                     Resend Code
                 </button>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
