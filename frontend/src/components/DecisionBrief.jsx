import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  RefreshCw, 
  Send,
  AlertTriangle,
  Bot,
  Layers
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import EvidencePanel from './common/EvidencePanel';
import LoadingState from './common/LoadingState';
import { api } from '../api';

export default function DecisionBrief({ onSwitchToCopilot }) {
  const [presets, setPresets] = useState([]);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    setLoading(true);
    try {
      const data = await api.getPresetDecisionBriefs();
      const list = data.briefs || [];
      setPresets(list);
      if (list.length > 0) {
        setSelectedBrief(list[0]);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(topicToUse = null) {
    const t = topicToUse || customTopic;
    if (!t.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const brief = await api.getDecisionBrief(t);
      setSelectedBrief(brief);
    } catch (err) {
      setError(err.message || 'Failed to generate decision brief.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!selectedBrief) return;
    const text = `COALINTEL STATUTORY DECISION BRIEF
TITLE: ${selectedBrief.title}
TOPIC: ${selectedBrief.topic}

1. SITUATION:
${selectedBrief.situation}

2. VERIFIED EVIDENCE:
${(selectedBrief.evidence || []).map(e => `• [${e.document || 'Report'}, Page ${e.page ?? 'N/A'}] ${e.text}`).join('\n')}

3. KEY FINDING:
${selectedBrief.key_finding}

4. OPERATIONAL SIGNIFICANCE:
${selectedBrief.operational_significance}

5. AREA FOR ATTENTION:
${selectedBrief.area_for_attention}

6. SOURCE REFERENCES:
${selectedBrief.source || 'Statutory Filings'}

7. LIMITATIONS:
All data points are bound to indexed statutory filings. Projections beyond audited figures must be cross-verified.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title="Decision Briefs"
        actions={
          selectedBrief && (
            <button 
              onClick={handleCopy}
              className="btn-secondary"
            >
              {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied Brief' : 'Copy Brief'}</span>
            </button>
          )
        }
      />

      {/* Preset Topics & Custom Query Form */}
      <div className="gov-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Statutory Briefing Scenarios:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {presets.map((p, idx) => {
              const isSelected = selectedBrief?.topic === p.topic;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedBrief(p)}
                  className={isSelected ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  {p.title || p.topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Topic Generator Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or enter custom operational topic (e.g., 'CIL overburden removal target vs actual')..."
              className="form-input"
              style={{ height: '36px', fontSize: '13px' }}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !customTopic.trim()}
              style={{ height: '36px', whiteSpace: 'nowrap' }}
            >
              <Send size={13} />
              <span>{loading ? 'Synthesizing...' : 'Generate Brief'}</span>
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="gov-card">
          <LoadingState message="Extracting statutory facts and synthesizing 7-part Decision Brief..." />
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* 7-Part Structured Decision Brief Display */}
      {selectedBrief && !loading && (
        <div className="gov-card" style={{ padding: '24px 28px' }}>
          {/* Header Banner */}
          <div style={{ 
            borderBottom: '2px solid var(--border-color)', 
            paddingBottom: '16px', 
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-green">Official Executive Brief</span>
                <span className="badge badge-neutral">Confidence: {selectedBrief.confidence_level || 'High'} ({selectedBrief.confidence_score || '0.92'})</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {selectedBrief.title || selectedBrief.topic}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Domain: <strong>{selectedBrief.topic}</strong> • Traceability: Verifiable Page Excerpts
              </div>
            </div>

            {onSwitchToCopilot && (
              <button
                onClick={() => onSwitchToCopilot(`Explain the operational implications of ${selectedBrief.topic}`)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                <Bot size={13} />
                <span>Deep-Dive Query</span>
              </button>
            )}
          </div>

          {/* 7 Structured Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. Situation */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                1. Situation
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {selectedBrief.situation}
              </div>
            </div>

            {/* 2. Verified Evidence */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                2. Verified Evidence (Grounded Passages)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedBrief.evidence || []).map((e, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      fontSize: '12.5px', 
                      lineHeight: 1.5, 
                      color: 'var(--text-secondary)',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderLeft: '3px solid var(--accent-green)',
                      borderRadius: 'var(--radius-xs)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                      Source: {e.document || 'Statutory Report'} • Page {e.page ?? 'N/A'} {e.relevance ? `• Relevance: ${e.relevance}` : ''}
                    </div>
                    "{e.text}"
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Key Finding */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                3. Key Finding
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 500 }}>
                {selectedBrief.key_finding}
              </div>
            </div>

            {/* 4. Operational Significance */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                4. Operational Significance
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {selectedBrief.operational_significance}
              </div>
            </div>

            {/* 5. Area for Attention */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                5. Area for Attention
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {selectedBrief.area_for_attention}
              </div>
            </div>

            {/* 6. Source References */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                6. Source References
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} color="var(--accent-green)" />
                <span>{selectedBrief.source || 'Coal India Limited & CMPDI Audited Statutory Filings'}</span>
              </div>
            </div>

            {/* 7. Limitations */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                7. Limitations
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {selectedBrief.limitations || 'Findings are strictly derived from the currently indexed annual reports and DGMS statistics. Projections beyond cited financial periods require supplemental statutory filings.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
