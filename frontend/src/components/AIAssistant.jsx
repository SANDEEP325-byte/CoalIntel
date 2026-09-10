import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Copy, 
  Check, 
  Search, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api';

export default function AIAssistant({ initialQuestion, onSwitchTab }) {
  const [question, setQuestion] = useState(initialQuestion || "What was CIL's coal dispatch in FY 2024-25?");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedChunk, setExpandedChunk] = useState(null);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
      handleAsk(initialQuestion);
    }
  }, [initialQuestion]);

  async function handleAsk(qToAsk = null) {
    const q = qToAsk || question;
    if (!q.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await api.queryAssistant(q, 5, selectedCategory || null);
      setResponse(res);
    } catch (err) {
      setResponse({
        error: err.message || 'Error communicating with CoalIntel assistant.',
        answer: 'Failed to generate answer. Ensure backend is running.',
        sources: [],
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyBrief() {
    if (!response) return;
    const brief = `[COALINTEL VERIFIED REPORT]\nQUESTION: ${response.question}\nCONFIDENCE: ${response.confidence * 100}% (${response.confidence_level})\nANSWER: ${response.answer}\nEVIDENCE: ${response.evidence}\nSOURCES: ${response.sources?.map(s => `${s.filename} (Page ${s.page_number})`).join(', ')}`;
    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sampleQueries = [
    { label: "CIL Coal Dispatch 2024-25", q: "What was CIL's coal dispatch in FY 2024-25?" },
    { label: "CIL vs CMPDI Comparison", q: "Compare CIL and CMPDI performance in FY 2024-25." },
    { label: "Fatalities & Accidents 2024", q: "What were the fatal accidents and fatalities in CIL during 2024?" },
    { label: "CMPDI Seismic Exploration", q: "What was CMPDI's 2D seismic exploration progress and Profit Before Tax?" },
    { label: "Anti-Hallucination Test", q: "What was the total gold production in Australia in 2020?" },
  ];

  return (
    <div>
      {/* Title Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Bot size={22} color="#FF6500" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            Evidence-Grounded AI Document Assistant
          </h2>
          <span className="badge badge-info">Qwen3:1.7B Local LLM</span>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px' }}>
          Ask natural-language questions across CIL, CMPDI, Production, and Safety statutory reports. 
          Every fact is verified with exact page numbers and evidence snippets under zero-hallucination policy.
        </p>
      </div>

      {/* Query Bar & Controls */}
      <div className="gov-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="e.g. What was CIL's coal dispatch in FY 2024-25?"
              style={{
                width: '100%',
                background: '#0B1320',
                border: '1px solid #1E3A5F',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#F1F5F9',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              background: '#0B1320',
              border: '1px solid #1E3A5F',
              borderRadius: '8px',
              padding: '0 14px',
              color: '#94A3B8',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Document Categories</option>
            <option value="CIL">CIL</option>
            <option value="CMPDI">CMPDI</option>
            <option value="Coal & Lignite Production">Coal & Lignite Production</option>
            <option value="Mine Safety">Mine Safety</option>
          </select>

          <button
            className="btn-primary"
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            style={{ padding: '0 24px' }}
          >
            {loading ? (
              <>
                <span className="pulse-dot" style={{ background: '#FFF' }}></span>
                Synthesizing...
              </>
            ) : (
              <>
                <Send size={16} />
                Ask Assistant
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Try queries:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq.q);
                handleAsk(sq.q);
              }}
              style={{
                background: '#182844',
                border: '1px solid #1E3A5F',
                color: '#CBD5E1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s'
              }}
            >
              {sq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className="gov-card" style={{ borderLeft: '4px solid #FF6500' }}>
          {/* Header Metadata Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1E3A5F' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-orange">Intent: {response.intent || 'FACTUAL'}</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Confidence:</span>
                <span className={`badge ${response.confidence_level === 'HIGH' ? 'badge-success' : response.confidence_level === 'MEDIUM' ? 'badge-warning' : 'badge-danger'}`}>
                  <ShieldCheck size={14} />
                  {Math.round(response.confidence * 100)}% ({response.confidence_level})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={handleCopyBrief}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                {copied ? 'Copied Brief!' : 'Copy as Official Brief'}
              </button>
            </div>
          </div>

          {/* Answer Text */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Grounded Answer
            </h4>
            <div style={{ 
              fontSize: '15px', 
              lineHeight: '1.6', 
              color: '#F8FAFC',
              background: '#0B1320',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #14243B'
            }}>
              {response.answer}
            </div>
          </div>

          {/* Evidence Snippet */}
          {response.evidence && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Supporting Evidence Quote
              </h4>
              <div style={{ 
                background: '#070C15', 
                padding: '12px 16px', 
                borderRadius: '6px', 
                borderLeft: '3px solid #10B981',
                fontSize: '13px',
                color: '#CBD5E1',
                fontStyle: 'italic'
              }}>
                "{response.evidence}"
              </div>
            </div>
          )}

          {/* Sources and Page Citations */}
          <div>
            <h4 style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Source Documents & Exact Page Citations ({response.sources?.length || 0})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {response.sources?.map((s, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: '#0B1320', 
                    border: '1px solid #1E3A5F', 
                    borderRadius: '6px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#3B82F6" />
                      <strong style={{ color: '#F1F5F9', fontSize: '13px' }}>{s.filename}</strong>
                      <span className="badge badge-info" style={{ fontSize: '11px' }}>
                        Page {s.page_number || 'Unknown'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Category: {s.document_category}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        Hybrid Score: <strong style={{ color: '#FF6500' }}>{s.hybrid_score || s.similarity_score}</strong>
                      </span>
                      <button
                        onClick={() => setExpandedChunk(expandedChunk === idx ? null : idx)}
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {expandedChunk === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedChunk === idx && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '10px', 
                      background: '#070C15', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      color: '#94A3B8',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap' 
                    }}>
                      {s.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
