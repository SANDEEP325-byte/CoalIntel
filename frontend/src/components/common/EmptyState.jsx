import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState - Professional enterprise empty state
 */
export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  message = 'There is currently no data matching your criteria.', 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="gov-card" style={{ 
      textAlign: 'center', 
      padding: '40px 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderStyle: 'dashed'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: 'var(--radius-sm)', 
        backgroundColor: 'var(--bg-muted)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginBottom: '12px'
      }}>
        <Icon size={20} />
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {title}
      </h3>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: actionLabel ? '16px' : '0' }}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button className="btn-secondary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
