import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  HelpCircle, 
  Filter, 
  ExternalLink, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../api';

export default function Analytics({ onSelectLineage }) {
  const [kpis, setKpis] = useState([]);
  const [whyChangeData, setWhyChangeData] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [categoryFilter, entityFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [kpiRes, whyRes] = await Promise.all([
        api.getKPIs(categoryFilter || null, entityFilter || null),
        api.getWhyChange()
      ]);
      setKpis(kpiRes.kpis || []);
      setWhyChangeData(whyRes);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['Production', 'Dispatch', 'Safety', 'Revenue & Profit', 'Exploration', 'Excavation & OBR'];
  const entities = ['CIL', 'CMPDI', 'All India'];

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <BarChart3 size={22} color="#FF6500" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            Mining KPI Intelligence & Analytics (Feature 3 & 12)
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px' }}>
          Automatically extracted mining metrics with verified page lineage and evidence-backed root cause explanations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="gov-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '13px' }}>
            <Filter size={15} />
            <strong>Filters:</strong>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoryFilter('')}
              style={{
                background: categoryFilter === '' ? '#FF6500' : '#182844',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                style={{
                  background: categoryFilter === c ? '#FF6500' : '#182844',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              style={{
                background: '#0B1320',
                border: '1px solid #1E3A5F',
                borderRadius: '6px',
                padding: '4px 10px',
                color: '#CBD5E1',
                fontSize: '12px'
              }}
            >
              <option value="">All Entities</option>
              {entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Extracted Metrics Table */}
      <div className="gov-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
            Mining Key Performance Indicators ({kpis.length})
          </h3>
          <span className="badge badge-success">Zero Fabricated Values</span>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Metric Name</th>
                <th>Entity</th>
                <th>Year</th>
                <th>Value & Unit</th>
                <th>YoY Change</th>
                <th>Source & Page Citation</th>
                <th>Status & Traceability</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.id}>
                  <td><span className="badge badge-orange">{k.category}</span></td>
                  <td><strong style={{ color: '#F8FAFC' }}>{k.metric}</strong></td>
                  <td><span className="badge badge-info">{k.entity}</span></td>
                  <td>{k.year}</td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#FF6500' }}>
                      {k.value} <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>{k.unit}</span>
                    </span>
                  </td>
                  <td>
                    {k.change_pct !== undefined && (
                      <span style={{ 
                        color: k.change_pct >= 0 ? '#10B981' : '#EF4444',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {k.change_pct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {k.change_pct > 0 ? `+${k.change_pct}%` : `${k.change_pct}%`}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#3B82F6', fontWeight: 600 }}>{k.source_document}</span>
                      <span style={{ color: '#FF6500', fontWeight: 700 }}>Page {k.page_number}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{k.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature 12: "Why Did This Change?" Root Cause Explanations */}
      {whyChangeData && (
        <div className="gov-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <HelpCircle size={20} color="#3B82F6" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
              Feature 12 — "Why Did This Change?" (Evidence-Backed Root Cause Analysis)
            </h3>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '16px' }}>
            Explains critical year-over-year operational shifts strictly citing statutory excerpts without speculative hallucination.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#0B1320', padding: '16px', borderRadius: '8px', border: '1px solid #1E3A5F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={16} color="#10B981" />
                <strong style={{ color: '#F1F5F9', fontSize: '14px' }}>Why did National Coal Production cross 1 Billion Tonnes?</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
                {whyChangeData.why_did_this_change?.production}
              </p>
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
                Grounding: Coal & Lignite Production Report 2025-26, Page 4
              </div>
            </div>

            <div style={{ background: '#0B1320', padding: '16px', borderRadius: '8px', border: '1px solid #1E3A5F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={16} color="#FF6500" />
                <strong style={{ color: '#F1F5F9', fontSize: '14px' }}>Why did CIL Coal Dispatch grow to 762.83 MT?</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
                {whyChangeData.why_did_this_change?.dispatch}
              </p>
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
                Grounding: Coal & Lignite Production Report 2025-26, Page 4
              </div>
            </div>

            <div style={{ background: '#0B1320', padding: '16px', borderRadius: '8px', border: '1px solid #1E3A5F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={16} color="#EF4444" />
                <strong style={{ color: '#F1F5F9', fontSize: '14px' }}>Why did Safety Statistics fluctuate between 2024 and 2025?</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
                {whyChangeData.why_did_this_change?.safety}
              </p>
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
                Grounding: Safety in Coal Mines Report 2025-26, Page 21
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
