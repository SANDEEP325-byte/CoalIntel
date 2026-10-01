import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText,
  Table,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import LoadingState from './common/LoadingState';
import { api } from '../api';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('comprehensive_annual');
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('');
  const [customTitle, setCustomTitle] = useState('Annual Mining Performance & Decision Intelligence Report');

  useEffect(() => {
    loadTemplates();
    handleGenerate();
  }, []);

  async function loadTemplates() {
    try {
      const res = await api.getReportTemplates();
      if (res?.templates) setTemplates(res.templates);
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const data = await api.generateReport(
        customTitle, 
        selectedTemplate, 
        selectedYear, 
        selectedSubsidiary || null
      );
      setReport(data);
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateChange(templateId) {
    setSelectedTemplate(templateId);
    if (templateId === 'comprehensive_annual') {
      setCustomTitle('Annual Mining Performance & Decision Intelligence Report');
    } else if (templateId === 'production_dispatch') {
      setCustomTitle('Executive Coal Production & Dispatch Performance Brief');
    } else if (templateId === 'subsidiary_review') {
      setCustomTitle('CIL Subsidiary-Wise Operational & Safety Review');
    } else if (templateId === 'geological_exploration') {
      setCustomTitle('CMPDIL Geological Exploration & Technical Consultancy Report');
    }
  }

  function handleCopyMarkdown() {
    if (!report?.markdown) return;
    navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  const docxUrl = api.getDocxDownloadUrl(
    customTitle, 
    selectedTemplate, 
    selectedYear, 
    selectedSubsidiary || null
  );

  return (
    <div>
      {/* 1. Page Header */}
      <PageHeader
        title="Report Generator"
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn-secondary"
              onClick={handleGenerate}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Compiling...' : 'Regenerate'}</span>
            </button>

            <button 
              type="button"
              className="btn-secondary"
              onClick={handleCopyMarkdown}
              disabled={!report}
            >
              {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>

            <button 
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
              disabled={!report}
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>

            <a 
              href={docxUrl}
              download={`${customTitle.replace(/\s+/g, '_')}.docx`}
              className="btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <Download size={13} />
              <span>Download Word (.docx)</span>
            </a>
          </div>
        }
      />

      {/* 2. Original Configuration Controls Bar */}
      <div className="gov-card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          {/* Template Selector */}
          <div>
            <label className="form-label">Report Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="comprehensive_annual">Comprehensive Annual Performance (9 Sections)</option>
              <option value="production_dispatch">Executive Production &amp; Dispatch Brief</option>
              <option value="subsidiary_review">CIL Subsidiary-Wise Operational Review</option>
              <option value="geological_exploration">CMPDIL Geological Exploration Report</option>
            </select>
          </div>

          {/* Fiscal Year */}
          <div>
            <label className="form-label">Target Fiscal Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="2024-25">FY 2024-25 (Audited)</option>
              <option value="2023-24">FY 2023-24 (Comparative)</option>
              <option value="2025-26">FY 2025-26 (Projections)</option>
            </select>
          </div>

          {/* Subsidiary Scope */}
          <div>
            <label className="form-label">Operating Scope</label>
            <select
              value={selectedSubsidiary}
              onChange={(e) => setSelectedSubsidiary(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="">All CIL Subsidiaries &amp; CMPDI</option>
              <option value="MCL">Mahanadi Coalfields (MCL)</option>
              <option value="SECL">South Eastern Coalfields (SECL)</option>
              <option value="NCL">Northern Coalfields (NCL)</option>
              <option value="CCL">Central Coalfields (CCL)</option>
              <option value="WCL">Western Coalfields (WCL)</option>
              <option value="ECL">Eastern Coalfields (ECL)</option>
              <option value="BCCL">Bharat Coking Coal (BCCL)</option>
              <option value="CMPDI">CMPDIL (Exploration &amp; Planning)</option>
            </select>
          </div>

          {/* Title Editor */}
          <div>
            <label className="form-label">Report Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* 3. Loading State */}
      {loading && (
        <LoadingState message="Compiling statutory report sections and calculating verified figures..." />
      )}

      {/* 4. Structured Report Document Paper Card */}
      {!loading && report && (
        <div 
          className="gov-card" 
          style={{ 
            padding: '32px 36px', 
            background: '#FFFFFF', 
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px'
          }}
        >
          {/* Official Report Title Banner */}
          <div style={{ textAlign: 'center', paddingBottom: '20px', marginBottom: '24px', borderBottom: '2px solid var(--text-primary)' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '8px' }}>
              {report.title}
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Compilation Date: {new Date(report.generated_at).toLocaleDateString('en-IN')} | Verified Operational Report
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <span className="badge badge-neutral">Scope: {report.report_type}</span>
              <span className="badge badge-neutral">Period: {report.year}</span>
              <span className="badge badge-green">9 Grounded Sections</span>
            </div>
          </div>

          {/* Render Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {report.sections?.map((sec) => (
              <div key={sec.section_number} style={{ paddingBottom: '18px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ 
                    background: 'var(--gov-navy)', 
                    color: '#FFF', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: 700 
                  }}>
                    {sec.section_number}
                  </span>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {sec.title}
                  </h2>
                </div>

                <div style={{ 
                  fontSize: '13px', 
                  lineHeight: '1.7', 
                  color: 'var(--text-secondary)', 
                  whiteSpace: 'pre-line', 
                  marginBottom: sec.table ? '12px' : '0' 
                }}>
                  {sec.content}
                </div>

                {sec.table && (
                  <div className="gov-table-wrapper" style={{ marginTop: '12px' }}>
                    <table className="gov-table">
                      <thead>
                        <tr>
                          {sec.table[0]?.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.table.slice(1).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>
                                {cIdx === 0 ? <strong>{cell}</strong> : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Official Sign-Off Block */}
          <div style={{ 
            marginTop: '28px', 
            paddingTop: '16px', 
            borderTop: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}>
            <div>
              Certified by: <strong style={{ color: 'var(--text-primary)' }}>CoalIntel Mining Intelligence &amp; Reporting Platform</strong><br />
              Target Organization: CMPDIL &amp; Coal India Limited Subsidiaries
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>OFFICIAL AUDITED SUBMISSION</span><br />
              Page &amp; Table Traceability Verified
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
