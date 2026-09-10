import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import AIAssistant from './components/AIAssistant';
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import Comparisons from './components/Comparisons';
import DataValidation from './components/DataValidation';
import Topics from './components/Topics';
import Sources from './components/Sources';
import Parliamentary from './components/Parliamentary';
import { api } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthData, setHealthData] = useState(null);
  const [initialQuestion, setInitialQuestion] = useState('');

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    try {
      const data = await api.getHealth();
      setHealthData(data);
    } catch (e) {
      console.warn('Backend health check error:', e);
      setHealthData({
        status: 'warning',
        database_connected: false,
        indexed_chunks: 1504,
        llm_model: 'qwen3:1.7b',
        embedding_model: 'sentence-transformers/all-MiniLM-L6-v2'
      });
    }
  }

  function handleAskFromDashboard(queryText) {
    setInitialQuestion(queryText);
    setActiveTab('assistant');
  }

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthData={healthData} 
        onRefresh={fetchHealth} 
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onAskQuestion={handleAskFromDashboard} 
          />
        )}
        {activeTab === 'documents' && <Documents />}
        {activeTab === 'assistant' && (
          <AIAssistant 
            initialQuestion={initialQuestion} 
            onSwitchTab={setActiveTab} 
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics 
            onSelectLineage={(metricId) => setActiveTab('sources')} 
          />
        )}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'comparisons' && <Comparisons />}
        {activeTab === 'validation' && <DataValidation />}
        {activeTab === 'topics' && <Topics />}
        {activeTab === 'sources' && <Sources />}
        {activeTab === 'parliamentary' && <Parliamentary />}
      </main>

      <footer style={{
        background: '#070C15',
        borderTop: '1px solid #1E3A5F',
        padding: '16px 32px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748B',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong style={{ color: '#94A3B8' }}>CoalIntel Decision Intelligence Platform</strong> — Smart India Hackathon 2026 (SIH26023)
          </div>
          <div>
            Ministry of Coal • CMPDI / CIL Reporting Solution • 100% Local RAG with Ollama Qwen3:1.7B & All-MiniLM-L6-v2
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
