import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  BarChart3, 
  FileSpreadsheet, 
  Compass, 
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  GitCompare,
  ShieldAlert,
  Network,
  Landmark,
  Play
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, healthData }) {
  const [specializedOpen, setSpecializedOpen] = useState(false);

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'analytics', label: 'Mining Insights', icon: BarChart3 },
    { id: 'reports', label: 'Report Generator', icon: FileSpreadsheet },
    { id: 'decision_brief', label: 'Decision Briefs', icon: Compass },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const secondaryNav = [
    { id: 'comparisons', label: 'Subsidiary Comparisons', icon: GitCompare },
    { id: 'validation', label: 'Data Validation', icon: ShieldAlert },
    { id: 'sources', label: 'Source Provenance', icon: Network },
    { id: 'parliamentary', label: 'Parliamentary Q&A', icon: Landmark },
    { id: 'demo_mode', label: 'Judge Walkthrough', icon: Play },
  ];

  const isSecondaryActive = secondaryNav.some(item => item.id === activeTab);

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div 
        onClick={() => setActiveTab('dashboard')}
        style={{ 
          padding: '16px 18px', 
          borderBottom: '1px solid var(--navy-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        title="CoalIntel • Mining Intelligence Platform"
      >
        <img 
          src="/coalintel-icon.png" 
          alt="CoalIntel" 
          style={{ 
            width: '34px', 
            height: '34px', 
            objectFit: 'contain',
            flexShrink: 0
          }} 
        />
        <div style={{ 
          fontSize: '17px', 
          fontWeight: 800, 
          letterSpacing: '0.5px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ color: '#F8FAFC' }}>COAL</span>
          <span style={{ color: '#F97316' }}>INTEL</span>
        </div>
      </div>

      {/* Main Navigation Section */}
      <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 700, 
          color: '#64748B', 
          textTransform: 'uppercase', 
          letterSpacing: '0.6px', 
          padding: '6px 10px 8px' 
        }}>
          Operations Menu
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--accent-green)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background-color 0.12s ease, color 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--navy-surface)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={16} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Specialized Tools Expandable */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--navy-border)' }}>
          <button
            onClick={() => setSpecializedOpen(!specializedOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              color: isSecondaryActive ? '#F8FAFC' : '#64748B',
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              cursor: 'pointer'
            }}
          >
            <span>Specialized Operations</span>
            {specializedOpen || isSecondaryActive ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {(specializedOpen || isSecondaryActive) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'var(--accent-green)' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background-color 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--navy-surface)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon size={14} color={isActive ? '#FFFFFF' : '#64748B'} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer: System Status */}
      <div style={{ 
        padding: '12px 14px', 
        borderTop: '1px solid var(--navy-border)', 
        backgroundColor: '#070E18',
        fontSize: '11px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#64748B' }}>MongoDB:</span>
          <span style={{ 
            color: healthData?.database_connected ? '#4ADE80' : '#F87171', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: healthData?.database_connected ? '#4ADE80' : '#F87171' 
            }}></span>
            {healthData?.database_connected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94A3B8' }}>
          <span style={{ color: '#64748B' }}>Indexed Chunks:</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {healthData?.indexed_chunks || 1518}
          </span>
        </div>
      </div>
    </aside>
  );
}
