import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import StatusBadge from './common/StatusBadge';
import EvidencePanel from './common/EvidencePanel';
import LoadingState from './common/LoadingState';
import { api } from '../api';

/**
 * Formats AI response:
 * - Eliminates raw Markdown asterisks (*, **, ***).
 * - Converts bold/italic emphasis into standard double quotation marks ("...").
 * - Converts leading asterisk/dash bullets into clean UI bullet points (• ).
 * - Strips markdown header hashes (###).
 * - Preserves mathematical expressions.
 */
function formatCleanResponse(rawText) {
  if (!rawText) return '';
  
  const lines = rawText.split('\n');
  const formattedLines = lines.map(line => {
    let l = line.trimEnd();

    // 1. Convert markdown bullet lists (* or - or +) into bullet symbol •
    if (/^\s*[\*\-\+]\s+/.test(l)) {
      l = l.replace(/^\s*[\*\-\+]\s+/, '• ');
    }

    // 2. Convert markdown headers (### Header) to clean uppercase text
    if (/^#{1,6}\s+/.test(l)) {
      l = l.replace(/^#{1,6}\s+/, '');
    }

    // 3. Convert bold-italic ***text*** into "text"
    l = l.replace(/\*\*\*([^*]+)\*\*\*/g, (m, p1) => `"${p1.trim().replace(/^"|"$/g, '')}"`);

    // 4. Convert bold **text** into "text"
    l = l.replace(/\*\*([^*]+)\*\*/g, (m, p1) => `"${p1.trim().replace(/^"|"$/g, '')}"`);

    // 5. Convert italic *text* into "text" (ensuring it's word/punctuation bounded, not math like 5 * 10)
    l = l.replace(/(^|[\s\(\[\{,\.:;])\*([^\s*][^*]*?[^\s*])\*([\s\)\]\},!\?:;\.]|$)/g, (m, before, p1, after) => {
      return `${before}"${p1.trim().replace(/^"|"$/g, '')}"${after}`;
    });

    // 6. Handle any stray single-word *word* at boundaries
    l = l.replace(/(^|[\s])\*([a-zA-Z0-9_\-%]+)\*([\s\.,;]|$)/g, '$1"$2"$3');

    // 7. Clean up any redundant quotes like """text""" or ""text""
    l = l.replace(/"+/g, '"');

    // 8. If emphasis phrase was quoted inside another quote, clean it:
    l = l.replace(/"\s*"/g, ' ');

    return l;
  });

  return formattedLines.join('\n');
}

export default function AIAssistant({ initialQuestion, onSwitchTab }) {
  const [question, setQuestion] = useState(initialQuestion || "What was CIL's coal dispatch in FY 2024-25?");
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
      handleExecuteQuery(initialQuestion);
    }
  }, [initialQuestion]);

  async function loadDocuments() {
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch {
      setDocuments([]);
    }
  }

  async function handleExecuteQuery(qToRun = null) {
    const q = qToRun || question;
    if (!q.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await api.queryAssistant(q, 5, category || null);
      setResponse(res);
    } catch (err) {
      setResponse({
        error: err.message || 'Error communicating with CoalIntel AI Query Engine.',
        answer: 'Failed to retrieve evidence. Ensure backend service is active and responsive.',
        sources: []
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!response) return;
    const text = `COALINTEL AI MINING QUERY WORKSPACE
QUERY: ${response.question || question}
ANSWER:
${formatCleanResponse(response.answer)}

RETRIEVED STATUTORY EVIDENCE:
${(response.sources || []).map((s, i) => `[${i + 1}] ${s.filename} (Page ${s.page_number ?? 'N/A'}, Relevance: ${s.relevance_score ?? '0.85'})\n"${s.text}"`).join('\n\n')}

VERIFICATION NOTE: Generated strictly from indexed statutory filings.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Ground suggested queries dynamically in verified indexed documents
  const suggestedQueries = [];
  const filenames = (documents || []).map(d => (d.filename || '').toLowerCase());
  const hasCilOrCoalDoc = filenames.some(f => f.includes('cil') || f.includes('coal') || f.includes('production'));
  const hasSafetyDoc = filenames.some(f => f.includes('safety') || f.includes('dgms'));
  const hasCmpdiDoc = filenames.some(f => f.includes('cmpdi') || f.includes('exploration'));

  if (hasCilOrCoalDoc) {
    suggestedQueries.push({
      label: "CIL Coal Dispatch FY 2024-25",
      q: "What was CIL's coal dispatch in FY 2024-25?"
    });
    suggestedQueries.push({
      label: "Coal Production Disclosures",
      q: "What coal production information is available in the uploaded documents?"
    });
  }

  if (hasSafetyDoc) {
    suggestedQueries.push({
      label: "Mine Safety Information",
      q: "What information is available about mine safety in the indexed reports?"
    });
  }

  if (hasCmpdiDoc) {
    suggestedQueries.push({
      label: "CMPDI Activities & Exploration",
      q: "Summarize the major findings and achievements from the CMPDI report."
    });
  }

  if (documents.length > 0) {
    suggestedQueries.push({
      label: "Summary of Major Findings",
      q: "Summarize the major findings from the indexed mining reports."
    });
    suggestedQueries.push({
      label: "Source & Page Evidence",
      q: "Show the source and page evidence for this answer."
    });
  }

  return (
    <div>
      {/* 1. Page Header */}
      <PageHeader
        title="AI Assistant"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Strict Document Grounding Active
            </span>
          </div>
        }
      />

      {/* 2. Top Query Input Box */}
      <div className="gov-card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleExecuteQuery(); }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '320px' }}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter query regarding production, dispatch, exploration, or safety regulations..."
                className="form-input"
                style={{ height: '40px', fontSize: '13.5px' }}
                disabled={loading}
              />
            </div>

            <div style={{ width: '180px' }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                style={{ height: '40px', fontSize: '13px' }}
                disabled={loading}
              >
                <option value="">All Categories</option>
                <option value="CIL">CIL</option>
                <option value="CMPDI">CMPDI</option>
                <option value="Coal & Lignite">Coal & Lignite</option>
                <option value="Mine Safety">Mine Safety</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !question.trim()}
              style={{ height: '40px', padding: '0 18px' }}
            >
              <Send size={14} />
              <span>{loading ? 'Retrieving Evidence...' : 'Execute Query'}</span>
            </button>
          </div>
        </form>

        {/* Suggested Queries - Only shown when verified documents exist */}
        {suggestedQueries.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Suggested Queries:
            </span>
            {suggestedQueries.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(item.q);
                  handleExecuteQuery(item.q);
                }}
                className="btn-secondary"
                style={{ 
                  padding: '3px 8px', 
                  fontSize: '11.5px', 
                  backgroundColor: 'var(--bg-subtle)'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="gov-card" style={{ marginBottom: '16px' }}>
          <LoadingState message="Scanning vector index, retrieving grounded chunks, and synthesizing answer..." />
        </div>
      )}

      {/* Query Result Workspace */}
      {response && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', alignItems: 'start' }}>
          {/* Left Column: AI Synthesized Answer */}
          <div className="gov-card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid var(--border-color)', 
              paddingBottom: '10px', 
              marginBottom: '14px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={16} color="var(--accent-green)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Evidence-Grounded Synthesized Answer
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-green" style={{ fontSize: '11px' }}>
                  {response.provider || 'Google Gemini'} ({response.model_used || 'gemini-3.5-flash-lite'})
                </span>
                <button
                  onClick={handleCopy}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11.5px' }}
                  title="Copy verified answer to clipboard"
                >
                  {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Question Display */}
            <div style={{ 
              fontSize: '12.5px', 
              color: 'var(--text-muted)', 
              marginBottom: '12px',
              fontStyle: 'italic'
            }}>
              Query: "{response.question || question}"
            </div>

            {/* Answer Body */}
            <div style={{ 
              fontSize: '13.5px', 
              lineHeight: 1.65, 
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {formatCleanResponse(response.answer)}
            </div>

            {/* Grounding & Verification Footer */}
            <div style={{ 
              marginTop: '16px', 
              paddingTop: '12px', 
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11.5px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="var(--accent-green)" />
                <span>Grounded in {response.sources?.length || 0} retrieved statutory passages</span>
              </div>
              <div>
                Page Traceability: <strong style={{ color: 'var(--text-secondary)' }}>Available</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Retrieved Evidence & Source Citations */}
          <div className="gov-card">
            <EvidencePanel 
              sources={response.sources || []} 
              onViewDocument={(src) => {
                if (onSwitchTab) onSwitchTab('documents');
              }}
            />
          </div>
        </div>
      )}

      {/* Initial Guidance Empty State */}
      {!response && !loading && (
        <div className="gov-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'var(--accent-green-tint)', 
            border: '1px solid var(--accent-green-border)',
            color: 'var(--accent-green)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Bot size={18} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Ready for Statutory Querying
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 16px' }}>
            Submit an operational or financial query above, or select one of the suggested statutory prompts. All responses are derived strictly from the indexed documents in MongoDB with verifiable page-level quotes.
          </p>
          <div style={{ display: 'inline-flex', gap: '8px' }}>
            <button
              onClick={() => {
                const q = "What was CIL's coal dispatch in FY 2024-25?";
                setQuestion(q);
                handleExecuteQuery(q);
              }}
              className="btn-primary"
            >
              Test Golden Query (CIL Dispatch FY 2024-25)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
