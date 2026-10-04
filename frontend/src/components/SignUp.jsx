import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check
} from 'lucide-react';
import { api } from '../api';

export default function SignUp({ onNavigateLogin, onNavigateHome }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [allowSignup, setAllowSignup] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.getRegistrationStatus();
        if (res && typeof res.allow_public_signup === 'boolean') {
          setAllowSignup(res.allow_public_signup);
        }
      } catch (_) {
        // Default to true if status check fails
      }
    }
    checkStatus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Form validations
    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid official email address.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password: password,
      });

      setSuccessMsg(res.message || 'Account created successfully. Please sign in to continue.');
    } catch (err) {
      console.error('Registration error:', err);
      const detail = err.message || 'Account registration failed. Please try again.';
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
      padding: '28px 16px',
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

      {/* Main 2-Column Split Card */}
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
        {/* LEFT COLUMN: REGISTRATION CONTEXT & GOVERNANCE */}
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
              Join the CoalIntel Mining Intelligence Network.
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 28px', lineHeight: 1.6 }}>
              Create an institutional account to query statutory mining reports, explore operational analytics, and verify evidence.
            </p>

            {/* Registration Role Governance Notice */}
            <div style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10B981" />
                Default Role: VIEWER
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Public registrations are automatically granted verified <strong style={{ color: '#10B981' }}>VIEWER</strong> status (read-only access to documents, AI Copilot, reports, and insights). Elevated roles (<strong style={{ color: '#38BDF8' }}>ANALYST</strong> or <strong style={{ color: '#F97316' }}>ADMIN</strong>) are assigned by institutional administrators via the Users & Roles console.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Full access to AI Mining Copilot and hybrid search',
                'Inspect verbatim evidence passages and physical page numbers',
                'Access cross-subsidiary production & safety analytics',
                'View generated executive briefs and parliamentary reports'
              ].map((benefit, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: '#CBD5E1' }}>
                  <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid #1E293B',
            color: '#64748B',
            fontSize: '11px',
            lineHeight: 1.4
          }}>
            Institutional compliance: All operations are recorded into immutable audit logs.
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REGISTRATION FORM */}
        {/* ========================================================= */}
        <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px', color: '#F8FAFC' }}>
              Create your CoalIntel account
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
              New accounts are created with Viewer access. Additional permissions can be assigned by an authorized administrator.
            </p>
          </div>

          {/* Registration Restricted Warning */}
          {!allowSignup && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
              color: '#F87171',
              fontSize: '13px',
              lineHeight: 1.5
            }}>
              <strong>Registration Restricted:</strong> New public account creation is currently disabled. Please contact a CoalIntel administrator to provision your institutional credentials.
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={28} color="#10B981" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34D399', marginBottom: '6px' }}>
                Account Created Successfully!
              </div>
              <p style={{ fontSize: '12.5px', color: '#CBD5E1', margin: '0 0 14px' }}>
                {successMsg}
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#10B981',
                  color: '#070E18',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Proceed to Sign In
              </button>
            </div>
          )}

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
              marginBottom: '18px',
              color: '#F87171',
              fontSize: '12.5px',
              lineHeight: 1.45
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {!successMsg && allowSignup && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#0B132B',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  padding: '0 10px'
                }}>
                  <User size={15} color="#64748B" style={{ flexShrink: 0, marginRight: '8px' }} />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    disabled={loading}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ width: '100%', height: '38px', background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Email & Username */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div>
                  <label htmlFor="signup-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                    Official Email *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}>
                    <Mail size={15} color="#64748B" style={{ flexShrink: 0, marginRight: '8px' }} />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@coalintel.gov.in"
                      style={{ width: '100%', height: '38px', background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-username" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                    Username *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}>
                    <User size={15} color="#64748B" style={{ flexShrink: 0, marginRight: '8px' }} />
                    <input
                      id="signup-username"
                      type="text"
                      autoComplete="username"
                      required
                      disabled={loading}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      style={{ width: '100%', height: '38px', background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div>
                  <label htmlFor="signup-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                    Password *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}>
                    <Lock size={15} color="#64748B" style={{ flexShrink: 0, marginRight: '8px' }} />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      style={{ width: '100%', height: '38px', background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '13px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-confirm" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '5px' }}>
                    Confirm Password *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}>
                    <Lock size={15} color="#64748B" style={{ flexShrink: 0, marginRight: '8px' }} />
                    <input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      style={{ width: '100%', height: '38px', background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: '42px',
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
                  marginTop: '8px',
                  transition: 'background-color 0.15s ease',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)'
                }}
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* Switch to Sign In */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #1E293B',
            textAlign: 'center',
            fontSize: '13px',
            color: '#94A3B8'
          }}>
            Already have an account?{' '}
            <button
              onClick={onNavigateLogin}
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
              Sign In
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
