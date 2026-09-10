const API_BASE = typeof window !== 'undefined' && window.location.port === '8000' 
  ? '' 
  : 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
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
  generateReport: (title = 'Annual Mining Performance & Decision Intelligence Report') =>
    request('/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
  getDocxDownloadUrl: (title = 'Annual Mining Performance & Decision Intelligence Report') =>
    `${API_BASE}/reports/download/docx?title=${encodeURIComponent(title)}`,
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
};
