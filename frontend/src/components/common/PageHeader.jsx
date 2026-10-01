import React from 'react';

/**
 * PageHeader - Standardized enterprise page header with title and actions
 */
export default function PageHeader({ 
  title, 
  actions 
}) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '18px', 
      flexWrap: 'wrap', 
      gap: '12px' 
    }}>
      <h1 style={{ 
        fontSize: '18px', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        letterSpacing: '-0.2px',
        margin: 0 
      }}>
        {title}
      </h1>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
