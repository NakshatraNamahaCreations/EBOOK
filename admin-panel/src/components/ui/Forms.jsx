import React from 'react';
import { Search } from 'lucide-react';

export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>{label}</label>}
    <input ref={ref} className={`input-field ${className}`} {...props} />
    {error && <p style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</p>}
  </div>
));

export const Select = React.forwardRef(({ label, options = [], error, className = '', containerClassName = '', ...props }, ref) => (
  <div className={containerClassName || (className.includes('w-') ? '' : 'w-full')}>
    {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>{label}</label>}
    <select ref={ref} className={`input-field ${className}`} style={{ appearance: 'auto' }} {...props}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {error && <p style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</p>}
  </div>
));

export const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="input-field" style={{ paddingLeft: '34px' }} />
  </div>
);

export const Textarea = React.forwardRef(({ label, error, className = '', rows = 4, ...props }, ref) => (
  <div className="w-full">
    {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>{label}</label>}
    <textarea ref={ref} rows={rows} className={`input-field ${className}`} style={{ resize: 'vertical' }} {...props} />
    {error && <p style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</p>}
  </div>
));
