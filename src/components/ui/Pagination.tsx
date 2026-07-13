import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className = '' }) => {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (currentPage > 2) pages.push('...');
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    pages.push(totalPages - 1);
  }

  return (
    <div className={`flex items-center justify-center gap-1 mt-6 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: '#64748B' }}
        onMouseEnter={e => { if (currentPage !== 0) (e.currentTarget as HTMLElement).style.background = '#e2e8f0'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-sm" style={{ color: '#64748B' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className="w-9 h-9 rounded-lg text-sm font-bold transition"
            style={p === currentPage
              ? { background: '#002B5B', color: '#fff' }
              : { color: '#64748B' }}
            onMouseEnter={e => { if (p !== currentPage) (e.currentTarget as HTMLElement).style.background = '#e2e8f0'; }}
            onMouseLeave={e => { if (p !== currentPage) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {(p as number) + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: '#64748B' }}
        onMouseEnter={e => { if (currentPage < totalPages - 1) (e.currentTarget as HTMLElement).style.background = '#e2e8f0'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </button>
    </div>
  );
};

export default Pagination;
