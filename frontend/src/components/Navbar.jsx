import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  BarChart3, 
  FileSpreadsheet, 
  GitCompare, 
  ShieldAlert, 
  Tags, 
  Network, 
  Landmark,
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthData, onRefresh }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'comparisons', label: 'Comparisons', icon: GitCompare },
    { id: 'validation', label: 'Data Validation', icon: ShieldAlert },
    { id: 'topics', label: 'Topics', icon: Tags },
    { id: 'sources', label: 'Sources & Lineage', icon: Network },
    { id: 'parliamentary', label: 'Parliamentary', icon: Landmark },
  ];

  return (
    <header style={{ background: '#070C15', borderBottom: '1px solid #1E3A5F' }}>
      {/* Top Ministry Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 32px', 
        borderBottom: '1px solid #14243B',
        fontSize: '12px',
        color: '#94A3B8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.5px' }}>
            GOVERNMENT OF INDIA • MINISTRY OF COAL • CMPDI / CIL
          </span>
          <span style={{ background: '#182844', padding: '2px 8px', borderRadius: '4px', color: '#FF6500', fontWeight: 600 }}>
            SIH 2026 : SIH26023
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot"></span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>
              {healthData?.database_connected ? 'MongoDB Live' : 'Connecting...'}
            </span>
            <span style={{ color: '#64748B' }}>({healthData?.indexed_chunks || 1504} chunks)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#3B82F6" />
            <span style={{ color: '#94A3B8' }}>LLM:</span>
            <span style={{ color: '#F1F5F9', fontWeight: 600 }}>Ollama (qwen3:1.7b)</span>
          </div>

          <button 
            onClick={onRefresh}
            title="Refresh system status"
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main App Title and Navigation Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 32px',
        background: '#0B1320'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
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
            color: '#FFFFFF'
          }}>
            C
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              CoalIntel <span style={{ color: '#FF6500', fontSize: '12px', fontWeight: 700, verticalAlign: 'super' }}>PRO</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Mining Knowledge & Decision Intelligence Platform
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '4px 0' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'rgba(255, 101, 0, 0.15)' : 'transparent',
                  color: isActive ? '#FF6500' : '#94A3B8',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: isActive ? '2px solid #FF6500' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
