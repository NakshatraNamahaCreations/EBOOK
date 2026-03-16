import React from 'react';
import { Loader2 } from 'lucide-react';

const base = {
  primary: { bg: 'var(--accent)', color: '#fff', border: 'none', shadow: '0 1px 3px rgba(99,102,241,0.3)' },
  secondary: { bg: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', shadow: 'none' },
  danger: { bg: 'var(--danger)', color: '#fff', border: 'none', shadow: '0 1px 3px rgba(220,38,38,0.3)' },
  ghost: { bg: 'transparent', color: 'var(--text-secondary)', border: 'none', shadow: 'none' },
};

const sizes = {
  sm: { padding: '5px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', gap: '5px', iconSize: 14 },
  md: { padding: '8px 16px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', gap: '7px', iconSize: 16 },
  lg: { padding: '10px 22px', fontSize: '0.875rem', borderRadius: 'var(--radius-lg)', gap: '8px', iconSize: 18 },
};

export const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, type = 'button', fullWidth, className = '', isLoading = false, ...props }) => {
  const v = base[variant] || base.primary;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || isLoading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ background: v.bg, color: v.color, border: v.border, boxShadow: v.shadow, padding: s.padding, fontSize: s.fontSize, borderRadius: s.borderRadius, gap: s.gap }}
      onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.opacity = '0.85'; if (variant === 'ghost') e.currentTarget.style.background = 'var(--bg-hover)'; } }}
      onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.opacity = '1'; if (variant === 'ghost') e.currentTarget.style.background = 'transparent'; } }}
      {...props}
    >
      {isLoading
        ? <Loader2 style={{ width: s.iconSize, height: s.iconSize }} className="animate-spin" />
        : Icon && <Icon style={{ width: s.iconSize, height: s.iconSize }} />
      }
      {children}
    </button>
  );
};
