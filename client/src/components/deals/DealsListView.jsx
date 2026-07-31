import { useState, useEffect } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { DEAL_COLORS } from '../../constants/index.js';
import { fmt } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';

export default function DealsListView({ 
  onDealClick, 
  onDeleteClick, 
  onRevertClick, 
  search, 
  activeStageFilter, 
  selectedDeals = [], 
  onToggleSelect, 
  onToggleSelectAll,
  sortOrder
}) {
  const { state } = useCRM();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeStageFilter]);
  
  let filteredDeals = state.deals || [];

  if (search) {
    filteredDeals = filteredDeals.filter(d => 
      d && ((d.title || '').toLowerCase().includes(search.toLowerCase()) || 
      (d.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.contact || '').toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  if (activeStageFilter && activeStageFilter !== 'all') {
    filteredDeals = filteredDeals.filter(d => d && d.stage === activeStageFilter);
  }

  // Sorting
  if (sortOrder) {
    filteredDeals.sort((a, b) => {
      const valA = a?.value || 0;
      const valB = b?.value || 0;
      if (sortOrder === 'desc') return valB - valA;
      return valA - valB;
    });
  } else {
    // Default fallback to keep latest deals first
    filteredDeals.sort((a, b) => {
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalDeals = (filteredDeals || []).length;
  const totalPages = Math.max(1, Math.ceil(totalDeals / pageSize));
  const paginatedDeals = (filteredDeals || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl overflow-hidden border border-brand-border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-brand-surfaceAlt text-[9px] font-black uppercase tracking-widest text-brand-silver border-b border-brand-border">
            <tr>
              {onToggleSelectAll && (
                <th className="py-4 px-5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 cursor-pointer accent-brand-red rounded focus:ring-brand-red align-middle"
                    checked={paginatedDeals.length > 0 && paginatedDeals.every(d => selectedDeals.includes(d._id))}
                    onChange={() => onToggleSelectAll(paginatedDeals.map(d => d._id))}
                  />
                </th>
              )}
              <th className="py-4 px-5 whitespace-nowrap">DEAL ID</th>
              <th className="py-4 px-5 whitespace-nowrap">DEAL TITLE</th>
              <th className="py-4 px-5 whitespace-nowrap">COMPANY</th>
              <th className="py-4 px-5 whitespace-nowrap">VALUE</th>
              <th className="py-4 px-5 whitespace-nowrap">PROBABILITY</th>
              <th className="py-4 px-5 whitespace-nowrap">STAGE</th>
              <th className="py-4 px-5 whitespace-nowrap">OWNER</th>
              <th className="py-4 px-5 whitespace-nowrap">EXPECTED CLOSE</th>
              <th className="py-4 px-5 text-right whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-xs text-brand-text">
            {paginatedDeals.map(deal => {
              const isWon = deal.stage === 'Won';
              const isLost = deal.stage === 'Lost';
              
              let rowStyle = {};
              if (isWon) {
                rowStyle = {
                  backgroundColor: '#e8f5e9'
                };
              } else if (isLost) {
                rowStyle = {
                  backgroundImage: 'repeating-linear-gradient(45deg, #fef2f2, #fef2f2 10px, #fee2e2 10px, #fee2e2 20px)'
                };
              }

              return (
                <tr 
                  key={deal._id} 
                  onClick={() => onDealClick && onDealClick(deal)}
                  style={rowStyle}
                  className={`border-b border-brand-border/60 last:border-0 hover:bg-brand-red/[0.02] cursor-pointer transition-colors ${selectedDeals.includes(deal._id) ? 'bg-brand-red/[0.015]' : ''}`}
                >
                {onToggleSelect && (
                  <td className="py-5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-brand-red rounded focus:ring-brand-red align-middle"
                      checked={selectedDeals.includes(deal._id)}
                      onChange={() => onToggleSelect(deal._id)}
                    />
                  </td>
                )}
                <td className="py-5 px-5 whitespace-nowrap">
                  <span className="text-[10px] font-mono font-bold text-brand-red bg-brand-red/[0.04] border border-brand-red/10 px-2.5 py-1 rounded-md shadow-xs">
                    {deal.dealId || 'N/A'}
                  </span>
                </td>
                <td className="py-5 px-5 font-bold text-brand-text text-[11px] whitespace-nowrap">
                  {deal.title || '--'}
                </td>
                <td className="py-5 px-5 max-w-[200px] truncate text-[11px] font-medium text-brand-text" title={deal.company}>
                  {deal.company || '--'}
                </td>
                <td className="py-5 px-5 whitespace-nowrap font-serif font-black text-brand-text text-sm">
                  {fmt(deal.value)}
                </td>
                <td className="py-5 px-5 whitespace-nowrap font-bold text-brand-text text-[11px]">
                  {deal.probability}%
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  <Badge label={deal.stage} color={DEAL_COLORS[deal.stage] || '#8A8D8F'} />
                </td>
                <td className="py-5 px-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-surfaceAlt border border-brand-border flex items-center justify-center text-[10px] font-bold text-brand-text">
                      {deal.owner?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs text-brand-text font-medium">{deal.owner || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="py-5 px-5 whitespace-nowrap text-[11px] text-brand-text">
                  {formatDate(deal.close_date)}
                </td>
                <td className="py-5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onDealClick && onDealClick(deal)}
                      className="text-brand-silver hover:text-brand-red hover:border-brand-red/20 transition-all font-bold text-[10px] bg-brand-surfaceAlt px-3 py-1.5 rounded-lg border border-brand-border"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onRevertClick && onRevertClick(deal)}
                      className="text-brand-silver hover:text-brand-red hover:border-brand-red/20 transition-all font-bold text-[10px] bg-brand-surfaceAlt px-3 py-1.5 rounded-lg border border-brand-border"
                      title="Revert to Lead"
                    >
                      Revert
                    </button>
                    <button 
                      onClick={() => onDeleteClick && onDeleteClick(deal)}
                      className="text-brand-silver hover:text-brand-red hover:border-brand-red/20 transition-all font-bold text-[10px] bg-brand-surfaceAlt px-3 py-1.5 rounded-lg border border-brand-border"
                      title="Delete"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            {paginatedDeals.length === 0 && (
              <tr>
                <td colSpan="10" className="p-16 text-center text-brand-silver text-sm font-bold opacity-70">
                  {state.deals.length === 0 ? 'No deals yet. Add a new deal or convert from a lead.' : 'No matching deals found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalDeals > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white border border-brand-border rounded-crm p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm text-brand-silver font-bold">Rows per page:</span>
            <select 
              className="bg-brand-surfaceAlt border border-brand-border rounded-md px-3 py-1.5 text-sm font-bold text-brand-text outline-none cursor-pointer"
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
            <span className="text-sm text-brand-silver font-bold">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalDeals)} of {totalDeals}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 rounded-md text-sm font-bold border border-brand-border bg-white text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-surfaceAlt transition-colors"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-1.5 rounded-md text-sm font-bold border border-brand-border bg-white text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-surfaceAlt transition-colors"
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
