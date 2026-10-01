import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorState - Controlled enterprise error block with retry
 */
export default function ErrorState({ 
  title = 'System Request Failed', 
  message = 'An error occurred while connecting to the backend service.', 
  onRetry 
}) {
  return (
    <div className="gov-card" style={{ 
      borderColor: 'var(--color-danger-border)', 
      backgroundColor: 'var(--color-danger-bg)',
      padding: '20px 24px',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertCircle size={20} color="var(--color-danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-danger)', margin: '0 0 4px' }}>
            {title}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {message}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry} 
              className="btn-secondary" 
              style={{ marginTop: '12px', fontSize: '12px', padding: '5px 10px' }}
            >
              <RefreshCw size={13} /> Retry Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
