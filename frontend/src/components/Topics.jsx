import React, { useState, useEffect } from 'react';
import { 
  Tags, 
  Layers, 
  FileText, 
  Bot, 
  RefreshCw, 
  BarChart2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import DataTable from './common/DataTable';
import EmptyState from './common/EmptyState';
import LoadingState from './common/LoadingState';
import { api } from '../api';

export default function Topics({ onAskQuestion }) {
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    setLoading(true);
    try {
      const data = await api.getTopics();
      setTopicData(data);
    } catch (e) {
      console.error('Failed to load topic analysis:', e);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      header: 'Thematic Domain / Topic',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {row.id}</div>
        </div>
      )
    },
    {
      header: 'Frequency & Chunk Coverage',
      accessor: 'count',
      width: '240px',
      render: (row) => {
        const pct = row.percentage || Math.round((row.count / (topicData?.total_chunks_analyzed || 1518)) * 100);
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.count} chunks</span>
              <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: 'var(--bg-muted)', 
              borderRadius: '3px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                width: `${Math.min(pct, 100)}%`, 
                height: '100%', 
                backgroundColor: 'var(--accent-green)',
                borderRadius: '3px' 
              }}></div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Representative Mining Terms',
      accessor: 'representative_terms',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(row.representative_terms || []).slice(0, 5).map((term, idx) => (
            <span 
              key={idx} 
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-secondary)'
              }}
            >
              {term}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Related Statutory Documents',
      accessor: 'related_documents',
      render: (row) => (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {(row.related_documents || []).length > 0 
            ? row.related_documents.join(', ') 
            : 'Cross-Document Statutory'}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => onAskQuestion && onAskQuestion(`What are the primary operational findings regarding ${row.name} in the indexed mining reports?`)}
          className="btn-subtle"
          style={{ padding: '3px 8px', fontSize: '11.5px' }}
          title="Query topic with AI Assistant"
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
        title="Topic Analysis"
        actions={
          <button 
            className="btn-secondary" 
            onClick={loadTopics}
            disabled={loading}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        }
      />

      {loading ? (
        <LoadingState message="Extracting semantic topics from knowledge chunks..." />
      ) : topicData?.topics?.length > 0 ? (
        <div>
          {/* Summary Overview Banner */}
          <div className="gov-card" style={{ marginBottom: '16px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tags size={16} color="var(--accent-green)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Analysis Coverage: {topicData.total_chunks_analyzed || 1518} Chunks across {topicData.topics.length} Dominant Thematic Categories
              </span>
            </div>
            <span className="badge badge-neutral">Page-Aware TF-IDF & Dense Embeddings</span>
          </div>

          {/* Restrained Table Layout */}
          <div className="gov-card">
            <DataTable
              columns={columns}
              data={topicData.topics}
              keyField="id"
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No topic models computed"
          message="Topic clusters will appear once documents have been indexed and chunked in the MongoDB repository."
        />
      )}
    </div>
  );
}
