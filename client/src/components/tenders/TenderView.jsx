import { useState, useEffect } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { fmt, today } from '../../utils/formatters.js';
import { daysBetween } from '../../utils/dateHelpers.js';
import Badge from '../common/Badge.jsx';
import { T_COLORS } from '../../constants/index.js';

const checkIsLink = (val) => {
  if (!val) return false;
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^www\./i.test(trimmed)) return true;
  if (!trimmed.includes(' ') && trimmed.includes('.')) {
    const parts = trimmed.split('.');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length >= 2 && /^[a-zA-Z]+$/.test(lastPart)) {
      return true;
    }
  }
  return false;
};

const getHref = (val) => {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function TenderView({ 
  onTenderClick, 
  search = '', 
  selectedLocation = 'all', 
  activeStatusFilter = 'all',
  selectedTenders = [],
  onToggleSelect,
  onToggleSelectAll,
  sortOrder
}) {
  const { state } = useCRM();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, activeStatusFilter, search]);

  let filteredTenders = state.tenders || [];

  if (activeStatusFilter && activeStatusFilter !== 'all') {
    filteredTenders = filteredTenders.filter(t => t && t.status === activeStatusFilter);
  }

  if (selectedLocation && selectedLocation !== 'all' && selectedLocation !== 'statewise') {
    filteredTenders = filteredTenders.filter(t => t && (t.location || '').toLowerCase() === selectedLocation.toLowerCase());
  }

  if (search && search.trim()) {
    const match = search.match(/^(location|authority|portal|status|tender_id|latrics_id):\s*(.*)$/i);
    if (match) {
      const field = match[1].toLowerCase();
      const val = match[2].toLowerCase();
      const keyMap = {
        location: 'location',
        authority: 'authority',
        portal: 'portal',
        status: 'status',
        tender_id: 'tender_id',
        latrics_id: 'latrics_tender_id'
      };
      const key = keyMap[field] || field;
      filteredTenders = filteredTenders.filter(t => t && (t[key] || '').toLowerCase().includes(val));
    } else {
      const query = search.trim().toLowerCase();
      filteredTenders = filteredTenders.filter(t => 
        t && (
          (t.latrics_tender_id || '').toLowerCase().includes(query) ||
          (t.tender_id || '').toLowerCase().includes(query) ||
          (t.tender_no || '').toLowerCase().includes(query) ||
          (t.authority || '').toLowerCase().includes(query) ||
          (t.portal || '').toLowerCase().includes(query) ||
          (t.location || '').toLowerCase().includes(query) ||
          (t.description || '').toLowerCase().includes(query)
        )
      );
    }
  }

  // Sorting
  if (sortOrder === 'highest_value') {
    filteredTenders.sort((a, b) => (b.amount || 0) - (a.amount || 0));
  } else if (sortOrder === 'lowest_value') {
    filteredTenders.sort((a, b) => (a.amount || 0) - (b.amount || 0));
  } else if (sortOrder === 'oldest') {
    filteredTenders.sort((a, b) => {
      const numA = parseInt((a.latrics_tender_id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.latrics_tender_id || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  } else {
    // Default: 'latest' (latest first)
    filteredTenders.sort((a, b) => {
      const numA = parseInt((a.latrics_tender_id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.latrics_tender_id || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numB - numA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  const totalTenders = filteredTenders.length;
  const totalPages = Math.max(1, Math.ceil(totalTenders / pageSize));
  
  const isStatewise = selectedLocation === 'statewise';
  const paginatedTenders = isStatewise 
    ? filteredTenders 
    : filteredTenders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderTable = (tendersList) => (
    <div className="rounded-2xl overflow-hidden border border-brand-border bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1700px]">
        <thead className="bg-brand-surfaceAlt text-[9px] font-black uppercase tracking-widest text-brand-silver border-b border-brand-border">
          <tr>
            {onToggleSelectAll && (
              <th className="py-4 px-5 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer accent-brand-red rounded focus:ring-brand-red align-middle"
                  checked={tendersList.length > 0 && tendersList.every(t => selectedTenders.includes(t._id))}
                  onChange={() => onToggleSelectAll(tendersList.map(t => t._id))}
                />
              </th>
            )}
            <th className="py-4 px-5 whitespace-nowrap">LATRICS ID</th>
            <th className="py-4 px-5 whitespace-nowrap">TENDER ID</th>
            <th className="py-4 px-5 whitespace-nowrap">PORTAL</th>
            <th className="py-4 px-5 whitespace-nowrap">DOCS</th>
            <th className="py-4 px-5 whitespace-nowrap">AUTHORITY</th>
            <th className="py-4 px-5 whitespace-nowrap">DESCRIPTION</th>
            <th className="py-4 px-5 whitespace-nowrap">LOCATION</th>
            <th className="py-4 px-5 whitespace-nowrap">OPENING DATE</th>
            <th className="py-4 px-5 whitespace-nowrap">CLOSING DATE</th>
            <th className="py-4 px-5 whitespace-nowrap">AMOUNT</th>
            <th className="py-4 px-5 whitespace-nowrap">EMD STATUS</th>
            <th className="py-4 px-5 whitespace-nowrap">EMD AMOUNT</th>
            <th className="py-4 px-5 whitespace-nowrap">JV STATUS</th>
            <th className="py-4 px-5 whitespace-nowrap">JV PARTNER</th>
            <th className="py-4 px-5 whitespace-nowrap">STATUS</th>
            <th className="py-4 px-5 text-right whitespace-nowrap">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="text-xs text-brand-text">
          {tendersList.map(t => {
            const daysLeft = daysBetween(today(), t.closing_date);
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;
            const isSelected = selectedTenders.includes(t._id);
            
            return (
              <tr 
                key={t._id} 
                onClick={() => onTenderClick && onTenderClick(t)}
                className={`border-b border-brand-border/60 last:border-0 hover:bg-brand-red/[0.02] cursor-pointer transition-colors ${isSelected ? 'bg-brand-red/[0.015]' : ''}`}
              >
                {onToggleSelect && (
                  <td className="py-5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer accent-brand-red rounded focus:ring-brand-red align-middle"
                      checked={isSelected}
                      onChange={() => onToggleSelect(t._id)}
                    />
                  </td>
                )}
                <td className="py-5 px-5 whitespace-nowrap">
                  <span className="text-[10px] font-mono font-bold text-brand-red bg-brand-red/[0.04] border border-brand-red/10 px-2.5 py-1 rounded-md shadow-xs">
                    {t.latrics_tender_id || 'N/A'}
                  </span>
                </td>
                <td className="py-5 px-5 font-bold text-brand-text text-[11px] whitespace-nowrap">
                  {t.tender_id || t.tender_no || '--'}
                </td>
                <td className="py-5 px-5 max-w-[200px] truncate" title={t.portal}>
                  {t.portal ? (
                    checkIsLink(t.portal) ? (
                      <a
                        href={getHref(t.portal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-medium text-brand-text hover:text-brand-red hover:underline transition-colors"
                      >
                        {t.portal}
                      </a>
                    ) : (
                      <span className="text-[11px] font-medium text-brand-text">
                        {t.portal}
                      </span>
                    )
                  ) : '--'}
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  {t.doc_link ? (
                    checkIsLink(t.doc_link) ? (
                      <a
                        href={getHref(t.doc_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-medium text-brand-text hover:text-brand-red hover:underline transition-colors"
                      >
                        Docs
                      </a>
                    ) : (
                      <span className="text-[11px] font-medium text-brand-text">
                        {t.doc_link}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-brand-silver">--</span>
                  )}
                </td>
                <td className="py-5 px-5 max-w-[180px] truncate font-bold text-brand-text text-[11px]" title={t.authority}>
                  {t.authority}
                </td>
                <td className="py-5 px-5 max-w-[220px]">
                  <div className="text-[11px] text-brand-silver line-clamp-2 leading-relaxed" title={t.description}>
                    {t.description || '--'}
                  </div>
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-text">
                    <svg className="w-3.5 h-3.5 text-brand-silver shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t.location || '--'}</span>
                  </div>
                </td>
                <td className="py-5 px-5 whitespace-nowrap text-[11px] text-brand-text">
                  {t.opening_date || '--'}
                </td>
                <td className="py-5 px-5 whitespace-nowrap text-[11px]">
                  <span className={`px-1 py-0.5 rounded ${isExpiring ? 'text-brand-red bg-brand-redLight/40 font-bold' : 'text-brand-text bg-gray-50 font-medium'}`}>
                    {t.closing_date || '--'}
                  </span>
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  <span className="font-serif font-black text-brand-text text-sm">
                    {fmt(t.amount)}
                  </span>
                </td>
                <td className="py-5 px-5 whitespace-nowrap font-bold text-brand-text text-[11px]">
                  {t.emd || 'EMD Exempted'}
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  {t.emd_amount > 0 ? (
                    <span className="font-medium text-brand-silver">{fmt(t.emd_amount)}</span>
                  ) : '--'}
                </td>
                <td className="py-5 px-5 whitespace-nowrap font-bold text-brand-text text-[11px]">
                  {t.jv || 'JV Not Allowed'}
                </td>
                <td className="py-5 px-5 max-w-[150px] truncate text-[11px] text-brand-silver" title={t.jv_partner}>
                  {t.jv_partner || '--'}
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  <Badge label={t.status} color={T_COLORS[t.status] || '#8A8D8F'} />
                </td>
                <td className="py-5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => onTenderClick && onTenderClick(t)}
                    className="text-brand-silver hover:text-brand-red hover:border-brand-red/20 transition-all font-bold text-[10px] bg-brand-surfaceAlt px-3 py-1.5 rounded-lg border border-brand-border"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
          {tendersList.length === 0 && (
            <tr>
              <td colSpan="17" className="p-16 text-center text-brand-silver text-sm font-bold opacity-70">
                {state.tenders.length === 0 ? 'No tenders yet. Click Add Tender or Import.' : 'No matching tenders found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (isStatewise) {
    const grouped = filteredTenders.reduce((acc, t) => {
      const loc = (t.location && t.location.trim()) ? t.location.trim() : 'Unspecified Location';
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(t);
      return acc;
    }, {});

    const stateKeys = Object.keys(grouped).sort();

    if (stateKeys.length === 0) {
      return (
        <div className="bg-white p-12 text-center rounded-2xl border border-brand-border text-brand-silver font-bold">
          No matching tenders found for state-wise grouping.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8">
        {stateKeys.map(stateName => {
          const stateTenders = grouped[stateName];
          const totalValue = stateTenders.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

          return (
            <div key={stateName} className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-white px-5 py-3 border border-brand-border rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red"></span>
                  <h3 className="text-sm font-serif font-black text-brand-text">{stateName}</h3>
                  <span className="px-2 py-0.5 bg-brand-surfaceAlt border border-brand-border text-brand-silver text-[10px] font-bold rounded-full">
                    {stateTenders.length} {stateTenders.length === 1 ? 'Tender' : 'Tenders'}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-brand-silver">
                  Total Amount: <span className="text-brand-text font-serif font-black text-xs ml-1">{fmt(totalValue)}</span>
                </div>
              </div>
              {renderTable(stateTenders)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {renderTable(paginatedTenders)}
      
      {totalTenders > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-silver font-bold">Rows per page:</span>
            <select 
              className="bg-brand-surfaceAlt border border-brand-border rounded-md px-3 py-1.5 text-xs font-bold text-brand-text outline-none cursor-pointer"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-xs text-brand-silver font-bold">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalTenders)} of {totalTenders}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-md text-xs font-bold border border-brand-border bg-white text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-surfaceAlt transition-colors"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-md text-xs font-bold border border-brand-border bg-white text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-surfaceAlt transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
