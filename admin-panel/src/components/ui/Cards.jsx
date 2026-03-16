import React from 'react';

export const Card = ({ children, className = '', noPadding = false, ...props }) => (
  <div className={`card ${className}`} {...props}>
    {noPadding ? children : <div style={{ padding: '20px' }}>{children}</div>}
  </div>
);

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, iconClass = 'stat-icon-violet' }) => (
  <div className="card" style={{ padding: '20px' }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</p>
        <h3 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{value}</h3>
      </div>
      {Icon && (
        <div className={`flex items-center justify-center ${iconClass}`} style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)' }}>
          <Icon style={{ width: 20, height: 20 }} />
        </div>
      )}
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 mt-2.5" style={{ fontSize: '0.75rem' }}>
        <span style={{ color: trend === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
      </div>
    )}
  </div>
);
