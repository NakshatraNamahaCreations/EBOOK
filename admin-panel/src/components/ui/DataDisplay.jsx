import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Badge = ({ children, variant = 'neutral', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

export const DataTable = ({ columns, data, isLoading, emptyMessage = 'No data found', pagination, onPageChange }) => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>{columns.map((col, i) => (
            <th key={col.key || i} style={{ textAlign: col.align || 'left' }}>
              {col.header}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{columns.map((col, ci) => (
                <td key={ci} style={{ textAlign: col.align || 'left' }}>
                  <div className="skeleton skeleton-text" style={{ width: `${50 + Math.random() * 40}%`, margin: col.align === 'center' ? '0 auto' : col.align === 'right' ? '0 0 0 auto' : '0' }}>&nbsp;</div>
                </td>
              ))}</tr>
            ))
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length}>
              <div className="empty-state"><h3>{emptyMessage}</h3><p>Try adjusting your search or filters</p></div>
            </td></tr>
          ) : (
            data.map((row, ri) => (
              <tr key={row._id || ri}>{columns.map((col, ci) => (
                <td key={col.key || ci} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {pagination && pagination.pages > 1 && (
      <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Page {pagination.page} of {pagination.pages} ({pagination.total} total)
        </span>
        <div className="flex gap-1">
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}
            className="p-1.5 rounded disabled:opacity-30 cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}
            className="p-1.5 rounded disabled:opacity-30 cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    )}
  </div>
);
