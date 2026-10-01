import React from 'react';

/**
 * MetricCard - Compact, professional enterprise KPI tile
 */
export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badgeText, 
  badgeType = 'neutral' 
}) {
  const displayVal = (value !== undefined && value !== null && value !== '') ? value : '—';

  return (
    <div className="gov-card-compact" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ color: 'var(--text-muted)', padding: '2px' }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
          {displayVal}
        </span>
        {badgeText && (
          <span className={`badge badge-${badgeType}`} style={{ fontSize: '11px', padding: '1px 6px' }}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
