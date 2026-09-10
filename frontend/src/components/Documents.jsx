import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Eye, 
  Search,
  FileCheck
} from 'lucide-react';
import { api } from '../api';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const [docsRes, healthRes] = await Promise.all([
        api.getDocuments(),
        api.getDocumentsHealth()
      ]);
      setDocuments(docsRes.documents || []);
      setHealthData(healthRes);
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
      setUploadMsg({ type: 'success', text: `Uploaded and indexed: ${res.filename} (${res.pages} pages, ${res.chunks_indexed} chunks)` });
      await loadDocs();
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message || 'Failed to upload document.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleViewChunks(docId) {
    try {
      const details = await api.getDocument(docId);
      setSelectedDocDetails(details);
    } catch (e) {
      console.error('Failed to view chunks:', e);
    }
  }

  async function handleTriggerReindex() {
    try {
      await api.triggerReindex();
      setUploadMsg({ type: 'info', text: 'Background re-indexing started. Chunks and tables are being re-processed.' });
      setTimeout(loadDocs, 5000);
    } catch (e) {
      setUploadMsg({ type: 'error', text: 'Failed to initiate re-indexing.' });
    }
  }

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileText size={22} color="#FF6500" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              Document Ingestion & Knowledge Management
            </h2>
            <span className="badge badge-success">{documents.length} Indexed Reports</span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            Multi-document repository with PyMuPDF page-aware extraction, table parsing, and batch embedding indexing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary"
            onClick={() => setShowHealthModal(true)}
          >
            <Activity size={16} color="#10B981" />
            Document Health ({healthData?.system_health_score || 95}/100)
          </button>

          <button 
            className="btn-secondary"
            onClick={handleTriggerReindex}
            title="Re-run fast batch indexing for all PDFs in data folder"
          >
            <RefreshCw size={16} />
            Re-Index All
          </button>
        </div>
      </div>

      {/* Upload Notification Message */}
      {uploadMsg && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          background: uploadMsg.type === 'success' ? 'var(--success-bg)' : uploadMsg.type === 'error' ? 'var(--danger-bg)' : 'var(--info-bg)',
          color: uploadMsg.type === 'success' ? 'var(--success)' : uploadMsg.type === 'error' ? 'var(--danger)' : 'var(--info)',
          border: '1px solid currentColor',
          fontSize: '13px'
        }}>
          {uploadMsg.text}
        </div>
      )}

      {/* Upload Drop Area */}
      <div className="gov-card" style={{ marginBottom: '24px', textAlign: 'center', borderStyle: 'dashed', padding: '24px' }}>
        <input 
          type="file" 
          id="doc-upload" 
          accept=".pdf,.docx,.txt" 
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="doc-upload" style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'rgba(255, 101, 0, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Upload size={24} color="#FF6500" />
          </div>
          <div>
            <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '14px' }}>
              {uploading ? 'Processing & Embedding Document...' : 'Click to Upload Mining Report (PDF, DOCX)'}
            </span>
            <div style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>
              Automatic page segmentation, table detection, and sentence-transformers indexing
            </div>
          </div>
        </label>
      </div>

      {/* Document List Table */}
      <div className="gov-card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', marginBottom: '16px' }}>
          Indexed Mining Reports Repository
        </h3>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Pages</th>
                <th>Tables Detected</th>
                <th>Characters</th>
                <th>Chunks</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.document_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#3B82F6" />
                      <strong style={{ color: '#F8FAFC' }}>{doc.filename}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-orange">{doc.document_category}</span>
                  </td>
                  <td><strong>{doc.page_count}</strong></td>
                  <td>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{doc.tables_detected}</span>
                  </td>
                  <td>{doc.characters_extracted?.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-info">{doc.chunks_count} chunks</span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} /> {doc.processing_status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleViewChunks(doc.document_id)}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      <Eye size={13} /> View Chunks
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Health Modal */}
      {showHealthModal && healthData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="gov-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={22} color="#10B981" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  Document Health & Ingestion Diagnostics (Feature 13)
                </h3>
              </div>
              <button 
                onClick={() => setShowHealthModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >✕</button>
            </div>

            {/* Health Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#0B1320', padding: '12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontSize: '11px' }}>System Health Score</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>{healthData.system_health_score}/100</div>
              </div>
              <div style={{ background: '#0B1320', padding: '12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontSize: '11px' }}>Total Pages</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#F1F5F9' }}>{healthData.total_pages}</div>
              </div>
              <div style={{ background: '#0B1320', padding: '12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontSize: '11px' }}>Tables Indexed</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#3B82F6' }}>{healthData.total_tables_indexed}</div>
              </div>
              <div style={{ background: '#0B1320', padding: '12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontSize: '11px' }}>Vectorized Chunks</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF6500' }}>{healthData.total_chunks_indexed}</div>
              </div>
            </div>

            {/* Health Per Document */}
            <div className="gov-table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Pages</th>
                    <th>Text Status</th>
                    <th>OCR Status</th>
                    <th>Empty Pages</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.documents?.map((d) => (
                    <tr key={d.document_id}>
                      <td><strong style={{ color: '#F1F5F9', fontSize: '12px' }}>{d.filename}</strong></td>
                      <td>{d.pages}</td>
                      <td><span className="badge badge-success">{d.text_extraction_status}</span></td>
                      <td><span className="badge badge-info">{d.ocr_status}</span></td>
                      <td>{d.empty_pages_count > 0 ? `${d.empty_pages_count} (p. ${d.empty_pages.join(',')})` : '0'}</td>
                      <td><strong style={{ color: '#10B981' }}>{d.health_score}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn-secondary" onClick={() => setShowHealthModal(false)}>Close Diagnostics</button>
            </div>
          </div>
        </div>
      )}

      {/* Chunk Viewer Modal */}
      {selectedDocDetails && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="gov-card" style={{ maxWidth: '900px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  Page-Aware Chunks: {selectedDocDetails.filename}
                </h3>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Showing sample of indexed chunks with verified page numbers & table formatting
                </span>
              </div>
              <button 
                onClick={() => setSelectedDocDetails(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDocDetails.chunks_sample?.map((chk) => (
                <div key={chk.chunk_index} style={{ background: '#0B1320', border: '1px solid #1E3A5F', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-orange">Chunk #{chk.chunk_index}</span>
                      <span className="badge badge-info">Page {chk.page_number}</span>
                      {chk.is_table && <span className="badge badge-success">STRUCTURED TABLE</span>}
                    </div>
                  </div>
                  <pre style={{ 
                    color: '#CBD5E1', 
                    fontSize: '12px', 
                    fontFamily: 'monospace', 
                    whiteSpace: 'pre-wrap', 
                    background: '#070C15', 
                    padding: '10px', 
                    borderRadius: '4px',
                    margin: 0 
                  }}>
                    {chk.text}
                  </pre>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="btn-secondary" onClick={() => setSelectedDocDetails(null)}>Close Chunks</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
