import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Cards';
import { Input } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, KeyRound, Lock } from 'lucide-react';
import api from '../../services/api';

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3 };

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password-otp', { email: email.trim() });
      toast.success('OTP sent to your email');
      setStep(STEPS.OTP);
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Please enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-forgot-password-otp', {
        email: email.trim(),
        otp: otpValue,
      });
      setResetToken(res?.resetToken || res?.data?.resetToken);
      toast.success('OTP verified successfully');
      setStep(STEPS.PASSWORD);
    } catch (err) {
      toast.error(err?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password: newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password-otp', { email: email.trim() });
      toast.success('OTP resent to your email');
      setOtp(['', '', '', '', '', '']);
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <Card>
      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              width: s === step ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: s <= step ? 'var(--accent)' : 'var(--border-default)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Step 1: Email */}
      {step === STEPS.EMAIL && (
        <form onSubmit={handleSendOTP} className="space-y-5">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Mail size={22} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Forgot Password
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Enter your admin email to receive a reset OTP
            </p>
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="admin@saliljaveri.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" fullWidth disabled={loading} icon={Mail} style={{ marginTop: 8 }}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              margin: '4px auto 0',
            }}
          >
            <ArrowLeft size={14} />
            Back to login
          </button>
        </form>
      )}

      {/* Step 2: OTP */}
      {step === STEPS.OTP && (
        <form onSubmit={handleVerifyOTP} className="space-y-5">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <KeyRound size={22} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Enter OTP
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>
            </p>
          </div>

          <div
            style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
            onPaste={handleOtpPaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                style={{
                  width: 44,
                  height: 52,
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${digit ? 'var(--accent)' : 'var(--border-default)'}`,
                  background: 'var(--bg-input, var(--bg-secondary))',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            ))}
          </div>

          <Button type="submit" fullWidth disabled={loading} icon={KeyRound}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {resendTimer > 0 ? (
              <span>Resend OTP in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.82rem',
                }}
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep(STEPS.EMAIL)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              margin: '0 auto',
            }}
          >
            <ArrowLeft size={14} />
            Change email
          </button>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === STEPS.PASSWORD && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Lock size={22} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              New Password
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Set a strong new password for your account
            </p>
          </div>

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" fullWidth disabled={loading} icon={Lock} style={{ marginTop: 8 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </Card>
  );
};
