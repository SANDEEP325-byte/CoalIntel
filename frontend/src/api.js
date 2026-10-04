const API_BASE = typeof window !== 'undefined' && window.location.port === '8000' 
  ? '' 
  : 'http://127.0.0.1:8000';

const TOKEN_KEY = 'coalintel_access_token';

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...(options.headers || {}) };
  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  options.headers = headers;

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errText = await res.text();
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.detail || `Request failed with status ${res.status}`);
      } catch (e) {
        if (e.message.startsWith('Request failed')) throw e;
        throw new Error(errText || `Request failed with status ${res.status}`);
      }
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),
  getRoot: () => request('/'),

  // Documents
  getDocuments: (category) => request(category ? `/documents?category=${encodeURIComponent(category)}` : '/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },
  triggerReindex: () => request('/documents/reindex', { method: 'POST' }),
  getDocumentsHealth: () => request('/documents/health'),

  // AI Query & RAG
  queryAssistant: (question, topK = 5, category = null, documentId = null) =>
    request('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, top_k: topK, category, document_id: documentId }),
    }),
  searchDirect: (query, topK = 10) =>
    request('/query/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    }),

  // Analytics & KPIs
  getKPIs: (category = null, entity = null, year = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (entity) params.append('entity', entity);
    if (year) params.append('year', year);
    const qs = params.toString();
    return request(qs ? `/analytics/kpis?${qs}` : '/analytics/kpis');
  },
  getLineage: (metricId = null) =>
    request(metricId ? `/analytics/lineage?metric_id=${encodeURIComponent(metricId)}` : '/analytics/lineage'),
  getWhyChange: () => request('/analytics/why-change'),

  // Comparison & Diff
  getCilCmpdiComparison: (year = '2024-25') => request(`/comparison/cil-vs-cmpdi?year=${encodeURIComponent(year)}`),
  getTemporalComparison: () => request('/comparison/temporal'),
  getContradictions: () => request('/comparison/contradictions'),
  getReportDiff: (docA, docB) => {
    const params = new URLSearchParams();
    if (docA) params.append('doc_a', docA);
    if (docB) params.append('doc_b', docB);
    return request(`/comparison/diff?${params.toString()}`);
  },

  // Reports & Parliamentary
  getReportTemplates: () => request('/reports/templates'),
  generateReport: (title = 'Annual Mining Performance & Decision Intelligence Report', report_type = 'comprehensive_annual', year = '2024-25', subsidiary = null) =>
    request('/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        report_type, 
        year, 
        subsidiary: subsidiary || undefined 
      }),
    }),
  getDocxDownloadUrl: (title = 'Annual Mining Performance & Decision Intelligence Report', report_type = 'comprehensive_annual', year = '2024-25', subsidiary = null) => {
    const params = new URLSearchParams({
      title,
      report_type,
      year
    });
    if (subsidiary) params.append('subsidiary', subsidiary);
    return `${API_BASE}/reports/download/docx?${params.toString()}`;
  },
  downloadKpiCsvUrl: () => `${API_BASE}/reports/download/csv`,
  askParliamentary: (question) =>
    request('/reports/parliamentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }),

  // Topics, Word Cloud, Timeline
  getTopics: (documentName = null, category = null) => {
    const params = new URLSearchParams();
    if (documentName) params.append('document_name', documentName);
    if (category) params.append('category', category);
    const qs = params.toString();
    return request(qs ? `/topics?${qs}` : '/topics');
  },
  getWordCloud: (documentName = null, category = null, limit = 60) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (documentName) params.append('document_name', documentName);
    if (category) params.append('category', category);
    return request(`/topics/wordcloud?${params.toString()}`);
  },
  getTimeline: (year = null) =>
    request(year ? `/topics/timeline?year=${encodeURIComponent(year)}` : '/topics/timeline'),

  // Mining Decision Briefs
  getPresetDecisionBriefs: () => request('/mining/decision-briefs'),
  getDecisionBrief: (topic, documentId = null) =>
    request('/mining/decision-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, document_id: documentId }),
    }),
  getProductionVsDispatch: () => request('/mining/production-vs-dispatch'),
  getProducersComparison: () => request('/mining/producers-comparison'),
  getMiningStats: (documentId = null) =>
    request(documentId ? `/mining/extracted-statistics?document_id=${encodeURIComponent(documentId)}` : '/mining/extracted-statistics'),

  // Document Maintenance (Reprocess & Delete)
  deleteDocument: (documentId) =>
    request(`/documents/${documentId}`, { method: 'DELETE' }),
  reprocessDocument: (documentId) =>
    request(`/documents/${documentId}/reprocess`, { method: 'POST' }),

  // Authentication & RBAC Administration
  login: async (username, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res && res.access_token) {
      setStoredToken(res.access_token);
    }
    return res;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (_) {}
    setStoredToken(null);
  },
  register: async (registrationData) => {
    return request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });
  },
  getRegistrationStatus: () => request('/auth/registration-status'),
  getMe: () => request('/auth/me'),
  getRoles: () => request('/auth/roles'),
  getUsers: () => request('/auth/users'),
  createUser: (userData) =>
    request('/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }),
  updateUserStatus: (userId, is_active) =>
    request(`/auth/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    }),
  updateUserRole: (userId, role) =>
    request(`/auth/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }),
  getAuditLogs: (limit = 100, action = null, userId = null) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (action) params.append('action', action);
    if (userId) params.append('user_id', userId);
    return request(`/auth/audit-logs?${params.toString()}`);
  },
};
