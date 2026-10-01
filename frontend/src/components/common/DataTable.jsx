import React from 'react';

/**
 * DataTable - Reusable enterprise table
 */
export default function DataTable({ 
  columns = [], 
  data = [], 
  keyField = 'id', 
  emptyMessage = 'No records available.',
  onRowClick
}) {
  if (!data || data.length === 0) {
    return (
      <div className="gov-table-wrapper" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="gov-table-wrapper">
      <table className="gov-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr 
              key={row[keyField] || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, colIdx) => {
                const cellVal = typeof col.accessor === 'function' 
                  ? col.accessor(row) 
                  : row[col.accessor];
                return (
                  <td key={colIdx} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row, cellVal) : (cellVal !== undefined && cellVal !== null ? String(cellVal) : '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
