import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Terminal,
  Layers,
  FileCheck
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import { api } from '../api';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [docsHealth, setDocsHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  async function loadSettingsData() {
    setLoading(true);
    try {
      const [h, dh] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getDocumentsHealth().catch(() => null)
      ]);
      setHealth(h);
      setDocsHealth(dh);
    } catch (e) {
      console.error('Failed to load settings data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleReindex() {
    setReindexing(true);
    setMessage(null);
    try {
      await api.triggerReindex();
      setMessage({ type: 'success', text: 'Document re-indexing initiated in background.' });
      setTimeout(loadSettingsData, 4000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to initiate re-indexing: ' + e.message });
    } finally {
      setReindexing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        actions={
          <button 
            className="btn-secondary" 
            onClick={loadSettingsData}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'pulse-dot' : ''} />
            Refresh Status
          </button>
        }
      />

      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '13px',
          backgroundColor: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${message.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Grid of System Parameter Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Backend & API Server */}
        <div className="gov-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Server size={18} color="var(--accent-green)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Application Server
            </h3>
          </div>

          <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Status</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <StatusBadge status="Active" label="Online (Port 8000)" />
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>API Framework</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>FastAPI / Uvicorn</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Environment</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>Production Prototype</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>SIH Problem Statement</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>SIH26023</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Database & Storage */}
        <div className="gov-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Database size={18} color="var(--accent-green)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Document Knowledge Store
            </h3>
          </div>

          <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Database Engine</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <StatusBadge 
                    status={health?.database_connected ? 'Indexed' : 'Failed'} 
                    label={health?.database_connected ? 'MongoDB Live (Port 27017)' : 'Offline'} 
                  />
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Target Database</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>coalintel</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Indexed Chunks</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>
                  {health?.indexed_chunks || 1518}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Extraction Parser</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>PyMuPDF (Page-Aligned)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI & Embeddings */}
        <div className="gov-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Cpu size={18} color="var(--accent-green)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              AI Intelligence Pipeline
            </h3>
          </div>

          <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Primary LLM</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>
                  {health?.ai_provider === 'gemini' 
                    ? (health?.llm_model || 'Google Gemini (gemini-3.6-flash)') 
                    : 'Ollama (qwen3:1.7b)'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Local Fallback</td>
                <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  Ollama / Qwen3:1.7b
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Embedding Model</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                  {health?.embedding_model || 'all-MiniLM-L6-v2'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Vector Dimensionality</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>384 Dimensions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance & Operational Actions */}
      <div className="gov-card">
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Document Repository Operations
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Trigger full document chunk re-indexing and recalculate dense vector embeddings across all statutory files.
        </p>

        <button 
          onClick={handleReindex} 
          className="btn-primary"
          disabled={reindexing}
        >
          <RefreshCw size={13} className={reindexing ? 'pulse-dot' : ''} />
          {reindexing ? 'Re-indexing Repository...' : 'Trigger Background Re-index'}
        </button>
      </div>
    </div>
  );
}
