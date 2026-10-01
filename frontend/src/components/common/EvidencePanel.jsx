import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * EvidencePanel - Displays retrieved statutory evidence passages with exact page-level citations
 */
export default function EvidencePanel({ sources = [], title = "Retrieved Statutory Evidence", onViewDocument }) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  if (!sources || sources.length === 0) {
    return (
      <div className="gov-card-compact" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          No direct evidence passages retrieved for this query.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="var(--accent-green)" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {title} ({sources.length})
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Traceable to Indexed Chunks
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sources.map((src, idx) => {
          const isExpanded = expandedIndex === idx;
          const score = typeof src.relevance_score === 'number' 
            ? src.relevance_score.toFixed(3) 
            : (src.score ? Number(src.score).toFixed(3) : '0.850');
          const pageStr = src.page_number !== undefined && src.page_number !== null 
            ? `Page ${src.page_number}` 
            : 'Page info unavailable';
          const docName = src.filename || src.document_name || 'Statutory Filing';
          const chunkId = src.chunk_id || `CHUNK-${idx + 1}`;

          return (
            <div 
              key={idx} 
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}
            >
              {/* Citation Header Row */}
              <div 
                onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                  <FileText size={14} color="var(--accent-green)" />
                  <span style={{ 
                    fontSize: '12.5px', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {docName}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                    {pageStr}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Score: {score}
                  </span>
                  {onViewDocument && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDocument(src);
                      }}
                      className="btn-subtle"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      title="Inspect document"
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Verbatim Evidence Block */}
              {isExpanded && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)', 
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)' 
                  }}>
                    <span>Identifier: {chunkId}</span>
                    <span>Document: {docName} • {pageStr}</span>
                  </div>

                  <div style={{
                    fontSize: '12.5px',
                    lineHeight: '1.55',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderLeft: '3px solid var(--accent-green)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit'
                  }}>
                    "{src.text || src.content || 'Evidence snippet unavailable.'}"
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle Grounding Note */}
      <div style={{ 
        marginTop: '6px', 
        fontSize: '11px', 
        color: 'var(--text-muted)', 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '6px' 
      }}>
        Responses are generated only from the available indexed documents. Verify important figures against the cited source.
      </div>
    </div>
  );
}
