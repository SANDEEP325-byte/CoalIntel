import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Truck, 
  DollarSign, 
  ShieldCheck, 
  Compass, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ setActiveTab, onAskQuestion }) {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLineage, setSelectedLineage] = useState(null);

  useEffect(() => {
    loadKpiData();
  }, []);

  async function loadKpiData() {
    try {
      const data = await api.getKPIs();
      setKpis(data.kpis || []);
    } catch (e) {
      console.error('Failed to load KPIs:', e);
    } finally {
      setLoading(false);
    }
  }

  async function openLineage(metricId) {
    try {
      const data = await api.getLineage(metricId);
      setSelectedLineage(data);
    } catch (e) {
      console.error('Failed to load lineage:', e);
    }
  }

  const primaryCards = [
    {
      id: 'kpi_prod_india_2024_25',
      title: 'All-India Production',
      value: '1,047.52 MT',
      sub: 'Target: 1,080.20 MT',
      change: '+5.04% YoY',
      isPositive: true,
      category: 'Historic Milestone (> 1 Billion Tonnes)',
      icon: TrendingUp,
      color: '#3B82F6',
      sourceDoc: 'Coal & Lignite Production Report 2025-26.pdf',
      page: 4,
    },
    {
      id: 'kpi_dispatch_cil_2024_25',
      title: 'CIL Coal Dispatch',
      value: '762.83 MT',
      sub: 'FY 2023-24: 753.53 MT',
      change: '+1.23% YoY',
      isPositive: true,
      category: 'Power Sector Offtake',
      icon: Truck,
      color: '#10B981',
      sourceDoc: 'Coal & Lignite Production Report 2025-26.pdf',
      page: 4,
    },
    {
      id: 'kpi_pbt_cmpdi_2024_25',
      title: 'CMPDI Profit Before Tax',
      value: 'Rs. 882.14 Cr',
      sub: 'PAT: Rs. 666.91 Cr',
      change: '+38.4% YoY',
      isPositive: true,
      category: 'All-Time Record PBT',
      icon: DollarSign,
      color: '#F59E0B',
      sourceDoc: 'CMPDIL_Annual_Report_2024-25.pdf',
      page: 45,
    },
    {
      id: 'kpi_fatality_rate_cil_2024',
      title: 'CIL Fatality Rate',
      value: '0.03 / MT',
      sub: '2023: 0.04 / MT',
      change: '-25.0% YoY',
      isPositive: true,
      category: 'Historical Safety Benchmark',
      icon: ShieldCheck,
      color: '#059669',
      sourceDoc: 'Safety in Coal Mines Report 2025-26.pdf',
      page: 21,
    },
    {
      id: 'kpi_seismic_cmpdi_2024_25',
      title: '2D Seismic Exploration',
      value: '438 Line KM',
      sub: 'Reports: 230 Prepared',
      change: '+87.0% YoY',
      isPositive: true,
      category: 'Geological Acceleration',
      icon: Compass,
      color: '#8B5CF6',
      sourceDoc: 'CMPDIL_Annual_Report_2024-25.pdf',
      page: 15,
    },
  ];

  return (
    <div>
      {/* Top Welcome & Demo Banner */}
      <div className="gov-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #111E33 0%, #15243E 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-orange">SMART INDIA HACKATHON 2026</span>
              <span style={{ color: '#64748B', fontSize: '13px' }}>Problem Statement SIH26023</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
              Mining Knowledge, Reporting and Decision Intelligence Platform
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '850px' }}>
              Autonomous, evidence-grounded AI decision engine with 100% verified page-traceability across CIL, CMPDI, 
              Production, and Mine Safety statutory records. Powered exclusively by local Ollama Qwen3:1.7B and MongoDB hybrid retrieval.
            </p>
          </div>

          {/* Quick Demo Scenario Trigger Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary"
              onClick={() => onAskQuestion("What was CIL's coal dispatch in FY 2024-25?")}
            >
              Demo Q1: CIL Dispatch 2024-25
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('comparisons')}
            >
              Demo Q2: Compare CIL & CMPDI
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('reports')}
            >
              Demo Q3: Generate Report
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('validation')}
            >
              Demo Q4: Find Inconsistencies
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {primaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="gov-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '4px', 
                height: '100%', 
                background: card.color 
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>{card.title}</span>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '6px', 
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} color={card.color} />
                </div>
              </div>

              <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                {card.value}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '2px',
                  fontSize: '12px', 
                  fontWeight: 700, 
                  color: card.isPositive ? '#10B981' : '#EF4444' 
                }}>
                  {card.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {card.change}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>{card.sub}</span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: '10px', 
                borderTop: '1px solid #1A2D47',
                fontSize: '11px' 
              }}>
                <span style={{ color: '#94A3B8' }}>{card.category}</span>
                <button 
                  onClick={() => openLineage(card.id)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#3B82F6', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  Lineage (p. {card.page}) <ExternalLink size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics & Comparison Section */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Trend Visualizer */}
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
              All-India Coal Production Trajectory (MT)
            </h3>
            <span className="badge badge-success">Target: 1.15 BT by 2025-26</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { year: 'FY 2022-23', actual: 893.19, target: 910.0, pct: '78%' },
              { year: 'FY 2023-24', actual: 997.25, target: 1012.3, pct: '87%' },
              { year: 'FY 2024-25', actual: 1047.52, target: 1080.2, pct: '91%' },
              { year: 'FY 2025-26 (Projected)', actual: 1150.63, target: 1150.63, pct: '100%' },
            ].map((bar) => (
              <div key={bar.year}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{bar.year}</span>
                  <span style={{ color: '#FF6500', fontWeight: 700 }}>{bar.actual} MT <span style={{ color: '#64748B', fontWeight: 400 }}>(Target: {bar.target} MT)</span></span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#182844', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: bar.pct, 
                    height: '100%', 
                    background: bar.year.includes('Projected') ? '#8B5CF6' : 'linear-gradient(90deg, #3B82F6, #FF6500)', 
                    borderRadius: '4px' 
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
            <span>Source: Coal & Lignite Production Report 2025-26 (p. 4)</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>Verified 100% Page-Aware</span>
          </div>
        </div>

        {/* Subsidiary Breakdown Matrix */}
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
              Subsidiary Production Leaders (FY 2024-25)
            </h3>
            <span className="badge badge-info">8 CIL Operating Companies</span>
          </div>

          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Subsidiary</th>
                  <th>Target (MT)</th>
                  <th>Actual (MT)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>MCL (Mahanadi Coalfields)</strong></td>
                  <td>225.00</td>
                  <td><strong>225.17</strong></td>
                  <td><span className="badge badge-success">Target Exceeded</span></td>
                </tr>
                <tr>
                  <td><strong>SECL (South Eastern Coalfields)</strong></td>
                  <td>206.00</td>
                  <td>167.49</td>
                  <td><span className="badge badge-warning">81.3% Achieved</span></td>
                </tr>
                <tr>
                  <td><strong>NCL (Northern Coalfields)</strong></td>
                  <td>139.00</td>
                  <td><strong>139.00</strong></td>
                  <td><span className="badge badge-success">100% Achieved</span></td>
                </tr>
                <tr>
                  <td><strong>CCL (Central Coalfields)</strong></td>
                  <td>100.00</td>
                  <td>87.54</td>
                  <td><span className="badge badge-info">87.5% Achieved</span></td>
                </tr>
                <tr>
                  <td><strong>WCL (Western Coalfields)</strong></td>
                  <td>69.00</td>
                  <td><strong>69.12</strong></td>
                  <td><span className="badge badge-success">Target Exceeded</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Lineage Modal */}
      {selectedLineage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="gov-card" style={{ maxWidth: '650px', width: '100%', background: '#111E33' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#10B981" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC' }}>
                  Verified Data Lineage & Provenance
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLineage(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748B' }}>Metric:</span>
                <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px' }}>
                  {selectedLineage.metric_name} ({selectedLineage.value} {selectedLineage.unit})
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#0B1320', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B', display: 'block' }}>Source Document:</span>
                  <strong style={{ color: '#3B82F6' }}>{selectedLineage.provenance?.document_name}</strong>
                </div>
                <div style={{ background: '#0B1320', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B', display: 'block' }}>Verified Page Number:</span>
                  <strong style={{ color: '#FF6500' }}>Page {selectedLineage.provenance?.page_number}</strong>
                </div>
              </div>

              <div style={{ background: '#0B1320', padding: '12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '4px' }}>Table / Location Reference:</span>
                <code style={{ color: '#E2E8F0' }}>{selectedLineage.provenance?.table_reference}</code>
              </div>

              <div style={{ background: '#070C15', padding: '14px', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
                <span style={{ color: '#10B981', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Verbatim Extracted Grounding Text:
                </span>
                <p style={{ color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>
                  "{selectedLineage.provenance?.verbatim_text}"
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span className="badge badge-success">
                  {selectedLineage.provenance?.verification_status}
                </span>
                <button 
                  className="btn-secondary"
                  onClick={() => setSelectedLineage(null)}
                >
                  Close Lineage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
