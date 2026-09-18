import { useState, useEffect, useMemo } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { DEAL_STAGES, DEAL_COLORS } from '../../constants/index.js';
import DocsPanel from '../docs/DocsPanel.jsx';
import { fmt, getOwnerDisplayName } from '../../utils/formatters.js';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function DealsView({ 
  onDealClick, 
  onDeleteClick, 
  onRevertClick, 
  onStageUpdate, 
  search, 
  activeStageFilter, 
  selectedOwner,
  sortOrder, 
  selectedDeals = [], 
  onToggleSelect, 
  onToggleSelectAll 
}) {
  const { state } = useCRM();
  const [expandedDocs, setExpandedDocs] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedOwners, setCollapsedOwners] = useState({});

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeStageFilter, selectedOwner]);
  
  let filteredDeals = state.deals ? [...state.deals] : [];

  if (search) {
    const match = search.match(/^(state|city|company|industry|sector):\s*(.*)$/i);
    if (match) {
      let field = match[1].toLowerCase();
      const value = match[2].toLowerCase();
      if (field === 'industry') field = 'sector';
      filteredDeals = filteredDeals.filter(d => 
        d && (d[field] || '').toLowerCase() === value
      );
    } else {
      filteredDeals = filteredDeals.filter(d => 
        d && (
          (d.title || '').toLowerCase().includes(search.toLowerCase()) || 
          (d.company || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.contact || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.state || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.city || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.sector || '').toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }
  
  // Active Stage / Status filter
  if (activeStageFilter && activeStageFilter !== 'all') {
    if (activeStageFilter === 'unassigned') {
      filteredDeals = filteredDeals.filter(d => !d || !d.owner || !d.owner.trim());
    } else {
      filteredDeals = filteredDeals.filter(d => d && d.stage === activeStageFilter);
    }
  }

  // Owner filter
  if (selectedOwner && selectedOwner !== 'all') {
    if (selectedOwner === 'unassigned') {
      filteredDeals = filteredDeals.filter(d => !d || !d.owner || !d.owner.trim());
    } else {
      filteredDeals = filteredDeals.filter(d => d && (
        (d?.owner || '').trim().toLowerCase() === selectedOwner.trim().toLowerCase() ||
        getOwnerDisplayName(d?.owner, state.owners).toLowerCase() === selectedOwner.trim().toLowerCase()
      ));
    }
  }

  // Sorting
  if (sortOrder === 'highest_value') {
    filteredDeals.sort((a, b) => (b?.value || 0) - (a?.value || 0));
  } else if (sortOrder === 'lowest_value') {
    filteredDeals.sort((a, b) => (a?.value || 0) - (b?.value || 0));
  } else if (sortOrder === 'oldest') {
    filteredDeals.sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
  } else if (sortOrder === 'group_by_owner') {
    // Handled in ownerGroups calculation
  } else {
    // Default: 'latest'
    filteredDeals.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }

  const toggleDocs = (id) => {
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Group by Owner calculation
  const ownerGroups = useMemo(() => {
    if (sortOrder !== 'group_by_owner' || !filteredDeals) return null;
    const groups = {};
    filteredDeals.forEach(deal => {
      const rawOwner = deal.owner && deal.owner.trim() ? deal.owner.trim() : '';
      const ownerName = rawOwner ? getOwnerDisplayName(rawOwner, state.owners) : 'Unassigned';
      if (!groups[ownerName]) {
        groups[ownerName] = {
          ownerName,
          deals: [],
          totalValue: 0
        };
      }
      groups[ownerName].deals.push(deal);
      groups[ownerName].totalValue += (deal.value || 0);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.ownerName === 'Unassigned') return 1;
      if (b.ownerName === 'Unassigned') return -1;
      return a.ownerName.localeCompare(b.ownerName);
    });
  }, [filteredDeals, sortOrder, state.owners]);

  const toggleOwnerGroup = (ownerName) => {
    setCollapsedOwners(prev => ({
      ...prev,
      [ownerName]: !prev[ownerName]
    }));
  };

  const handleExpandAll = () => {
    setCollapsedOwners({});
  };

  const handleCollapseAll = () => {
    if (!ownerGroups) return;
    const all = {};
    ownerGroups.forEach(g => {
      all[g.ownerName] = true;
    });
    setCollapsedOwners(all);
  };

  const totalDeals = (filteredDeals || []).length;
  const totalPages = Math.max(1, Math.ceil(totalDeals / pageSize));
  const paginatedDeals = (filteredDeals || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderDealCard = (deal) => {
    if (!deal) return null;
    const isWon = deal.stage === 'Won';
    const isLost = deal.stage === 'Lost';
    const isNegotiation = deal.stage === 'Negotiation';

    const formatDate = (dateString) => {
      if (!dateString) return '--';
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    let cardStyle = {};
    if (isWon) {
      cardStyle = {
        backgroundColor: '#e8f5e9',
        borderColor: '#c8e6c9'
      };
    } else if (isLost) {
      cardStyle = {
        backgroundImage: 'repeating-linear-gradient(45deg, #fef2f2, #fef2f2 10px, #fee2e2 10px, #fee2e2 20px)',
        borderColor: '#fca5a5'
      };
    }

    return (
      <div 
        key={deal._id} 
        style={cardStyle}
        className={`bg-white border border-brand-border rounded-crm shadow-sm transition-all relative overflow-hidden ${isWon ? '' : isLost ? '' : 'hover:bg-brand-red/[0.01]'}`}
      >
        {deal.stage === 'Won' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-green-100 border-b border-green-500/20" />
        )}
        
        <div className="p-4 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {onToggleSelect && (
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer accent-brand-red shrink-0"
                  checked={selectedDeals.includes(deal._id)}
                  onChange={() => onToggleSelect(deal._id)}
                />
              )}
              
              {/* Deal ID Badge */}
              <div className="px-3 py-2 bg-brand-red/[0.03] border border-brand-red/10 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[90px] shadow-[inset_0_1px_2px_rgba(218,41,28,0.02)]">
                <span className="text-[8px] font-black text-brand-red/60 uppercase tracking-widest leading-none mb-1">Deal ID</span>
                <span className="text-xs font-mono font-black text-brand-red leading-none">{deal.dealId || 'N/A'}</span>
              </div>

              <div className="min-w-0">
                <h4 className="font-serif text-lg font-bold text-brand-text leading-tight truncate">
                  {deal.title || 'Unnamed Deal'}
                </h4>
                <div className="text-[10px] text-brand-silver font-bold mt-1.5 flex items-center gap-2 flex-wrap">
                  <span>Added: {formatDate(deal.close_date || deal.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {deal.owner && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full py-1 pl-1 pr-3 shadow-sm">
                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brand-red">
                      <span>{getOwnerDisplayName(deal.owner, state.owners).charAt(0).toUpperCase()}</span>
                   </div>
                   <span className="text-xs text-brand-charcoal font-bold">{getOwnerDisplayName(deal.owner, state.owners)}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleDocs(deal._id)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${expandedDocs[deal._id] ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt border border-brand-border text-brand-text hover:bg-brand-border'}`}
                >
                  Docs
                </button>
                <button 
                  onClick={() => onDealClick && onDealClick(deal)}
                  className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-silver rounded-md text-xs font-bold hover:bg-brand-border transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onRevertClick && onRevertClick(deal)}
                  className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-silver rounded-md text-xs font-bold hover:bg-brand-border transition-colors cursor-pointer"
                >
                  Revert
                </button>
                <button 
                  onClick={() => onDeleteClick && onDeleteClick(deal)}
                  className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-red rounded-md text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Del
                </button>
              </div>
            </div>
          </div>

          {/* Deal Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3.5 px-5 bg-gray-50/50 border border-gray-100 rounded-xl">
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Company</span>
              <span className="text-xs font-bold text-brand-text truncate block">{deal.company || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Contact</span>
              <span className="text-xs font-bold text-brand-text truncate block">{deal.contact ? `${deal.contact}${deal.designation ? ` (${deal.designation})` : ''}` : '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Location / Sector</span>
              <span className="text-xs font-bold text-brand-text truncate block">{[deal.city || deal.state, deal.sector].filter(Boolean).join(' • ') || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Deal Value</span>
              <span className="text-xs font-bold text-brand-text">{fmt(deal.value)}</span>
            </div>
          </div>

          {/* Pipeline Tracker as 3 Stage Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-brand-border/40">
             <div className="flex-1 w-full max-w-xl">
                {/* 3 Stage Buttons Grid */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {['Negotiation', 'Won', 'Lost'].map((stage) => {
                    const isCurrent = (deal.stage || '').toLowerCase() === stage.toLowerCase();
                    const isStageWon = stage === 'Won';
                    const isStageLost = stage === 'Lost';
                    const displayTitle = isStageWon ? 'Win' : stage;

                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStageUpdate) onStageUpdate(deal, stage);
                        }}
                        title={`Move deal to ${displayTitle}`}
                        className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center text-center cursor-pointer select-none active:scale-95 shadow-2xs ${
                          isCurrent
                            ? isStageWon
                              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm ring-2 ring-emerald-500/20 font-black'
                              : isStageLost
                              ? 'bg-brand-red text-white border border-brand-red shadow-sm ring-2 ring-brand-red/20 font-black'
                              : 'bg-brand-charcoal text-white border border-brand-charcoal shadow-sm ring-2 ring-brand-charcoal/20 font-black'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-white hover:text-brand-text hover:border-gray-300 font-semibold'
                        }`}
                      >
                        <span className="truncate">{displayTitle}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Current Stage & Probability Indicators */}
                <div className="flex items-center justify-between gap-2 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-brand-silver uppercase tracking-wider">STAGE:</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      isWon ? 'text-emerald-600' : isLost ? 'text-brand-red' : 'text-brand-charcoal'
                    }`}>
                      {isWon ? 'Win (Won)' : deal.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-silver uppercase tracking-wider">
                    <span>Probability:</span>
                    <span className="text-brand-text font-black">{deal.probability || 0}%</span>
                  </div>
                </div>
             </div>
             
             {/* Action Buttons */}
             <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
               {isNegotiation && (
                 <>
                   <button
                     onClick={(e) => { e.stopPropagation(); onStageUpdate && onStageUpdate(deal, 'Won'); }}
                     className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs flex items-center gap-1"
                   >
                     <span>✓</span> Mark Win
                   </button>
                   <button
                     onClick={(e) => { e.stopPropagation(); onStageUpdate && onStageUpdate(deal, 'Lost'); }}
                     className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs flex items-center gap-1"
                   >
                     <span>✕</span> Mark Lost
                   </button>
                 </>
               )}
               {isLost && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onStageUpdate && onStageUpdate(deal, 'Negotiation'); }}
                   className="px-4 py-2 bg-brand-surfaceAlt border border-brand-border text-brand-text rounded-md text-xs font-bold hover:bg-brand-border transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                 >
                   Reopen to Negotiation
                 </button>
               )}
               {isWon && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onStageUpdate && onStageUpdate(deal, 'Negotiation'); }}
                   className="px-4 py-2 bg-brand-surfaceAlt border border-brand-border text-brand-text rounded-md text-xs font-bold hover:bg-brand-border transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                 >
                   Move to Negotiation
                 </button>
               )}
             </div>
          </div>
        </div>

        {expandedDocs[deal._id] && (
          <div className="border-t border-brand-border p-4 sm:p-6 bg-brand-surfaceAlt/30">
            <DocsPanel entityId={deal._id} entityType="deal" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Group by Owner Header & Bulk Controls */}
      {sortOrder === 'group_by_owner' && ownerGroups && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-white border border-brand-border rounded-crm shadow-sm">
          <div className="flex items-center gap-3">
            {onToggleSelectAll && (
              <input 
                type="checkbox" 
                className="w-4 h-4 cursor-pointer accent-brand-red"
                checked={filteredDeals.length > 0 && filteredDeals.every(d => selectedDeals.includes(d._id))}
                onChange={() => onToggleSelectAll(filteredDeals.map(d => d._id))}
              />
            )}
            <span className="text-xs font-black uppercase tracking-wider text-brand-silver">
              Grouped by Owner ({ownerGroups.length} Owners • {totalDeals} Deals)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="px-3 py-1 bg-brand-surfaceAlt border border-brand-border rounded-lg text-xs font-bold text-brand-text hover:bg-brand-border transition-all cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-3 py-1 bg-brand-surfaceAlt border border-brand-border rounded-lg text-xs font-bold text-brand-silver hover:bg-brand-border hover:text-brand-text transition-all cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* Regular View Select All Bar */}
      {sortOrder !== 'group_by_owner' && filteredDeals && totalDeals > 0 && onToggleSelectAll && (
        <div className="flex items-center gap-3 px-6 py-2 bg-white border border-brand-border rounded-crm shadow-sm">
          <input 
            type="checkbox" 
            className="w-4 h-4 cursor-pointer accent-brand-red"
            checked={paginatedDeals.length > 0 && paginatedDeals.every(d => selectedDeals.includes(d._id))}
            onChange={() => onToggleSelectAll(paginatedDeals.map(d => d._id))}
          />
          <span className="text-sm font-bold text-brand-text">Select All ({paginatedDeals.length})</span>
        </div>
      )}

      {/* Render Deals: Grouped or Paginated */}
      {sortOrder === 'group_by_owner' && ownerGroups ? (
        ownerGroups.map(group => {
          const isCollapsed = !!collapsedOwners[group.ownerName];
          return (
            <div key={group.ownerName} className="flex flex-col gap-3">
              {/* Accordion Owner Header */}
              <div 
                onClick={() => toggleOwnerGroup(group.ownerName)}
                className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-brand-border rounded-crm shadow-xs cursor-pointer hover:border-brand-red/30 transition-all select-none group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-white border border-brand-border flex items-center justify-center text-brand-silver group-hover:text-brand-red transition-colors shadow-2xs">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-brand-charcoal text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {group.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-brand-text group-hover:text-brand-red transition-colors">
                      {group.ownerName}
                    </h3>
                    <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">
                      {isCollapsed ? 'Expand' : 'Shrink'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-white border border-brand-border text-brand-silver rounded-full text-xs font-mono font-bold shadow-2xs">
                    {group.deals.length} {group.deals.length === 1 ? 'deal' : 'deals'}
                  </span>
                  <span className="text-xs font-mono font-black text-brand-red">
                    {fmt(group.totalValue)}
                  </span>
                </div>
              </div>

              {/* Group Deals (when expanded) */}
              {!isCollapsed && (
                <div className="flex flex-col gap-4 pl-3 sm:pl-4 border-l-2 border-brand-red/10 animate-in fade-in slide-in-from-top-1 duration-150">
                  {group.deals.map(deal => renderDealCard(deal))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        paginatedDeals.map(deal => renderDealCard(deal))
      )}
      
      {/* Pagination Controls (when not grouped) */}
      {sortOrder !== 'group_by_owner' && totalDeals > 0 && (
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
                className="px-4 py-1.5 rounded-md text-sm font-bold border border-brand-border bg-white text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-surfaceAlt transition-colors cursor-pointer"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-1.5 rounded-md text-sm font-bold border border-brand-border bg-white text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-surfaceAlt transition-colors cursor-pointer"
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
