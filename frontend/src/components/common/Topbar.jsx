import React from 'react';
import { 
  Search, 
  RefreshCw, 
  Cpu, 
  User, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function Topbar({ 
  activeTab, 
  healthData, 
  onRefresh, 
  onOpenSearch 
}) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'documents': return 'Documents';
      case 'assistant': return 'AI Assistant';
      case 'analytics': return 'Mining Insights';
      case 'topics': return 'Topic Analysis';
      case 'reports': return 'Report Generator';
      case 'decision_brief': return 'Decision Briefs';
      case 'settings': return 'Settings';
      case 'comparisons': return 'Comparisons';
      case 'validation': return 'Data Validation';
      case 'sources': return 'Source Provenance';
      case 'parliamentary': return 'Parliamentary QA';
      case 'demo_mode': return 'Demo Walkthrough';
      default: return 'CoalIntel';
    }
  };

  return (
    <header className="app-topbar">
      {/* Left: Active Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {getTabTitle(activeTab)}
        </span>
      </div>

      {/* Right: Quick Search + Status + User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="btn-secondary"
          style={{ 
            padding: '5px 10px', 
            fontSize: '12px', 
            gap: '6px',
            color: 'var(--text-secondary)'
          }}
          title="Search across all reports and knowledge chunks"
        >
          <Search size={13} />
          <span>Quick Search...</span>
          <span style={{ 
            fontSize: '10px', 
            padding: '1px 5px', 
            backgroundColor: 'var(--bg-muted)', 
            borderRadius: '3px',
            color: 'var(--text-muted)'
          }}>
            Ctrl+K
          </span>
        </button>

        {/* AI Model Badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          fontSize: '11.5px'
        }}>
          <Cpu size={13} color="var(--accent-green)" />
          <span style={{ color: 'var(--text-muted)' }}>AI Engine:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {healthData?.ai_provider === 'gemini' 
              ? (healthData?.llm_model || 'Google Gemini') 
              : 'Ollama (qwen3:1.7b)'}
          </span>
        </div>

        {/* Refresh System Health */}
        <button
          onClick={onRefresh}
          className="btn-subtle"
          style={{ padding: '4px' }}
          title="Refresh backend status"
        >
          <RefreshCw size={13} />
        </button>

        {/* User / Operator Profile Tag */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          paddingLeft: '10px', 
          borderLeft: '1px solid var(--border-color)' 
        }}>
          <div style={{ 
            width: '26px', 
            height: '26px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-muted)', 
            border: '1px solid var(--border-strong)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            <User size={13} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              CMPDI Officer
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              HQ Operational Desk
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
