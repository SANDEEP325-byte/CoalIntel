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

import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';

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
      <PageHeader
        title="Data Validation"
        actions={
          <button className="btn-secondary" onClick={loadContradictions} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'pulse-dot' : ''} />
            <span>{loading ? 'Auditing...' : 'Re-Scan Discrepancies'}</span>
          </button>
        }
      />

      {/* Discrepancies Grid / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {data?.discrepancies?.map((disc) => (
          <div
            key={disc.id}
            className="gov-card"
            style={{ borderLeft: '4px solid #74a5bfcd', background: '#fafcfeff' }}
          >
            {/* Discrepancy Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-danger">{disc.id}</span>
                  <span className="badge badge-warning">{disc.type}</span>
                  <span style={{ fontSize: '12px', color: '#2f4053' }}>Year: {disc.year}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#13171a' }}>
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
              <div style={{ background: '#d2dae7', padding: '14px', borderRadius: '6px', border: '1px solid #234c82' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#3e5e92', fontWeight: 700, fontSize: '13px' }}>SOURCE A</span>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>Page {disc.source_a.page}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#1d1e1f', marginBottom: '4px' }}>
                  {disc.source_a.document} — {disc.source_a.location}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#131f2b', marginBottom: '6px' }}>
                  Value: <span style={{ color: '#2c518d' }}>{disc.source_a.value}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#12171e', fontStyle: 'italic', background: '#e8ebf0', padding: '8px', borderRadius: '4px' }}>
                  "{disc.source_a.quote}"
                </div>
              </div>

              {/* Source B */}
              <div style={{ background: '#c1d4f3', padding: '14px', borderRadius: '6px', border: '1px solid #265a9e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#FF6500', fontWeight: 700, fontSize: '13px' }}>SOURCE B</span>
                  <span className="badge badge-orange" style={{ fontSize: '11px' }}>Page {disc.source_b.page}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#1a1c1e', marginBottom: '4px' }}>
                  {disc.source_b.document} — {disc.source_b.location}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#191b1e', marginBottom: '6px' }}>
                  Value: <span style={{ color: '#FF6500' }}>{disc.source_b.value}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#151616', fontStyle: 'italic', background: '#eff2f7', padding: '8px', borderRadius: '4px' }}>
                  "{disc.source_b.quote}"
                </div>
              </div>
            </div>

            {/* Difference & Non-Fabricated Audit Note */}
            <div style={{ background: '#e4e6ec', padding: '12px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#F59E0B', fontSize: '13px' }}>Difference: </strong>
                <span style={{ color: '#111213', fontSize: '13px' }}>{disc.difference}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
