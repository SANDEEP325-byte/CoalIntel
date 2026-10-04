import React from 'react';
import {
  FileText,
  Search,
  Bot,
  ShieldCheck,
  Layers,
  Download,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  Building2,
  BarChart3,
  Check,
  ChevronRight,
  Lock,
  Compass,
  FileCheck2,
  GitBranch
} from 'lucide-react';

export default function LandingPage({ onNavigateLogin, onNavigateSignup }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070E18',
      color: '#F8FAFC',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      lineHeight: 1.5,
      overflowX: 'hidden'
    }}>
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION / HEADER */}
      {/* ------------------------------------------------------------- */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(7, 14, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1E293B',
        padding: '0 24px',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/coalintel-icon.png"
            alt="CoalIntel Logo"
            style={{ width: '38px', height: '38px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ color: '#F8FAFC' }}>COAL</span>
              <span style={{ color: '#F97316' }}>INTEL</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, letterSpacing: '0.4px', marginTop: '2px' }}>
              MINING DECISION INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '28px',
          fontSize: '13.5px',
          fontWeight: 500,
          color: '#94A3B8'
        }} className="landing-desktop-nav">
          <a href="#platform" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Platform</a>
          <a href="#capabilities" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Capabilities</a>
          <a href="#how-it-works" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>How It Works</a>
          <a href="#why-coalintel" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Why CoalIntel</a>
          <a href="#security" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Security & RBAC</a>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onNavigateLogin}
            style={{
              padding: '8px 18px',
              backgroundColor: 'transparent',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Sign In
          </button>

          <button
            onClick={onNavigateSignup}
            style={{
              padding: '8px 18px',
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#EA580C'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F97316'; }}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section style={{
        position: 'relative',
        padding: '72px 24px 80px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Institutional Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          color: '#FB923C',
          fontSize: '11.5px',
          fontWeight: 700,
          letterSpacing: '0.6px',
          marginBottom: '24px'
        }}>
          <ShieldCheck size={14} />
          <span>STATUTORY MINING INTELLIGENCE & DECISION PLATFORM</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(32px, 5.5vw, 56px)',
          fontWeight: 800,
          color: '#F8FAFC',
          margin: '0 0 20px',
          lineHeight: 1.15,
          letterSpacing: '-0.5px'
        }}>
          Transform Scattered Mining Reports into{' '}
          <span style={{
            color: '#F97316',
            backgroundImage: 'linear-gradient(90deg, #F97316, #FBBF24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Traceable Evidence-Grounded
          </span>{' '}
          Intelligence
        </h1>

        {/* Hero Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: '#94A3B8',
          maxWidth: '820px',
          margin: '0 auto 36px',
          lineHeight: 1.65,
          fontWeight: 400
        }}>
          CoalIntel ingests geological, statutory, and operational filings across Coal India Limited (CIL) and CMPDI subsidiaries. It builds an indexed semantic knowledge base, empowering decision-makers with evidence-grounded AI synthesis, direct source verification, and automated reporting.
        </p>

        {/* Hero CTA Group */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '56px'
        }}>
          <button
            onClick={onNavigateSignup}
            style={{
              padding: '13px 28px',
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.4)',
              transition: 'transform 0.15s ease, background-color 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#EA580C'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F97316'; }}
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onNavigateLogin}
            style={{
              padding: '13px 26px',
              backgroundColor: '#0F172A',
              color: '#E2E8F0',
              border: '1px solid #334155',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#64748B'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#0F172A'; }}
          >
            <Lock size={15} color="#94A3B8" />
            <span>Sign In to Portal</span>
          </button>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* HERO WORKFLOW PIPELINE VISUAL (REAL ARCHITECTURE) */}
        {/* ----------------------------------------------------------- */}
        <div id="platform" style={{
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={18} color="#F97316" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.4px' }}>
                COALINTEL EVIDENCE-GROUNDED PROCESSING PIPELINE
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              color: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontWeight: 600,
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              Active Architecture
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px'
          }}>
            {[
              {
                step: '01',
                title: 'Report Ingestion',
                desc: 'PyMuPDF page-aware PDF extraction with multi-column table linearization',
                icon: FileText,
                color: '#38BDF8'
              },
              {
                step: '02',
                title: 'Vector Embedding',
                desc: '500-token chunking with 384-D normalized embeddings via all-MiniLM-L6-v2',
                icon: Layers,
                color: '#A855F7'
              },
              {
                step: '03',
                title: 'Atlas Storage',
                desc: 'Enterprise MongoDB Atlas cluster storing chunks, metadata & audit logs',
                icon: Database,
                color: '#10B981'
              },
              {
                step: '04',
                title: 'Hybrid Retrieval',
                desc: 'Cosine similarity merged with BM25 regex keyword Reciprocal Rank Fusion',
                icon: Search,
                color: '#FBBF24'
              },
              {
                step: '05',
                title: 'Grounded AI Synthesis',
                desc: 'Gemini / Ollama answers bound strictly to retrieved passages with confidence scoring',
                icon: Bot,
                color: '#F97316'
              },
              {
                step: '06',
                title: 'Source Verification',
                desc: 'Verbatim chunk citations, exact page numbers, and statutory document audits',
                icon: FileCheck2,
                color: '#34D399'
              }
            ].map((node, i) => (
              <div key={i} style={{
                backgroundColor: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <node.icon size={18} color={node.color} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>{node.step}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>
                  {node.title}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', lineHeight: 1.45 }}>
                  {node.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PLATFORM CAPABILITIES */}
      {/* ------------------------------------------------------------- */}
      <section id="capabilities" style={{
        padding: '80px 24px',
        backgroundColor: '#050B14',
        borderTop: '1px solid #1E293B',
        borderBottom: '1px solid #1E293B'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#F97316', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Built for Institutional Mining Workflows
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Platform Capabilities
            </h2>
            <p style={{ fontSize: '15px', color: '#94A3B8', maxWidth: '640px', margin: '12px auto 0' }}>
              Precision tools engineered specifically for statutory compliance, geological analysis, and executive decision-making.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                title: 'Document Intelligence',
                desc: 'Upload, inspect, and organize official CIL/CMPDIL annual filings, production summaries, and safety bulletins with preserved page boundaries and extracted tables.',
                icon: FileText,
                badge: 'PyMuPDF Engine'
              },
              {
                title: 'Semantic & Hybrid Search',
                desc: 'Query across thousands of technical paragraphs using natural language. Combines dense semantic vector proximity with lexical token match via Reciprocal Rank Fusion.',
                icon: Search,
                badge: 'Hybrid RRF'
              },
              {
                title: 'Evidence-Grounded AI Synthesis',
                desc: 'Generates answers strictly substantiated by indexed report passages. Enforces multi-factor confidence scoring and rejects queries lacking documentary evidence.',
                icon: Bot,
                badge: 'Anti-Hallucination'
              },
              {
                title: 'Source & Page Traceability',
                desc: 'Every factual output cites the exact document title, page number, and verbatim passage, giving audit teams statutory confidence and complete provenance.',
                icon: FileCheck2,
                badge: 'Full Lineage'
              },
              {
                title: 'Statutory Report Generation',
                desc: 'Compiles structured 9-section executive briefs and parliamentary question briefs with direct export to Microsoft Word (.docx) and tabular KPI CSV.',
                icon: Download,
                badge: 'DOCX / CSV Export'
              },
              {
                title: 'Cross-Document Intelligence',
                desc: 'Compare multi-year operational statistics and production trajectories across subsidiaries (MCL, SECL, NCL, CCL, WCL, BCCL, ECL) without manual reconciliation.',
                icon: GitBranch,
                badge: 'Multi-Subsidiary'
              }
            ].map((cap, i) => (
              <div key={i} style={{
                backgroundColor: '#0B132B',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F97316'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#1E293B'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(249, 115, 22, 0.1)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <cap.icon size={20} color="#F97316" />
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', backgroundColor: '#1E293B', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      {cap.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 10px' }}>
                    {cap.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                    {cap.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* HOW COALINTEL WORKS */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F97316', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Systematic Data Flow
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            How CoalIntel Operates
          </h2>
          <p style={{ fontSize: '15px', color: '#94A3B8', maxWidth: '640px', margin: '12px auto 0' }}>
            From raw statutory PDF filings to audit-ready executive intelligence in six deterministic stages.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {[
            {
              step: 'Step 1',
              title: 'Ingest Reports',
              desc: 'Official PDF reports are uploaded through the secure portal with SHA-256 deduplication and PDF magic byte verification.'
            },
            {
              step: 'Step 2',
              title: 'Extract & Linearize',
              desc: 'PyMuPDF parses every page, preserving physical page numbers and transforming multi-column tables into tabular Markdown.'
            },
            {
              step: 'Step 3',
              title: 'Embed & Store in Atlas',
              desc: 'Text chunks of 500 tokens with 100-token overlap are converted to 384-D normalized vectors and stored in MongoDB Atlas.'
            },
            {
              step: 'Step 4',
              title: 'Retrieve Relevant Evidence',
              desc: 'Hybrid retrieval evaluates dense cosine similarity and lexical regex matches with reciprocal rank fusion (k=60).'
            },
            {
              step: 'Step 5',
              title: 'Synthesize Grounded Response',
              desc: 'AI provider (Gemini Flash or local Ollama) drafts technical answers strictly utilizing passages above the 0.45 confidence floor.'
            },
            {
              step: 'Step 6',
              title: 'Verify Lineage & Audit',
              desc: 'Review verbatim chunk snippets, verify page citations in the evidence drawer, and log immutable actions into the audit trail.'
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#F97316',
                letterSpacing: '0.8px',
                marginBottom: '8px'
              }}>
                {item.step}
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.55 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* WHY COALINTEL (PROBLEM & SOLUTION) */}
      {/* ------------------------------------------------------------- */}
      <section id="why-coalintel" style={{
        padding: '80px 24px',
        backgroundColor: '#050B14',
        borderTop: '1px solid #1E293B',
        borderBottom: '1px solid #1E293B'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#F97316', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Problem & Solution
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Why CoalIntel?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {/* The Problem */}
            <div style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '14px',
              padding: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  THE CHALLENGE
                </span>
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px' }}>
                Disconnected Silos & Static PDFs
              </h3>
              <ul style={{ paddingLeft: '18px', color: '#94A3B8', fontSize: '13.5px', lineHeight: 1.7, margin: 0 }}>
                <li>Geological surveys, safety logs, and production summaries are trapped in dense PDF formats.</li>
                <li>Manual retrieval across multi-year subsidiary filings takes hours and invites human oversight.</li>
                <li>Generic AI assistants hallucinate numbers or cite fabricated page numbers.</li>
                <li>No automated cross-document discrepancy or contradiction detection.</li>
              </ul>
            </div>

            {/* The Solution */}
            <div style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  THE COALINTEL ADVANTAGE
                </span>
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px' }}>
                Unified Evidence-Grounded Workspace
              </h3>
              <ul style={{ paddingLeft: '18px', color: '#94A3B8', fontSize: '13.5px', lineHeight: 1.7, margin: 0 }}>
                <li>100% verified source & page traceability for every generated statement.</li>
                <li>Strict anti-hallucination policy: rejects queries with insufficient documentary evidence.</li>
                <li>Multi-subsidiary KPI comparison across CIL, CMPDI, MCL, SECL, NCL, and more.</li>
                <li>Government & parliamentary briefing formats with automated DOCX export.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECURITY & TRUST SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="security" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F97316', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Institutional Governance
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            Authoritative Role-Based Access Control (RBAC)
          </h2>
          <p style={{ fontSize: '15px', color: '#94A3B8', maxWidth: '640px', margin: '12px auto 0' }}>
            Access permissions are strictly determined by the backend database upon authentication.
          </p>
        </div>

        <div style={{
          backgroundColor: '#0B132B',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '36px 32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#10B981" />
                Backend-Determined Authority
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                The frontend never trusts client-supplied roles. All route guards and API operations validate signed JWT claims reconciled with the database.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="#38BDF8" />
                Protected Endpoints (401 / 403)
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                Sensitive operations (document upload, reindexing, deletion, user administration) check granular permission sets at the API dependency layer.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#FBBF24" />
                Sanitized Immutable Audit Logs
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                Every critical event (logins, uploads, deletions, role changes) is recorded into an append-only audit trail with all credentials strictly redacted.
              </p>
            </div>
          </div>

          {/* Role Summary Pill Box */}
          <div style={{
            borderTop: '1px solid #1E293B',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ fontSize: '13px', color: '#CBD5E1' }}>
              Standard Organizational Roles:
              <span style={{ color: '#F97316', fontWeight: 700, marginLeft: '8px' }}>ADMIN</span> • 
              <span style={{ color: '#38BDF8', fontWeight: 700, marginLeft: '8px' }}>ANALYST</span> • 
              <span style={{ color: '#10B981', fontWeight: 700, marginLeft: '8px' }}>VIEWER</span>
            </div>

            <button
              onClick={onNavigateLogin}
              style={{
                padding: '8px 18px',
                backgroundColor: 'transparent',
                color: '#F97316',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Access Protected Workspace</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FINAL CALL TO ACTION */}
      {/* ------------------------------------------------------------- */}
      <section style={{
        padding: '70px 24px',
        backgroundColor: '#0B132B',
        borderTop: '1px solid #1E293B',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#F8FAFC', margin: '0 0 14px' }}>
            Ready to Explore CoalIntel?
          </h2>
          <p style={{ fontSize: '14.5px', color: '#94A3B8', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Access verified mining intelligence, geological documentation, and executive reporting.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateSignup}
              style={{
                padding: '12px 26px',
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
            <button
              onClick={onNavigateLogin}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#E2E8F0',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer style={{
        padding: '36px 24px',
        borderTop: '1px solid #1E293B',
        backgroundColor: '#050B14',
        color: '#64748B',
        fontSize: '12px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '14px', marginBottom: '4px' }}>
              COALINTEL
            </div>
            <div>
              AI-Powered Geological, Mining & Statutory Reporting Solution (SIH26023)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="#platform" style={{ color: '#94A3B8', textDecoration: 'none' }}>Platform</a>
            <a href="#capabilities" style={{ color: '#94A3B8', textDecoration: 'none' }}>Capabilities</a>
            <span style={{ color: '#334155' }}>•</span>
            <button
              onClick={onNavigateLogin}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, fontSize: '12px' }}
            >
              Sign In
            </button>
            <button
              onClick={onNavigateSignup}
              style={{ background: 'none', border: 'none', color: '#F97316', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 600 }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
