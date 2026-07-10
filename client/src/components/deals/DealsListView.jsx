import { useState, useEffect } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { DEAL_COLORS } from '../../constants/index.js';
import { fmt } from '../../utils/formatters.js';
import Badge from '../common/Badge.jsx';

export default function DealsListView({ onDealClick, onDeleteClick, onRevertClick, search, activeStageFilter, selectedDeals = [], onToggleSelect, onToggleSelectAll }) {
  const { state } = useCRM();
  
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

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white border border-brand-border rounded-crm overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-brand-surfaceAlt border-b border-brand-border">
              {onToggleSelectAll && (
                <th className="px-6 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 cursor-pointer accent-brand-red"
                    checked={selectedDeals.length > 0 && selectedDeals.length === filteredDeals.length}
                    onChange={() => onToggleSelectAll(filteredDeals.map(d => d._id))}
                  />
                </th>
              )}
              <th className="px-6 py-4 text-[10px] font-bold text-brand-silver uppercase tracking-widest">Deal / Company</th>
              <th className="px-6 py-4 text-[10px] font-bold text-brand-silver uppercase tracking-widest">Value</th>
              <th className="px-6 py-4 text-[10px] font-bold text-brand-silver uppercase tracking-widest">Stage</th>
              <th className="px-6 py-4 text-[10px] font-bold text-brand-silver uppercase tracking-widest">Owner</th>
              <th className="px-6 py-4 text-[10px] font-bold text-brand-silver uppercase tracking-widest">Expected Close</th>
              <th className="px-6 py-4 text-[10px] font-bold text-brand-silver uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map(deal => (
              <tr key={deal._id} className="border-b border-brand-border last:border-0 hover:bg-brand-surfaceAlt/30 transition-colors">
                {onToggleSelect && (
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-brand-red"
                      checked={selectedDeals.includes(deal._id)}
                      onChange={() => onToggleSelect(deal._id)}
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="font-bold text-brand-text text-sm">{deal.title}</div>
                  <div className="text-[10px] text-brand-silver font-bold uppercase tracking-wider">{deal.company || 'No Company'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-serif font-black text-brand-red">{fmt(deal.value)}</div>
                  <div className="text-[9px] text-brand-silver">{deal.probability}% probability</div>
                </td>
                <td className="px-6 py-4">
                  <Badge label={deal.stage} color={DEAL_COLORS[deal.stage] || '#8A8D8F'} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-surfaceAlt border border-brand-border flex items-center justify-center text-[10px] font-bold text-brand-text">
                      {deal.owner?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs text-brand-text font-medium">{deal.owner || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-brand-silver font-bold">{formatDate(deal.close_date)}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onDealClick && onDealClick(deal)}
                      className="p-2 text-brand-silver hover:text-brand-text transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button 
                      onClick={() => onRevertClick && onRevertClick(deal)}
                      className="p-2 text-brand-silver hover:text-brand-text transition-colors"
                      title="Revert to Lead"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <button 
                      onClick={() => onDeleteClick && onDeleteClick(deal)}
                      className="p-2 text-brand-silver hover:text-brand-red transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-brand-silver text-sm font-bold opacity-50">
                  No deals found in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
