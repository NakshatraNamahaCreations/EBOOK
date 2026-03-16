import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'var(--bg-primary)' }}>
      {/* Background decorations */}
      <div className="absolute rounded-full pointer-events-none" style={{ top: '-20%', left: '-10%', width: '50%', height: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(120px)' }} />
      <div className="absolute rounded-full pointer-events-none" style={{ bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'rgba(139,92,246,0.08)', filter: 'blur(120px)' }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center" style={{ marginBottom: 28 }}>
          <div className="inline-flex items-center justify-center"
               style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', marginBottom: 16, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>BV</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>BookVault Admin</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.875rem' }}>Sign in to manage the platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
