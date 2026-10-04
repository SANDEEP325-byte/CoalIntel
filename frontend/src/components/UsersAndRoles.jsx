import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  History,
  AlertCircle,
  Eye,
  KeyRound,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../api';

export default function UsersAndRoles() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'roles', 'audit'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Create User Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'ANALYST',
    full_name: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users' || activeTab === 'roles') {
        const [usersData, rolesData] = await Promise.all([
          api.getUsers(),
          api.getRoles(),
        ]);
        const userList = usersData?.users || (Array.isArray(usersData) ? usersData : []);
        setUsers(userList);

        let rolesMap = {};
        if (rolesData && Array.isArray(rolesData.roles)) {
          rolesData.roles.forEach((r) => {
            rolesMap[r.name] = r;
          });
        } else if (rolesData && typeof rolesData === 'object' && !rolesData.roles) {
          rolesMap = rolesData;
        }
        setRoles(rolesMap);
      } else if (activeTab === 'audit') {
        const logsData = await api.getAuditLogs(100, auditActionFilter || null);
        const logList = logsData?.logs || (Array.isArray(logsData) ? logsData : []);
        setAuditLogs(logList);
      }
    } catch (err) {
      console.error('Failed to load administrative data:', err);
      setError(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user) {
    const actionName = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} user "${user.username}"?`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      await api.updateUserStatus(user.id, !user.is_active);
      setSuccessMsg(`User "${user.username}" ${actionName}d successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      setError(err.message || `Failed to update status.`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRoleChange(user, newRole) {
    if (!newRole || newRole === user.role) return;
    if (!window.confirm(`Reassign role of "${user.username}" from ${user.role} to ${newRole}?`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      await api.updateUserRole(user.id, newRole);
      setSuccessMsg(`Role for "${user.username}" updated to ${newRole}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      setError(err.message || `Failed to update role.`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!createForm.username || !createForm.email || !createForm.password) {
      setError('Please fill all required fields.');
      return;
    }
    setActionLoading('create');
    setError(null);
    try {
      await api.createUser(createForm);
      setSuccessMsg(`User "${createForm.username}" created successfully.`);
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        role: 'ANALYST',
        full_name: '',
      });
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setActionLoading(null);
    }
  }

  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="users-roles-page" style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 218, 195, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="#F97316" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#161717ff', margin: 0 }}>
                Access Control & Governance
              </h1>
              <p style={{ fontSize: '13px', color: '#252a31ff', margin: '2px 0 0' }}>
                Role-Based Access Control (RBAC), User Management, and Immutable Audit Trail
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => loadData()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--navy-surface)',
              color: '#CBD5E1',
              border: '1px solid var(--navy-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: 'var(--accent-green)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <UserPlus size={15} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#4ADE80',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--navy-border)',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #F97316' : '2px solid transparent',
            color: activeTab === 'users' ? '#1c1d1fff' : '#141516ff',
            fontSize: '13.5px',
            fontWeight: activeTab === 'users' ? 600 : 500,
            cursor: 'pointer'
          }}
        >
          <Users size={16} />
          Users Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'roles' ? '2px solid #F97316' : '2px solid transparent',
            color: activeTab === 'roles' ? '#171818ff' : '#15181cff',
            fontSize: '13.5px',
            fontWeight: activeTab === 'roles' ? 600 : 500,
            cursor: 'pointer'
          }}
        >
          <ShieldCheck size={16} />
          Role Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid #F97316' : '2px solid transparent',
            color: activeTab === 'audit' ? '#161718ff' : '#15181cff',
            fontSize: '13.5px',
            fontWeight: activeTab === 'audit' ? 600 : 500,
            cursor: 'pointer'
          }}
        >
          <History size={16} />
          Audit Logs
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--navy-surface)',
              border: '1px solid var(--navy-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              flex: 1,
              maxWidth: '380px'
            }}>
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{
            backgroundColor: 'var(--navy-card)',
            border: '1px solid var(--navy-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--navy-surface)', borderBottom: '1px solid var(--navy-border)', color: '#94A3B8' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>User Profile</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Created</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#191b1cff' }}>
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--navy-border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111213ff' }}>
                          {user.full_name || user.username}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#1e1f21ff' }}>
                          @{user.username} • {user.email}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={user.role}
                          disabled={actionLoading === user.id || user.username === 'admin'}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          style={{
                            backgroundColor: 'var(--navy-surface)',
                            color: user.role === 'ADMIN' ? '#F97316' : user.role === 'ANALYST' ? '#38BDF8' : '#A78BFA',
                            border: '1px solid var(--navy-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: user.username === 'admin' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: user.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: user.is_active ? '#6da080ff' : '#F87171'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: user.is_active ? '#4ADE80' : '#F87171' }} />
                          {user.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#1a1b1dff', fontSize: '12px' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'System'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user.id}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: user.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              color: user.is_active ? '#F87171' : '#6da080ff',
                              border: user.is_active ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {Object.entries(roles).map(([roleKey, roleInfo]) => (
            <div
              key={roleKey}
              style={{
                backgroundColor: 'var(--navy-card)',
                border: '1px solid var(--navy-border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: roleKey === 'ADMIN' ? '#F97316' : roleKey === 'ANALYST' ? '#38BDF8' : '#A78BFA'
                }}>
                  {roleKey}
                </span>
                <span style={{ fontSize: '11px', color: '#111116ff', fontFamily: 'var(--font-mono)' }}>
                  {roleInfo.permissions?.length || 0} permissions
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#151617ff', margin: '0 0 16px' }}>
                {roleInfo.description}
              </p>
              <div style={{ borderTop: '1px solid var(--navy-border)', paddingTop: '12px', flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#151618ff', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Authorized Capabilities:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {roleInfo.permissions?.map((p) => (
                    <span
                      key={p}
                      style={{
                        padding: '3px 7px',
                        backgroundColor: '#b8c9e1ff',
                        border: '1px solid var(--navy-border)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#101316ff',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#06090dff' }}>
              <Filter size={14} />
              Filter by Action:
            </div>
            <select
              value={auditActionFilter}
              onChange={(e) => {
                setAuditActionFilter(e.target.value);
                loadData();
              }}
              style={{
                backgroundColor: 'var(--navy-surface)',
                color: '#CBD5E1',
                border: '1px solid var(--navy-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '12.5px'
              }}
            >
              <option value="">All Actions</option>
              <option value="auth.login">auth.login</option>
              <option value="query.execute">query.execute</option>
              <option value="document.search">document.search</option>
              <option value="report.generate">report.generate</option>
              <option value="document.upload">document.upload</option>
              <option value="document.delete">document.delete</option>
              <option value="document.reprocess">document.reprocess</option>
              <option value="document.reindex">document.reindex</option>
              <option value="user.create">user.create</option>
              <option value="role.assign">role.assign</option>
              <option value="user.update_status">user.update_status</option>
            </select>
          </div>

          <div style={{
            backgroundColor: 'var(--navy-card)',
            border: '1px solid var(--navy-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--navy-surface)', borderBottom: '1px solid var(--navy-border)', color: '#e6eaf0ff' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Timestamp (UTC)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Resource</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#15191eff' }}>
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--navy-border)' }}>
                      <td style={{ padding: '10px 14px', color: '#222427ff', fontFamily: 'var(--font-mono)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#F8FAFC' }}>
                        {log.username || log.user_id || 'System'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#3d83a1ff',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#12171cff' }}>
                        {log.resource} {log.resource_id ? `(${log.resource_id})` : ''}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: log.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: log.status === 'success' ? '#316544ff' : '#F87171',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#202122ff', fontSize: '11.5px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--navy-card)',
            border: '1px solid var(--navy-border)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '460px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 16px' }}>
              Create New Official User
            </h2>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--navy-surface)',
                    border: '1px solid var(--navy-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="e.g. rkumar"
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--navy-surface)',
                    border: '1px solid var(--navy-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. rkumar@cmpdi.co.in"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--navy-surface)',
                    border: '1px solid var(--navy-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--navy-surface)',
                    border: '1px solid var(--navy-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
                  Assigned RBAC Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--navy-surface)',
                    border: '1px solid var(--navy-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="ANALYST">ANALYST (Query, generate reports, upload documents)</option>
                  <option value="VIEWER">VIEWER (Read-only search, view reports)</option>
                  <option value="ADMIN">ADMIN (Full governance, user & role administration)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--navy-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#CBD5E1',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'var(--accent-green)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading === 'create' ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
