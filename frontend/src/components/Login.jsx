import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Search,
  Bot,
  FileCheck2,
  CheckCircle2,
  Check,
  Cpu
} from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess, onNavigateSignup, onNavigateHome }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(username.trim(), password);
      if (res && res.user) {
        onLoginSuccess(res.user);
      } else {
        throw new Error('Authentication succeeded but user profile was not returned.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.message || 'Authentication failed. Please check your credentials.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070E18',
      backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(30, 58, 138, 0.12), transparent 75%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
      color: '#F8FAFC',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      boxSizing: 'border-box'
    }}>
      {/* Top back navigation */}
      <div style={{ width: '100%', maxWidth: '980px', marginBottom: '18px' }}>
        <button
          onClick={onNavigateHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '4px 0',
            fontWeight: 500,
            transition: 'color 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#F8FAFC'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
        >
          <ArrowLeft size={16} />
          <span>Back to CoalIntel Home</span>
        </button>
      </div>

      {/* Main 2-Column Split Authentication Card */}
      <div style={{
        width: '100%',
        maxWidth: '980px',
        backgroundColor: '#0F172A',
        border: '1px solid #1E293B',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        overflow: 'hidden'
      }}>
        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING & PRODUCT CONTEXT */}
        {/* ========================================================= */}
        <div style={{
          backgroundColor: '#0B132B',
          padding: '40px 36px',
          borderRight: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Brand Logo & Name */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <img
                src="/coalintel-icon.png"
                alt="CoalIntel"
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#F8FAFC' }}>COAL</span>
                  <span style={{ color: '#F97316' }}>INTEL</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, letterSpacing: '0.4px', marginTop: '3px' }}>
                  MINING DECISION INTELLIGENCE
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 10px', lineHeight: 1.3 }}>
              Access your institutional mining workspace.
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 28px', lineHeight: 1.6 }}>
              One integrated platform for statutory mining documents, verified evidence, and automated reporting.
            </p>

            {/* Core Capability Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {[
                { title: 'Evidence-Grounded AI', desc: 'Factual answers bound to indexed report passages with confidence scoring' },
                { title: 'Document Intelligence', desc: 'PyMuPDF page-aware extraction with multi-column table linearization' },
                { title: 'Source & Page Traceability', desc: 'Direct document, page number, and chunk citation verification' },
                { title: 'Authoritative RBAC', desc: 'Backend-determined roles and permission sets for institutional safety' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Check size={11} color="#10B981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>{item.title}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Trust Footer Note */}
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748B',
            fontSize: '11px'
          }}>
            <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0 }} />
            <span>Strict Role-Based Access Control enforced by backend API.</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AUTHENTICATION FORM */}
        {/* ========================================================= */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px', color: '#F8FAFC' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              Sign in to continue to your authorized CoalIntel workspace.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '11px 14px',
              marginBottom: '20px',
              color: '#F87171',
              fontSize: '12.5px',
              lineHeight: 1.45
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Username / Email Field */}
            <div>
              <label
                htmlFor="login-username"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}
              >
                Email or Username
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#0B132B',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '0 12px',
                transition: 'border-color 0.15s ease'
              }}>
                <User size={16} color="#64748B" style={{ flexShrink: 0, marginRight: '10px' }} />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or username@coalintel.gov.in"
                  style={{
                    width: '100%',
                    height: '42px',
                    background: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}
              >
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#0B132B',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '0 12px',
                transition: 'border-color 0.15s ease'
              }}>
                <Lock size={16} color="#64748B" style={{ flexShrink: 0, marginRight: '10px' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  style={{
                    width: '100%',
                    height: '42px',
                    background: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: loading ? 'rgba(249, 115, 22, 0.6)' : '#F97316',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                marginTop: '6px',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Switch to Sign Up */}
          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #1E293B',
            textAlign: 'center',
            fontSize: '13px',
            color: '#94A3B8'
          }}>
            Don't have an account?{' '}
            <button
              onClick={onNavigateSignup}
              style={{
                background: 'none',
                border: 'none',
                color: '#F97316',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0 4px',
                fontSize: '13px'
              }}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Attribution */}
      <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '11.5px', color: '#475569' }}>
        CoalIntel • Statutory Geological & Mining Decision Solution (SIH26023)
      </div>
    </div>
  );
}
