import React from 'react';

/**
 * StatusBadge - Subtle, professional status badge
 * Values: 'Indexed' | 'Uploaded' | 'Extracting' | 'Chunking' | 'Embedding' | 'Failed' | 'Active' | 'Warning' | 'Statutory'
 */
export default function StatusBadge({ status, label }) {
  const norm = (status || '').toLowerCase();
  const text = label || status || 'Unknown';

  if (norm.includes('index') || norm.includes('success') || norm.includes('live') || norm.includes('active') || norm === 'processed') {
    return <span className="badge badge-success">{text}</span>;
  }
  if (norm.includes('fail') || norm.includes('error')) {
    return <span className="badge badge-danger">{text}</span>;
  }
  if (norm.includes('chunk') || norm.includes('embed') || norm.includes('extract') || norm.includes('process') || norm.includes('upload')) {
    return <span className="badge badge-info">{text}</span>;
  }
  if (norm.includes('warn') || norm.includes('pending')) {
    return <span className="badge badge-warning">{text}</span>;
  }
  return <span className="badge badge-neutral">{text}</span>;
}
