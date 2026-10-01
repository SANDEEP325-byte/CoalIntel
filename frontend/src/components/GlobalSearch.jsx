import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Layers, 
  ExternalLink, 
  Filter, 
  Bot, 
  Database,
  ArrowRight
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import LoadingState from './common/LoadingState';
import EmptyState from './common/EmptyState';
import { api } from '../api';

export default function GlobalSearch({ onSelectResult }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [topK, setTopK] = useState(10);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const sampleQueries = [
    "CIL coal dispatch FY 2024-25",
    "All-India raw coal production",
    "2D seismic exploration progress CMPDI",
    "Fatal accidents and fatality rates in coal mines",
    "Overburden removal targets",
    "Power sector coal supply"
  ];

  async function handleSearch(qToSearch = null) {
    const q = qToSearch || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.searchDirect(q, topK);
      let list = res.results || [];
      if (category) {
        list = list.filter(r => r.category === category || r.document_category === category);
      }
      setResults(list);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Global Search"
      />

      {/* Search Input Card */}
      <div className="gov-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search across reports, figures, or regulations..."
              className="form-input"
              style={{ paddingLeft: '34px', height: '40px', fontSize: '13px' }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
              style={{ height: '40px', fontSize: '13px' }}
            >
              <option value="">All Categories</option>
              <option value="CIL">CIL</option>
              <option value="CMPDI">CMPDI</option>
              <option value="Coal & Lignite">Coal & Lignite</option>
              <option value="Mine Safety">Mine Safety</option>
            </select>
          </div>

          <button
            onClick={() => handleSearch()}
            className="btn-primary"
            disabled={loading || !query.trim()}
            style={{ height: '40px', padding: '0 20px' }}
          >
            <Search size={14} />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>

        {/* Sample Queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Quick Queries:
          </span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: 'var(--bg-subtle)' }}
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="gov-card" style={{ marginBottom: '16px' }}>
          <LoadingState message="Scanning vector index across all statutory reports..." />
        </div>
      )}

      {/* Results Workspace */}
      {hasSearched && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedResult ? '1fr 1fr' : '1fr', gap: '16px' }}>
          {/* Results List */}
          <div className="gov-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Retrieved Results ({results.length})
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Sorted by Relevance Score
              </span>
            </div>

            {results.length === 0 ? (
              <EmptyState
                title="No matching chunks found"
                message="Try adjusting your keywords or category filters."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map((res, idx) => {
                  const isSelected = selectedResult === res;
                  const score = typeof res.relevance_score === 'number'
                    ? res.relevance_score.toFixed(3)
                    : (res.score ? Number(res.score).toFixed(3) : '0.850');
                  const pageStr = res.page_number !== undefined && res.page_number !== null
                    ? `Page ${res.page_number}`
                    : 'Page N/A';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedResult(res)}
                      style={{
                        padding: '12px 14px',
                        border: isSelected ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--accent-green-tint)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={13} color="var(--accent-green)" />
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {res.filename || res.document_name}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                            {pageStr}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Score: {score}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: '60px', overflow: 'hidden' }}>
                        {res.text || res.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result Inspector Panel */}
          {selectedResult && (
            <div className="gov-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div>
                  <span className="badge badge-green" style={{ marginBottom: '4px' }}>Chunk Inspector</span>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedResult.filename || selectedResult.document_name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="btn-subtle"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  Close
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Document: <strong>{selectedResult.filename}</strong> • Page: <strong>{selectedResult.page_number ?? 'N/A'}</strong> • Chunk ID: <strong>{selectedResult.chunk_id || '—'}</strong>
              </div>

              <div style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid var(--accent-green)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                marginBottom: '16px'
              }}>
                "{selectedResult.text || selectedResult.content}"
              </div>

              {onSelectResult && (
                <button
                  onClick={() => onSelectResult(selectedResult)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Bot size={14} />
                  <span>Ask AI Assistant About This Passage</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
