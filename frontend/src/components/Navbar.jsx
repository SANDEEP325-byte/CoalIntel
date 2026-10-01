import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  BarChart3, 
  FileSpreadsheet, 
  Compass, 
  Search, 
  Play, 
  GitCompare, 
  ShieldAlert, 
  Tags, 
  Network, 
  Landmark,
  Cpu,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthData, onRefresh }) {
  const [toolsOpen, setToolsOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Mining Copilot', icon: Bot },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analytics', label: 'Mining Insights', icon: BarChart3 },
    { id: 'reports', label: 'Report Generator', icon: FileSpreadsheet },
    { id: 'decision_brief', label: 'Decision Brief', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'demo_mode', label: 'Demo Mode', icon: Play, isDemo: true },
  ];

  const secondaryTools = [
    { id: 'comparisons', label: 'Subsidiary Comparisons', icon: GitCompare },
    { id: 'validation', label: 'Data Contradictions & Validation', icon: ShieldAlert },
    { id: 'topics', label: 'Topic Modeling & Timeline', icon: Tags },
    { id: 'sources', label: 'Source Provenance & Lineage', icon: Network },
    { id: 'parliamentary', label: 'Parliamentary Q&A Generator', icon: Landmark },
  ];

  const isSecondaryActive = secondaryTools.some(t => t.id === activeTab);

  return (
    <header style={{ background: '#070C15', borderBottom: '1px solid #1E3A5F', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Ministry Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 32px', 
        borderBottom: '1px solid #14243B',
        fontSize: '12px',
        color: '#94A3B8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.5px' }}>
            GOVERNMENT OF INDIA • MINISTRY OF COAL • CMPDI / CIL
          </span>
          <span style={{ background: '#182844', padding: '2px 8px', borderRadius: '4px', color: '#FF6500', fontWeight: 600 }}>
            SIH 2026 : SIH26023
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot"></span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>
              {healthData?.database_connected ? 'MongoDB Live' : 'Connecting...'}
            </span>
            <span style={{ color: '#64748B' }}>({healthData?.indexed_chunks || 1518} chunks)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#3B82F6" />
            <span style={{ color: '#94A3B8' }}>AI:</span>
            <span style={{ color: '#F1F5F9', fontWeight: 600 }}>
              {healthData?.ai_provider === 'gemini' 
                ? (healthData?.llm_model || 'Google Gemini') 
                : 'Ollama (qwen3:1.7b)'}
            </span>
          </div>

          <button 
            onClick={onRefresh}
            title="Refresh system status"
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Brand & Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 32px',
        background: '#0B1320'
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, #FF6500 0%, #C84600 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '18px',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(255, 101, 0, 0.3)'
          }}>
            C
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              CoalIntel <span style={{ color: '#FF6500', fontSize: '10px', fontWeight: 800, background: 'rgba(255, 101, 0, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>AI</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Mining Knowledge & Decision Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', padding: '4px 0' }}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setToolsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive 
                    ? (item.isDemo ? 'rgba(255, 101, 0, 0.25)' : 'rgba(255, 101, 0, 0.15)')
                    : (item.isDemo ? '#1A2518' : 'transparent'),
                  color: isActive ? '#FF6500' : (item.isDemo ? '#34D399' : '#94A3B8'),
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: isActive ? '2px solid #FF6500' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} color={isActive ? '#FF6500' : (item.isDemo ? '#10B981' : undefined)} />
                {item.label}
                {item.isDemo && (
                  <span style={{
                    background: '#FF6500',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    marginLeft: '2px'
                  }}>
                    JUDGE
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Specialized Tools Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isSecondaryActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: isSecondaryActive ? '#38BDF8' : '#94A3B8',
                fontWeight: isSecondaryActive ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                borderBottom: isSecondaryActive ? '2px solid #38BDF8' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              More Tools <ChevronDown size={14} style={{ transform: toolsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {toolsOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: '#0B1320',
                border: '1px solid #1E3A5F',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '6px',
                minWidth: '240px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                {secondaryTools.map((st) => {
                  const StIcon = st.icon;
                  const isStActive = activeTab === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setActiveTab(st.id);
                        setToolsOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: isStActive ? '#162844' : 'transparent',
                        color: isStActive ? '#FF6500' : '#E2E8F0',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: isStActive ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <StIcon size={14} color={isStActive ? '#FF6500' : '#94A3B8'} />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
