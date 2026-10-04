import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import DataTable from './common/DataTable';
import EmptyState from './common/EmptyState';
import LoadingState from './common/LoadingState';
import { api } from '../api';

export default function Documents({ onAskQuestion, currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await api.uploadDocument(file);
      setUploadMsg({
        type: 'success',
        text: `Successfully ingested: ${res.filename || file.name} (${res.pages || 'N/A'} pages, ${res.chunks_indexed || 'N/A'} chunks indexed).`
      });
      await loadDocuments();
    } catch (err) {
      setUploadMsg({
        type: 'error',
        text: err.message || 'Failed to upload and index document.'
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleInspect(docId) {
    setInspectLoading(true);
    try {
      const details = await api.getDocument(docId);
      setSelectedDocDetails(details);
    } catch (e) {
      console.error('Failed to inspect document:', e);
    } finally {
      setInspectLoading(false);
    }
  }

  // Filter logic
  const filteredDocs = documents.filter((doc) => {
    const name = (doc.filename || doc.document_name || '').toLowerCase();
    const cat = (doc.document_category || '').toLowerCase();
    const status = (doc.processing_status || 'indexed').toLowerCase();

    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || cat.includes(searchQuery.toLowerCase());
    const matchesCat = !categoryFilter || cat === categoryFilter.toLowerCase();
    const matchesStatus = !statusFilter || status.includes(statusFilter.toLowerCase());

    return matchesSearch && matchesCat && matchesStatus;
  });

  const categories = Array.from(new Set(documents.map(d => d.document_category).filter(Boolean)));

  const columns = [
    {
      header: 'Document Name',
      accessor: 'filename',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={15} color="var(--accent-green)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.filename || row.document_name}
          </span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'document_category',
      render: (row) => (
        <span className="badge badge-neutral">
          {row.document_category || 'Statutory'}
        </span>
      )
    },
    {
      header: 'Pages',
      accessor: 'page_count',
      align: 'right',
      render: (row) => row.page_count ?? '—'
    },
    {
      header: 'Chunks',
      accessor: 'chunks_count',
      align: 'right',
      render: (row) => row.chunks_count ?? '—'
    },
    {
      header: 'Status',
      accessor: 'processing_status',
      render: (row) => <StatusBadge status={row.processing_status || 'Indexed'} />
    },
    {
      header: 'Uploaded At',
      accessor: 'uploaded_at',
      render: (row) => {
        if (!row.uploaded_at) return 'Statutory Pre-load';
        try {
          return new Date(row.uploaded_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch {
          return row.uploaded_at;
        }
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            onClick={() => handleInspect(row.id)}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11.5px' }}
            title="Inspect metadata and extracted chunks"
          >
            <Eye size={13} />
            <span>Inspect</span>
          </button>
          <button
            onClick={() => onAskQuestion(`What are the major operational activities and key figures in this report?`, { document_id: row.id, filename: row.filename })}
            className="btn-subtle"
            style={{ padding: '3px 10px', fontSize: '11.5px', color: '#F97316', border: '1px solid rgba(249, 115, 22, 0.3)' }}
            title="Ask question scoped specifically to this document"
          >
            <Bot size={13} style={{ marginRight: '4px' }} />
            <span>Ask About This Document</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        actions={
          <button 
            className="btn-secondary" 
            onClick={loadDocuments}
            disabled={loading}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Upload Feedback */}
      {uploadMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '13px',
          backgroundColor: uploadMsg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          color: uploadMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${uploadMsg.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`
        }}>
          {uploadMsg.text}
        </div>
      )}

      {/* Practical Upload Area (Clean, Non-Flashy Enterprise) */}
      {currentUser?.role !== 'VIEWER' && (
        <div className="gov-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Ingest Statutory Report (PDF)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Upload an operational, geological, or financial filing to extract text and generate 384-D vector chunks.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label 
                htmlFor="doc-upload" 
                className="btn-primary"
                style={{ cursor: uploading ? 'wait' : 'pointer' }}
              >
                <Upload size={14} />
                <span>{uploading ? 'Processing & Ingesting...' : 'Select PDF File'}</span>
              </label>
              <input 
                id="doc-upload" 
                type="file" 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="gov-card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Text Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by document name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ width: '180px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ height: '34px', fontSize: '12.5px' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ height: '34px', fontSize: '12.5px' }}
            >
              <option value="">All Statuses</option>
              <option value="indexed">Indexed</option>
              <option value="processed">Processed</option>
              <option value="upload">Uploaded</option>
              <option value="extract">Extracting</option>
              <option value="chunk">Chunking</option>
              <option value="embed">Embedding</option>
              <option value="fail">Failed</option>
            </select>
          </div>

          {(searchQuery || categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="btn-subtle"
              style={{ fontSize: '12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Document Table */}
      <div className="gov-card">
        {loading ? (
          <LoadingState message="Loading documents from repository..." />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            title="No documents match criteria"
            message="Try clearing your search query or filters to view all statutory filings."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setCategoryFilter('');
              setStatusFilter('');
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredDocs}
            keyField="id"
          />
        )}
      </div>

      {/* Document Details Drawer / Modal */}
      {selectedDocDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}>
          <div style={{
            width: '640px',
            maxWidth: '100%',
            backgroundColor: 'var(--bg-surface)',
            height: '100%',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-subtle)'
            }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: '4px' }}>
                  Document Inspector
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedDocDetails.filename || selectedDocDetails.document_name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    const docId = selectedDocDetails.id || selectedDocDetails._id;
                    const docName = selectedDocDetails.filename || selectedDocDetails.document_name;
                    setSelectedDocDetails(null);
                    onAskQuestion(`What are the major operational activities and key disclosures in this report?`, {
                      document_id: docId,
                      filename: docName
                    });
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '12px' }}
                >
                  <Bot size={13} />
                  <span>Ask About This Document</span>
                </button>
                <button
                  onClick={() => setSelectedDocDetails(null)}
                  className="btn-subtle"
                  style={{ padding: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {/* Metadata Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedDocDetails.document_category || 'Statutory'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</div>
                  <StatusBadge status={selectedDocDetails.processing_status || 'Indexed'} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Pages</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedDocDetails.page_count || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Indexed Chunks</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedDocDetails.chunks_count || selectedDocDetails.chunks?.length || '—'}</div>
                </div>
              </div>

              {/* Chunks List */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Extracted Chunks & Page Alignment ({selectedDocDetails.chunks?.length || 0})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedDocDetails.chunks || []).map((chk, i) => (
                    <div
                      key={chk.chunk_id || i}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: '12.5px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Chunk #{i + 1} {chk.chunk_id ? `(${chk.chunk_id})` : ''}
                        </span>
                        <span>Page {chk.page_number ?? 'N/A'}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: '80px', overflow: 'hidden' }}>
                        {chk.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => {
                  onAskQuestion(`Summarize key operational findings from ${selectedDocDetails.filename}`);
                  setSelectedDocDetails(null);
                }}
                className="btn-primary"
              >
                <Bot size={14} /> Query with AI Assistant
              </button>
              <button
                onClick={() => setSelectedDocDetails(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
