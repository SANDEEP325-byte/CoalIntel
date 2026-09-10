import React, { useState, useEffect } from 'react';
import { 
  Tags, 
  Cloud, 
  Clock, 
  Layers, 
  Filter, 
  Calendar,
  Compass,
  FileText
} from 'lucide-react';
import { api } from '../api';

export default function Topics() {
  const [topicData, setTopicData] = useState(null);
  const [wordCloud, setWordCloud] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'wordcloud' | 'timeline'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [selectedYear]);

  async function loadAll() {
    setLoading(true);
    try {
      const [tRes, wRes, timeRes] = await Promise.all([
        api.getTopics(),
        api.getWordCloud(null, null, 60),
        api.getTimeline(selectedYear || null)
      ]);
      setTopicData(tRes);
      setWordCloud(wRes.words || []);
      setTimeline(timeRes.events || []);
    } catch (e) {
      console.error('Failed to load topics/timeline:', e);
    } finally {
      setLoading(false);
    }
  }

  const timelineYears = ['1975', '2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26'];

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Tags size={22} color="#FF6500" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            Topic Identification, Word Cloud & Historical Timeline (Features 8, 9, 10)
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px' }}>
          Unsupervised topic classification across indexed reports, mining frequency clouds, and chronological policy milestones.
        </p>
      </div>

      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={activeTab === 'topics' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('topics')}
        >
          <Layers size={16} />
          Topic Breakdown
        </button>

        <button
          className={activeTab === 'wordcloud' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('wordcloud')}
        >
          <Cloud size={16} />
          Word Cloud
        </button>

        <button
          className={activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={16} />
          Historical Timeline (1975 - 2026)
        </button>
      </div>

      {/* TAB 1: Topics Breakdown */}
      {activeTab === 'topics' && topicData && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
              Mining Topic Coverage Across {topicData.total_chunks_analyzed} Indexed Chunks
            </h3>
            <span className="badge badge-info">8 Dominant Thematic Categories</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topicData.topics?.map((t) => (
              <div key={t.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: t.color }}></span>
                    <strong style={{ color: '#F8FAFC' }}>{t.name}</strong>
                  </div>
                  <span style={{ color: '#94A3B8' }}>
                    <strong style={{ color: '#F1F5F9' }}>{t.count}</strong> chunks ({t.percentage}%)
                  </span>
                </div>

                <div style={{ width: '100%', height: '10px', background: '#0B1320', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.max(5, t.percentage)}%`, 
                    height: '100%', 
                    background: t.color, 
                    borderRadius: '5px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Word Cloud */}
      {activeTab === 'wordcloud' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
              Mining Frequency Cloud (Stopwords Filtered)
            </h3>
            <span className="badge badge-orange">{wordCloud.length} Prominent Mining Terms</span>
          </div>

          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '30px 20px',
            background: '#0B1320',
            borderRadius: '8px',
            minHeight: '350px'
          }}>
            {wordCloud.map((w, idx) => {
              const colors = ['#FF6500', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#38BDF8'];
              const col = colors[idx % colors.length];
              return (
                <span
                  key={idx}
                  style={{
                    fontSize: `${w.size}px`,
                    fontWeight: w.size > 24 ? 800 : w.size > 18 ? 600 : 500,
                    color: col,
                    padding: '4px 8px',
                    cursor: 'default',
                    transition: 'transform 0.1s',
                    userSelect: 'none'
                  }}
                  title={`Term: ${w.text} (${w.value} occurrences)`}
                >
                  {w.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Historical Timeline */}
      {activeTab === 'timeline' && (
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>
              Chronological Mining & Governance Timeline (1975 — 2026)
            </h3>

            {/* Year Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedYear('')}
                style={{
                  background: selectedYear === '' ? '#FF6500' : '#182844',
                  color: '#FFF', border: 'none', borderRadius: '4px',
                  padding: '3px 10px', fontSize: '12px', cursor: 'pointer'
                }}
              >
                All Years
              </button>
              {timelineYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  style={{
                    background: selectedYear === yr ? '#FF6500' : '#182844',
                    color: '#FFF', border: 'none', borderRadius: '4px',
                    padding: '3px 10px', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '20px' }}>
            <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#1E3A5F' }} />

            {timeline.map((item, idx) => (
              <div key={idx} style={{ position: 'relative', paddingLeft: '20px' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '-18px', 
                  top: '4px', 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: '#FF6500', 
                  border: '2px solid #0B1320' 
                }} />

                <div style={{ background: '#0B1320', padding: '16px', borderRadius: '8px', border: '1px solid #14243B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-orange">{item.period || item.year}</span>
                      <strong style={{ color: '#F1F5F9', fontSize: '15px' }}>{item.title}</strong>
                    </div>
                    <span className="badge badge-info">{item.category}</span>
                  </div>

                  <p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: '1.6', marginBottom: '8px' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                    <span>Citation: {item.source}</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>Impact: {item.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
