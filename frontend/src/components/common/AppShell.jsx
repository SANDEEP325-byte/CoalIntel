import React from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ 
  activeTab, 
  setActiveTab, 
  healthData, 
  children 
}) {
  return (
    <div className="app-shell">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthData={healthData} 
      />

      <div className="app-main-wrapper">
        <main className="app-page-content">
          {children}
        </main>

        <footer className="app-footer">
          <div>
            <strong>CoalIntel</strong> — Statutory Knowledge Platform
          </div>
          <div>
            Smart India Hackathon (SIH26023)
          </div>
        </footer>
      </div>
    </div>
  );
}
