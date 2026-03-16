import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '480px' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />

      {/* Modal Container */}
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: 'calc(100vh - 2rem)',
          margin: '1rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6" style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};