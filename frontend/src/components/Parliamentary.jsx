import React, { useState } from 'react';
import { 
  Landmark, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  Printer 
} from 'lucide-react';
import { api } from '../api';

export default function Parliamentary() {
  const [question, setQuestion] = useState("What was Coal India's coal dispatch and production in FY 2024-25?");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleAsk(qToAsk = null) {
    const q = qToAsk || question;
    if (!q.trim() || loading) return;

    setLoading(true);
    setResponse(null);
    try {
      const res = await api.askParliamentary(q);
      setResponse(res);
    } catch (e) {
      console.error('Failed to answer parliamentary query:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!response) return;
    const text = `
${response.parliamentary_header.ministry}
${response.parliamentary_header.house}
DATE: ${response.parliamentary_header.date}
SUBJECT: ${response.parliamentary_header.subject}

${response.official_statement}

ANNEXURE DATA:
${response.annexure_data?.map(a => `- ${a.parameter}: ${a.value} (${a.period}) [Source: ${a.source_ref}]`).join('\n')}

CONFIDENCE: ${response.confidence_score * 100}% (${response.confidence_level})
STATUS: ${response.verification_status}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sampleParliamentaryQueries = [
    "What was Coal India's coal dispatch and production in FY 2024-25?",
    "Details of fatal accidents, fatalities and safety indicators in CIL for 2024 and 2025",
    "CMPDI 2D seismic exploration survey progress and Profit Before Tax in FY 2024-25",
  ];

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Landmark size={22} color="#FF6500" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            Parliamentary & High-Priority Query Assistant (Feature 5)
          </h2>
          <span className="badge badge-orange">Lok Sabha / Rajya Sabha Briefing Engine</span>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px' }}>
          Translates high-stakes queries into official Government of India secretariat responses with verified tabular annexures.
        </p>
      </div>

      {/* Query Bar */}
      <div className="gov-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Enter Starred / Unstarred Parliamentary question..."
            style={{
              flex: 1,
              background: '#0B1320',
              border: '1px solid #1E3A5F',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#F1F5F9',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            className="btn-primary"
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            style={{ padding: '0 24px' }}
          >
            {loading ? 'Compiling Brief...' : 'Draft Official Brief'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Sample Briefs:</span>
          {sampleParliamentaryQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              style={{
                background: '#182844',
                border: '1px solid #1E3A5F',
                color: '#CBD5E1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {sq.slice(0, 48)}...
            </button>
          ))}
        </div>
      </div>

      {/* Official Response Paper */}
      {response && (
        <div className="gov-card" style={{ padding: '28px', background: '#0E1726', border: '1px solid #1E3A5F' }}>
          {/* Official Letterhead */}
          <div style={{ textAlign: 'center', paddingBottom: '16px', marginBottom: '20px', borderBottom: '2px solid #FF6500' }}>
            <h4 style={{ fontSize: '12px', letterSpacing: '1px', color: '#94A3B8', textTransform: 'uppercase' }}>
              {response.parliamentary_header.ministry}
            </h4>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              {response.parliamentary_header.house}
            </h3>
            <div style={{ fontSize: '12px', color: '#FF6500', fontWeight: 600, marginTop: '4px' }}>
              {response.parliamentary_header.session} • DATE: {response.parliamentary_header.date}
            </div>
            <div style={{ fontSize: '13px', color: '#E2E8F0', marginTop: '8px', fontWeight: 700 }}>
              {response.parliamentary_header.subject}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge badge-success">
              <ShieldCheck size={14} /> Confidence: {Math.round(response.confidence_score * 100)}% ({response.confidence_level})
            </span>

            <button className="btn-secondary" onClick={handleCopy} style={{ padding: '6px 12px', fontSize: '12px' }}>
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied Brief!' : 'Copy Secretariat Brief'}
            </button>
          </div>

          {/* Official Answer Body */}
          <div style={{ 
            background: '#0B1320', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #14243B',
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#F1F5F9',
            whiteSpace: 'pre-line',
            marginBottom: '20px'
          }}>
            {response.official_statement}
          </div>

          {/* Tabular Annexure */}
          {response.annexure_data?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', color: '#FF6500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                ANNEXURE: OFFICIAL STATISTICAL SUBMISSION
              </h4>
              <div className="gov-table-wrapper">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Key Parameter</th>
                      <th>Reported Value</th>
                      <th>Period</th>
                      <th>Entity</th>
                      <th>Statutory Source Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.annexure_data.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: '#F8FAFC' }}>{row.parameter}</strong></td>
                        <td><span style={{ color: '#FF6500', fontWeight: 700 }}>{row.value}</span></td>
                        <td>{row.period}</td>
                        <td><span className="badge badge-info">{row.entity}</span></td>
                        <td><span style={{ color: '#3B82F6', fontSize: '12px' }}>{row.source_ref}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footnote & Verification */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748B', paddingTop: '12px', borderTop: '1px solid #1E3A5F' }}>
            <span>Primary Grounding: "{response.primary_evidence_quote?.slice(0, 100)}..."</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>Verified by CoalIntel Intelligence Engine</span>
          </div>
        </div>
      )}
    </div>
  );
}
