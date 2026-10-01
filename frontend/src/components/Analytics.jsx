import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  FileText, 
  ExternalLink,
  Bot,
  RefreshCw,
  HardHat,
  Truck,
  Compass
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import MetricCard from './common/MetricCard';
import StatusBadge from './common/StatusBadge';
import DataTable from './common/DataTable';
import EmptyState from './common/EmptyState';
import LoadingState from './common/LoadingState';
import { api } from '../api';

export default function Analytics({ onSelectLineage, onAskQuestion }) {
  const [activeCategory, setActiveCategory] = useState('Production');
  const [kpis, setKpis] = useState([]);
  const [prodVsDispatch, setProdVsDispatch] = useState(null);
  const [producers, setProducers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsightData();
  }, [activeCategory, selectedDoc, selectedYear]);

  async function loadInsightData() {
    setLoading(true);
    try {
      const [kpiRes, pvdRes, prodRes, docRes] = await Promise.all([
        api.getKPIs(activeCategory === 'Geological and Mining Activities' ? 'Exploration' : activeCategory, null, selectedYear || null).catch(() => ({ kpis: [] })),
        api.getProductionVsDispatch().catch(() => null),
        api.getProducersComparison().catch(() => ({ producers: [] })),
        api.getDocuments().catch(() => ({ documents: [] }))
      ]);
      setKpis(kpiRes.kpis || []);
      setProdVsDispatch(pvdRes);
      setProducers(prodRes.producers || []);
      setDocuments(docRes.documents || []);
    } catch (e) {
      console.error('Failed to load mining insights data:', e);
    } finally {
      setLoading(false);
    }
  }

  const categoryTabs = [
    { id: 'Production', label: 'Production', icon: Layers },
    { id: 'Dispatch', label: 'Dispatch', icon: Truck },
    { id: 'Mine Safety', label: 'Mine Safety', icon: HardHat },
    { id: 'Geological and Mining Activities', label: 'Geological & Mining Activities', icon: Compass }
  ];

  const kpiColumns = [
    {
      header: 'Indicator / Metric',
      accessor: 'metric_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.metric_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.category} • {row.entity || 'All India'}</div>
        </div>
      )
    },
    {
      header: 'Value',
      accessor: 'value',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          {row.value} {row.unit || ''}
        </span>
      )
    },
    {
      header: 'Period / FY',
      accessor: 'year',
      render: (row) => <span className="badge badge-neutral">{row.year || '2024-25'}</span>
    },
    {
      header: 'Source Document & Citation',
      accessor: 'source_document',
      render: (row) => (
        <div style={{ fontSize: '11.5px' }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{row.source_document || 'Statutory Report'}</div>
          <div style={{ color: 'var(--text-muted)' }}>Page {row.page_number ?? 'N/A'} • Chunk {row.chunk_id || '—'}</div>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => onAskQuestion && onAskQuestion(`What are the details regarding ${row.metric_name} in ${row.source_document || 'the report'}?`)}
          className="btn-subtle"
          style={{ padding: '3px 8px', fontSize: '11px' }}
        >
          <Bot size={12} />
          <span>Ask AI</span>
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Mining Insights"
        actions={
          <button 
            className="btn-secondary" 
            onClick={loadInsightData}
            disabled={loading}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Primary Category Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {categoryTabs.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px' }}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="gov-card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 600 }}>
            <Filter size={14} />
            <span>Filter By:</span>
          </div>

          <div style={{ width: '220px' }}>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="form-select"
              style={{ height: '32px', fontSize: '12.5px' }}
            >
              <option value="">All Source Documents</option>
              {documents.map((d) => (
                <option key={d.id || d.filename} value={d.filename}>{d.filename}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-select"
              style={{ height: '32px', fontSize: '12.5px' }}
            >
              <option value="">All Fiscal Years</option>
              <option value="2024-25">FY 2024-25</option>
              <option value="2023-24">FY 2023-24</option>
              <option value="2022-23">FY 2022-23</option>
            </select>
          </div>

          {(selectedDoc || selectedYear !== '2024-25') && (
            <button
              onClick={() => {
                setSelectedDoc('');
                setSelectedYear('2024-25');
              }}
              className="btn-subtle"
              style={{ fontSize: '12px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Real Mining Insight Display */}
      {loading ? (
        <LoadingState message="Extracting structured metrics from indexed reports..." />
      ) : kpis.length > 0 ? (
        <div>
          {/* Top Metric Cards */}
          <div className="grid-3" style={{ marginBottom: '16px' }}>
            {kpis.slice(0, 3).map((k, idx) => (
              <MetricCard
                key={idx}
                title={k.metric_name}
                value={`${k.value} ${k.unit || ''}`}
                subtitle={`Source: ${k.source_document || 'Statutory Filing'}`}
                icon={TrendingUp}
                badgeText={k.year || '2024-25'}
                badgeType="green"
              />
            ))}
          </div>

          {/* Structured KPI Table */}
          <div className="gov-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {activeCategory} Operational Metrics ({kpis.length})
              </h3>
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                Audited & Page-Cited
              </span>
            </div>

            <DataTable
              columns={kpiColumns}
              data={kpis}
              keyField="metric_name"
            />
          </div>
        </div>
      ) : (
        /* Required Empty State for Unavailable Structured Data */
        <EmptyState
          title="Structured insight data is not available yet."
          message="Use the AI Assistant to retrieve evidence from indexed reports."
          actionLabel="Open AI Assistant"
          onAction={() => onAskQuestion && onAskQuestion(`What are the key statistics regarding ${activeCategory}?`)}
        />
      )}
    </div>
  );
}
