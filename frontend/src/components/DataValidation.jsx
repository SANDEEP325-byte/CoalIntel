import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Layers 
} from 'lucide-react';
import { api } from '../api';

export default function DataValidation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContradictions();
  }, []);

  async function loadContradictions() {
    setLoading(true);
    try {
      const res = await api.getContradictions();
      setData(res);
    } catch (e) {
      console.error('Failed to load contradictions:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={22} color="#EF4444" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              Data Contradiction & Inconsistency Detector (Feature 6)
            </h2>
            <span className="badge badge-danger">
              {data?.total_discrepancies_found || 0} Inconsistencies Detected
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            Autonomous cross-report inconsistency auditing. Highlights divergent figures between tables and narratives.
          </p>
        </div>

        <button className="btn-secondary" onClick={loadContradictions} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
          {loading ? 'Auditing...' : 'Re-Scan Discrepancies'}
        </button>
      </div>

      {/* Discrepancies Grid / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {data?.discrepancies?.map((disc) => (
          <div 
            key={disc.id} 
            className="gov-card" 
            style={{ borderLeft: '4px solid #EF4444', background: '#111E33' }}
          >
            {/* Discrepancy Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-danger">{disc.id}</span>
                  <span className="badge badge-warning">{disc.type}</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Year: {disc.year}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F1F5F9' }}>
                  {disc.metric}
                </h3>
              </div>

              <span className="badge badge-orange">
                {disc.verification_status}
              </span>
            </div>

            {/* Side-by-Side Comparison of Source A vs Source B */}
            <div className="grid-2" style={{ marginBottom: '14px' }}>
              {/* Source A */}
              <div style={{ background: '#0B1320', padding: '14px', borderRadius: '6px', border: '1px solid #1E3A5F' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: '13px' }}>SOURCE A</span>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>Page {disc.source_a.page}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  {disc.source_a.document} — {disc.source_a.location}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                  Value: <span style={{ color: '#3B82F6' }}>{disc.source_a.value}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#CBD5E1', fontStyle: 'italic', background: '#070C15', padding: '8px', borderRadius: '4px' }}>
                  "{disc.source_a.quote}"
                </div>
              </div>

              {/* Source B */}
              <div style={{ background: '#0B1320', padding: '14px', borderRadius: '6px', border: '1px solid #1E3A5F' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#FF6500', fontWeight: 700, fontSize: '13px' }}>SOURCE B</span>
                  <span className="badge badge-orange" style={{ fontSize: '11px' }}>Page {disc.source_b.page}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  {disc.source_b.document} — {disc.source_b.location}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                  Value: <span style={{ color: '#FF6500' }}>{disc.source_b.value}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#CBD5E1', fontStyle: 'italic', background: '#070C15', padding: '8px', borderRadius: '4px' }}>
                  "{disc.source_b.quote}"
                </div>
              </div>
            </div>

            {/* Difference & Non-Fabricated Audit Note */}
            <div style={{ background: '#161D2B', padding: '12px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#F59E0B', fontSize: '13px' }}>Difference: </strong>
                <span style={{ color: '#E2E8F0', fontSize: '13px' }}>{disc.difference}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
