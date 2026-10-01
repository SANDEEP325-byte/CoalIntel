import React, { useState, useEffect } from 'react';
import './App.css';
import AppShell from './components/common/AppShell';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import AIAssistant from './components/AIAssistant';
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import DecisionBrief from './components/DecisionBrief';
import Settings from './components/Settings';
import GlobalSearch from './components/GlobalSearch';
import DemoMode from './components/DemoMode';
import Comparisons from './components/Comparisons';
import DataValidation from './components/DataValidation';
import Sources from './components/Sources';
import Parliamentary from './components/Parliamentary';
import { api } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthData, setHealthData] = useState(null);
  const [initialQuestion, setInitialQuestion] = useState('');

  useEffect(() => {
    fetchHealth();

    // Global shortcut Ctrl+K to open search
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('search');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        indexed_chunks: 1518,
        llm_model: 'gemini-3.6-flash',
        embedding_model: 'sentence-transformers/all-MiniLM-L6-v2',
        ai_provider: 'gemini'
      });
    }
  }

  function handleAskFromAnywhere(queryText) {
    setInitialQuestion(queryText);
    setActiveTab('assistant');
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      healthData={healthData}
    >
      {/* 7 Primary Views */}
      {activeTab === 'dashboard' && (
        <Dashboard 
          setActiveTab={setActiveTab} 
          onAskQuestion={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'documents' && (
        <Documents 
          onAskQuestion={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'assistant' && (
        <AIAssistant 
          initialQuestion={initialQuestion} 
          onSwitchTab={setActiveTab} 
        />
      )}

      {activeTab === 'analytics' && (
        <Analytics 
          onSelectLineage={() => setActiveTab('sources')} 
          onAskQuestion={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'reports' && (
        <Reports />
      )}

      {activeTab === 'decision_brief' && (
        <DecisionBrief 
          onSwitchToCopilot={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'settings' && (
        <Settings />
      )}

      {/* Specialized Operations */}
      {activeTab === 'search' && (
        <GlobalSearch 
          onSelectResult={(res) => handleAskFromAnywhere(`What does the report say about ${res.text?.slice(0, 80)}?`)} 
        />
      )}

      {activeTab === 'comparisons' && (
        <Comparisons />
      )}

      {activeTab === 'validation' && (
        <DataValidation />
      )}

      {activeTab === 'sources' && (
        <Sources />
      )}

      {activeTab === 'parliamentary' && (
        <Parliamentary />
      )}

      {activeTab === 'demo_mode' && (
        <DemoMode 
          onNavigateTab={setActiveTab} 
          onAskQuestion={handleAskFromAnywhere} 
        />
      )}
    </AppShell>
  );
}

export default App;
