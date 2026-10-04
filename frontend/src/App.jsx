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
import UsersAndRoles from './components/UsersAndRoles';
import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import { api, getStoredToken } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthData, setHealthData] = useState(null);
  const [initialQuestion, setInitialQuestion] = useState('');
  const [scopedDoc, setScopedDoc] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unauthView, setUnauthView] = useState('landing'); // 'landing' | 'login' | 'signup'

  useEffect(() => {
    // Check URL path for direct routes
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('login')) {
      setUnauthView('login');
    } else if (path.includes('signup') || path.includes('register')) {
      setUnauthView('signup');
    }

    fetchHealth();
    initAuth();

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

  async function initAuth() {
    setAuthLoading(true);
    try {
      const token = getStoredToken();
      if (token) {
        const user = await api.getMe();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.warn('Session verification failed, requiring sign in:', e);
      try {
        await api.logout();
      } catch (_) {}
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch (_) {}
    setCurrentUser(null);
    setUnauthView('landing');
    setActiveTab('dashboard');
  }

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

  function handleAskFromAnywhere(queryText, docScope = null) {
    setInitialQuestion(queryText);
    setScopedDoc(docScope);
    setActiveTab('assistant');
  }

  // 1. Session verification loading state
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#070E18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        gap: '14px',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(249, 115, 22, 0.2)',
          borderTopColor: '#F97316',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#CBD5E1' }}>
          Verifying secure institutional session...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Entry Flow: Landing Page -> Login / Sign Up
  if (!currentUser) {
    if (unauthView === 'login') {
      return (
        <Login
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
          }}
          onNavigateSignup={() => setUnauthView('signup')}
          onNavigateHome={() => setUnauthView('landing')}
        />
      );
    }

    if (unauthView === 'signup') {
      return (
        <SignUp
          onNavigateLogin={() => setUnauthView('login')}
          onNavigateHome={() => setUnauthView('landing')}
        />
      );
    }

    // Default entry: Professional Landing Page
    return (
      <LandingPage
        onNavigateLogin={() => setUnauthView('login')}
        onNavigateSignup={() => setUnauthView('signup')}
      />
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      healthData={healthData}
      currentUser={currentUser}
      onLogout={handleLogout}
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
          currentUser={currentUser}
          onAskQuestion={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'assistant' && (
        <AIAssistant 
          initialQuestion={initialQuestion} 
          onSwitchTab={setActiveTab}
          scopedDoc={scopedDoc}
          onClearScope={() => setScopedDoc(null)}
        />
      )}

      {activeTab === 'analytics' && (
        <Analytics 
          onSelectLineage={() => setActiveTab('sources')} 
          onAskQuestion={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'reports' && (
        <Reports currentUser={currentUser} />
      )}

      {activeTab === 'decision_brief' && (
        <DecisionBrief 
          onSwitchToCopilot={handleAskFromAnywhere} 
        />
      )}

      {activeTab === 'users_roles' && (
        currentUser?.role === 'ADMIN' ? (
          <UsersAndRoles />
        ) : (
          <div className="p-8 text-center bg-slate-900/90 border border-red-500/30 rounded-2xl max-w-xl mx-auto my-16 shadow-2xl backdrop-blur-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              403
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Access Denied (403 Forbidden)</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Institutional User Management and RBAC permissions are strictly restricted to CoalIntel Administrators. Your role (<span className="text-amber-400 font-semibold">{currentUser?.role || 'VIEWER'}</span>) does not have authorization to view or modify user accounts.
            </p>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              Return to Dashboard
            </button>
          </div>
        )
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
