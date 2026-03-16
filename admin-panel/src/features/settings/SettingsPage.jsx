import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Forms';
import { Settings, Lock, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, value, onChange, show, onToggle, placeholder }) => (
    <div className="w-full">
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field w-full"
          style={{ paddingRight: '40px' }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <Settings className="w-5 h-5" style={{ color: 'var(--accent-400)' }} />
            Settings
          </h1>
          <p>Manage your account security</p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="max-w-lg">
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
        >
          {/* Card Header */}
          <div
            className="flex items-center gap-4 px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)' }}
            >
              <KeyRound className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Change Password
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Update your admin account password
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="px-6 py-5 space-y-4" onSubmit={handleSubmit}>
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder="Enter your current password"
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              placeholder="Min. 8 characters"
            />

            {/* Strength Meter */}
            {newPassword && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: i <= strength ? strengthColor[strength] : 'var(--border-default)',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strengthColor[strength] }}>
                  {strengthLabel[strength]} password
                </p>
                <ul className="space-y-0.5">
                  {[
                    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
                    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(newPassword) },
                    { label: 'Contains a number', ok: /[0-9]/.test(newPassword) },
                    { label: 'Contains special character', ok: /[^A-Za-z0-9]/.test(newPassword) },
                  ].map(({ label, ok }) => (
                    <li key={label} className="flex items-center gap-1.5 text-xs" style={{ color: ok ? '#10b981' : 'var(--text-muted)' }}>
                      <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              placeholder="Re-enter your new password"
            />

            {/* Match indicator */}
            {confirmPassword && (
              <p
                className="text-xs font-medium"
                style={{ color: confirmPassword === newPassword ? '#10b981' : '#ef4444' }}
              >
                {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                icon={Lock}
                isLoading={loading}
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
