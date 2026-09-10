import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText,
  Table
} from 'lucide-react';
import { api } from '../api';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handleGenerate();
  }, []);

  async function handleGenerate() {
    setLoading(true);
    try {
      const data = await api.generateReport('Annual Mining Performance & Decision Intelligence Report');
      setReport(data);
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyMarkdown() {
    if (!report) return;
    navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  const docxUrl = api.getDocxDownloadUrl('Annual Mining Performance & Decision Intelligence Report');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileSpreadsheet size={22} color="#FF6500" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              Automated Mining Report Generator (Feature 4)
            </h2>
            <span className="badge badge-success">9 Official Sections</span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            Generates standardized executive intelligence reports synthesized from all indexed CMPDI and CIL subsidiary files.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn-secondary"
            onClick={handleGenerate}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
            {loading ? 'Compiling...' : 'Regenerate'}
          </button>

          <button 
            className="btn-secondary"
            onClick={handleCopyMarkdown}
          >
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            {copied ? 'Copied MD!' : 'Copy Markdown'}
          </button>

          <button 
            className="btn-secondary"
            onClick={handlePrint}
          >
            <Printer size={14} />
            Print / PDF
          </button>

          <a 
            href={docxUrl}
            download="CoalIntel_Report.docx"
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={15} />
            Download DOCX
          </a>
        </div>
      </div>

      {/* Report Document Paper Card */}
      {report && (
        <div className="gov-card" style={{ padding: '32px', background: '#0F1A2C', border: '1px solid #1E3A5F' }}>
          {/* Report Cover / Title Banner */}
          <div style={{ textAlign: 'center', paddingBottom: '24px', marginBottom: '24px', borderBottom: '2px solid #1E3A5F' }}>
            <span style={{ fontSize: '12px', letterSpacing: '1px', fontWeight: 700, color: '#FF6500', textTransform: 'uppercase' }}>
              GOVERNMENT OF INDIA • MINISTRY OF COAL • CMPDI & CIL
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', marginBottom: '8px' }}>
              {report.title}
            </h1>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>
              Generated on: {new Date(report.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST | Decision Intelligence Division
            </div>
          </div>

          {/* Render Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {report.sections?.map((sec) => (
              <div key={sec.section_number} style={{ background: '#0B1320', padding: '20px', borderRadius: '8px', border: '1px solid #14243B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ 
                    background: '#FF6500', 
                    color: '#FFF', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800 
                  }}>
                    {sec.section_number}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
                    {sec.title}
                  </h3>
                </div>

                <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#CBD5E1', whiteSpace: 'pre-line', marginBottom: sec.table ? '16px' : '0' }}>
                  {sec.content}
                </div>

                {sec.table && (
                  <div className="gov-table-wrapper" style={{ marginTop: '14px' }}>
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
        </div>
      )}
    </div>
  );
}
