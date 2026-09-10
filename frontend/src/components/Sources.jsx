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
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Network size={22} color="#FF6500" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            Data Lineage & Verified Provenance Explorer (Feature 14)
          </h2>
          <span className="badge badge-success">100% Page Traceability</span>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px' }}>
          Unbroken provenance path for every dashboard indicator: 
          <strong> Metric ➔ Extracted Value ➔ Source PDF ➔ Exact Page ➔ Table Cell / Verbatim Quote</strong>.
        </p>
      </div>

      {/* Search Bar */}
      <div className="gov-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search metric name, entity (CIL, CMPDI), or document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#0B1320',
              border: '1px solid #1E3A5F',
              borderRadius: '6px',
              padding: '10px 14px 10px 40px',
              color: '#F1F5F9',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Lineage Table */}
      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
            Provenance Traceability Graph ({filteredRecords.length} Metrics)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
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
                    <strong style={{ color: '#F8FAFC' }}>{rec.metric_name}</strong>
                    <div style={{ fontSize: '11px', color: '#3B82F6' }}>Entity: {rec.entity} ({rec.year})</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#FF6500' }}>
                      {rec.value}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#94A3B8" />
                      <span style={{ fontSize: '12px', color: '#E2E8F0' }}>{rec.source_document}</span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#10B981', fontSize: '14px' }}>Page {rec.page_number}</strong>
                  </td>
                  <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                    <code>{rec.table_reference}</code>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#CBD5E1', 
                      fontStyle: 'italic',
                      background: '#0B1320',
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
