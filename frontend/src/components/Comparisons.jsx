import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  FileText, 
  ArrowRight, 
  TrendingUp, 
  Building2, 
  Compass, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../api';

export default function Comparisons() {
  const [cilCmpdiData, setCilCmpdiData] = useState(null);
  const [diffData, setDiffData] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('matrix'); // 'matrix' | 'diff'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisonData();
  }, []);

  async function loadComparisonData() {
    setLoading(true);
    try {
      const [compRes, diffRes] = await Promise.all([
        api.getCilCmpdiComparison('2024-25'),
        api.getReportDiff()
      ]);
      setCilCmpdiData(compRes);
      setDiffData(diffRes);
    } catch (e) {
      console.error('Failed to load comparisons:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <GitCompare size={22} color="#FF6500" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            Cross-Document Comparison & Report Diff (Feature 2 & 7)
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px' }}>
          Cross-examine operational outputs between holding companies, subsidiaries, and successive reporting cycles.
        </p>
      </div>

      {/* Sub-tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={activeSubTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSubTab('matrix')}
        >
          <Building2 size={16} />
          CIL vs CMPDI Comparison Matrix
        </button>

        <button
          className={activeSubTab === 'diff' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSubTab('diff')}
        >
          <GitCompare size={16} />
          Report Diff (NEW / CHANGED / REMOVED)
        </button>
      </div>

      {/* TAB 1: CIL vs CMPDI Matrix */}
      {activeSubTab === 'matrix' && cilCmpdiData && (
        <div>
          {/* Executive Summary Card */}
          <div className="gov-card" style={{ marginBottom: '20px', borderLeft: '4px solid #3B82F6' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9', marginBottom: '10px' }}>
              Strategic Synergy & Performance Findings (FY 2024-25)
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#CBD5E1', whiteSpace: 'pre-line' }}>
              {cilCmpdiData.analytical_summary}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="gov-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', marginBottom: '16px' }}>
              Side-by-Side Subsidiary Operational Comparison
            </h3>

            <div className="gov-table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Comparison Dimension</th>
                    <th style={{ width: '40%' }}>Coal India Limited (CIL)</th>
                    <th style={{ width: '40%' }}>CMPDI Limited</th>
                  </tr>
                </thead>
                <tbody>
                  {cilCmpdiData.matrix?.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <strong style={{ color: '#F8FAFC' }}>{row.dimension}</strong>
                      </td>
                      <td>
                        <div style={{ color: '#E2E8F0', marginBottom: '6px' }}>{row.cil}</div>
                        <span style={{ fontSize: '11px', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={11} /> {row.source_cil}
                        </span>
                      </td>
                      <td>
                        <div style={{ color: '#E2E8F0', marginBottom: '6px' }}>{row.cmpdi}</div>
                        <span style={{ fontSize: '11px', color: '#FF6500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={11} /> {row.source_cmpdi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Report Diff */}
      {activeSubTab === 'diff' && diffData && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
                Report Diff: {diffData.document_a} ➔ {diffData.document_b}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Detects section additions, metric alterations, and decommissioned indicators
              </span>
            </div>

            {/* Summary Count Pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-success">NEW: {diffData.summary?.NEW || 0}</span>
              <span className="badge badge-warning">CHANGED: {diffData.summary?.CHANGED || 0}</span>
              <span className="badge badge-danger">REMOVED: {diffData.summary?.REMOVED || 0}</span>
              <span className="badge badge-info">UNCHANGED: {diffData.summary?.UNCHANGED || 0}</span>
            </div>
          </div>

          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Section / Focus Area</th>
                  <th>Observed Shift & Description</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {diffData.items?.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${
                        item.category === 'NEW' ? 'badge-success' : 
                        item.category === 'CHANGED' ? 'badge-warning' : 
                        item.category === 'REMOVED' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td><strong style={{ color: '#F1F5F9' }}>{item.section}</strong></td>
                    <td style={{ color: '#CBD5E1', fontSize: '13px' }}>{item.description}</td>
                    <td style={{ color: '#94A3B8', fontSize: '12px' }}>{item.old_value}</td>
                    <td style={{ color: '#FF6500', fontWeight: 600, fontSize: '12px' }}>{item.new_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
