import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState - Subtle enterprise loading indicator
 */
export default function LoadingState({ message = 'Loading operational data...' }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '48px 24px', 
      gap: '10px',
      color: 'var(--text-muted)'
    }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{message}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
