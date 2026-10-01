import React, { useState, useEffect } from 'react';
import { 
  Network, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Search,
  ShieldCheck,
  Building
} from 'lucide-react';
import { api } from '../api';

import PageHeader from './common/PageHeader';

export default function Sources() {
  const [lineageData, setLineageData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLineage();
  }, []);

  async function loadLineage() {
    setLoading(true);
    try {
      const res = await api.getLineage();
      setLineageData(res);
    } catch (e) {
      console.error('Failed to load lineage:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = lineageData?.records?.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.metric_name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.entity.toLowerCase().includes(q) ||
      r.source_document.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div>
      <PageHeader
        title="Source Provenance"
      />

      {/* Search Bar */}
      <div className="gov-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#1a1b1d" style={{ position: 'absolute', left: '14px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search metric name, entity (CIL, CMPDI), or document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#cfd5de',
              border: '1px solid #87919d',
              borderRadius: '6px',
              padding: '10px 14px 10px 40px',
              color: '#2c3c4c',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Lineage Table */}
      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1d1f22' }}>
            Provenance Traceability Graph ({filteredRecords.length} Metrics)
          </h3>
          <span style={{ fontSize: '12px', color: '#0f1a29' }}>
            {lineageData?.traceability_guarantee}
          </span>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Metric & Entity</th>
                <th>Reported Value</th>
                <th>Source PDF Document</th>
                <th>Verified Page</th>
                <th>Table / Location Reference</th>
                <th>Verbatim Extracted Quote</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec.metric_id}>
                  <td><span className="badge badge-orange">{rec.category}</span></td>
                  <td>
                    <strong style={{ color: '#1a1a1a' }}>{rec.metric_name}</strong>
                    <div style={{ fontSize: '11px', color: '#3B82F6' }}>Entity: {rec.entity} ({rec.year})</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#FF6500' }}>
                      {rec.value}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#2e3239" />
                      <span style={{ fontSize: '12px', color: '#252a30' }}>{rec.source_document}</span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#10B981', fontSize: '14px' }}>Page {rec.page_number}</strong>
                  </td>
                  <td style={{ fontSize: '12px', color: '#293341' }}>
                    <code>{rec.table_reference}</code>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#141414', 
                      fontStyle: 'italic',
                      background: '#c8cfd9',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      maxHeight: '75px',
                      overflowY: 'auto'
                    }}>
                      "{rec.verbatim_excerpt}"
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <ShieldCheck size={12} /> {rec.verification_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
