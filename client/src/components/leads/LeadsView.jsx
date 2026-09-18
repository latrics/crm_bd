import { useState, useEffect, useMemo } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { LEAD_STAGES, STG_COLORS } from '../../constants/index.js';
import { bantScore, bantCat } from '../../utils/bantHelpers.js';
import Badge from '../common/Badge.jsx';
import DocsPanel from '../docs/DocsPanel.jsx';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { fmt, getOwnerDisplayName } from '../../utils/formatters.js';

export default function LeadsView({ 
  onLeadClick, 
  onDeleteClick, 
  onStageUpdate, 
  activeTab = 'all', 
  leadFilter = 'all',
  activeBant = 'all',
  selectedOwner = 'all',
  search, 
  activeStatusFilter, 
  sortOrder = 'latest', 
  selectedLeads = [], 
  onToggleSelect, 
  onToggleSelectAll,
  highlightLeadId,
  onClearHighlight
}) {
  const { state } = useCRM();
  const [expandedDocs, setExpandedDocs] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, leadFilter, activeBant, selectedOwner, search, activeStatusFilter, sortOrder]);
  
  // 1. Lifecycle filter (All Leads, Unassigned, Converted)
  let filteredLeads = (state.leads || []).filter(l => {
    if (!l) return false;
    const effectiveFilter = leadFilter !== 'all' ? leadFilter : (activeTab === 'converted' ? 'converted' : activeTab === 'unassigned' ? 'unassigned' : 'all');
    if (effectiveFilter === 'converted') return l.status === 'Converted';
    if (l.status === 'Converted') return false;
    if (effectiveFilter === 'unassigned') {
      if (l.owner && l.owner.trim() !== '') return false;
    }
    return true;
  });

  // 2. Owner filter (from dropdown adjacent to BANT)
  if (selectedOwner && selectedOwner !== 'all') {
    if (selectedOwner === 'unassigned') {
      filteredLeads = filteredLeads.filter(l => l && (!l.owner || !l.owner.trim()));
    } else {
      filteredLeads = filteredLeads.filter(l => l && (
        (l.owner || '').trim().toLowerCase() === selectedOwner.trim().toLowerCase() ||
        getOwnerDisplayName(l.owner, state.owners).toLowerCase() === selectedOwner.trim().toLowerCase()
      ));
    }
  }

  // 3. BANT Score filter (Hot, Warm, Cold, Nurture, Unscored)
  const effectiveBant = activeBant !== 'all' ? activeBant : (['hot', 'warm', 'cold', 'nurture', 'unscored'].includes(activeTab) ? activeTab : 'all');
  if (effectiveBant !== 'all') {
    filteredLeads = filteredLeads.filter(l => {
      if (!l) return false;
      const score = bantScore(l);
      const cat = bantCat(score).label.toLowerCase();
      return cat === effectiveBant;
    });
  }

  // 4. Active Status filter (stage)
  if (activeStatusFilter && activeStatusFilter !== 'all') {
    filteredLeads = filteredLeads.filter(l => l && l.status === activeStatusFilter);
  }

  // 5. Search filter
  if (search) {
    const match = search.match(/^(state|city|company|industry):\s*(.*)$/i);
    if (match) {
      const field = match[1].toLowerCase();
      const value = match[2].toLowerCase();
      filteredLeads = filteredLeads.filter(l => 
        l && (l[field] || '').toLowerCase() === value
      );
    } else {
      const q = search.toLowerCase();
      filteredLeads = filteredLeads.filter(l => 
        l && (
          (l.decisionMaker || '').toLowerCase().includes(q) || 
          (l.company || '').toLowerCase().includes(q) ||
          (l.state || '').toLowerCase().includes(q) ||
          (l.city || '').toLowerCase().includes(q) ||
          (l.industry || '').toLowerCase().includes(q) ||
          (l.owner || '').toLowerCase().includes(q) ||
          (l.leadId || '').toLowerCase().includes(q)
        )
      );
    }
  }

  // 6. Sorting
  if (sortOrder === 'highest_value') {
    filteredLeads.sort((a, b) => (Number(b?.value) || 0) - (Number(a?.value) || 0));
  } else if (sortOrder === 'lowest_value') {
    filteredLeads.sort((a, b) => (Number(a?.value) || 0) - (Number(b?.value) || 0));
  } else if (sortOrder === 'oldest') {
    filteredLeads.sort((a, b) => {
      const numA = parseInt((a?.leadId || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b?.leadId || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
    });
  } else if (sortOrder === 'group_by_owner') {
    filteredLeads.sort((a, b) => {
      const ownerA = (a?.owner || '').trim().toLowerCase();
      const ownerB = (b?.owner || '').trim().toLowerCase();
      if (!ownerA && ownerB) return 1;
      if (ownerA && !ownerB) return -1;
      if (ownerA !== ownerB) return ownerA.localeCompare(ownerB);
      const numA = parseInt((a?.leadId || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b?.leadId || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numB - numA;
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  } else {
    // Default: 'latest'
    filteredLeads.sort((a, b) => {
      const numA = parseInt((a?.leadId || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b?.leadId || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numB - numA;
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }

  const [activeHighlightId, setActiveHighlightId] = useState(null);

  useEffect(() => {
    if (highlightLeadId && filteredLeads.length > 0) {
      const index = filteredLeads.findIndex(l => l && (l._id === highlightLeadId || l.leadId === highlightLeadId));
      if (index !== -1) {
        const page = Math.floor(index / pageSize) + 1;
        setCurrentPage(page);
        setActiveHighlightId(highlightLeadId);

        // Scroll to the card after a short timeout to let the page update first
        setTimeout(() => {
          const element = document.getElementById(`lead-card-${highlightLeadId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        // Clear highlight class after 3 seconds and notify parent
        const timer = setTimeout(() => {
          setActiveHighlightId(null);
          if (onClearHighlight) {
            onClearHighlight();
          }
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [highlightLeadId, filteredLeads, pageSize, onClearHighlight]);

  const toggleDocs = (id) => {
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalLeads = (filteredLeads || []).length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize));
  const paginatedLeads = (filteredLeads || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Expand / Collapse state for grouped owners
  const [collapsedOwners, setCollapsedOwners] = useState({});

  const ownerGroups = useMemo(() => {
    if (sortOrder !== 'group_by_owner') return null;
    const groups = {};
    filteredLeads.forEach(lead => {
      const rawOwner = lead.owner && lead.owner.trim() ? lead.owner.trim() : 'Unassigned';
      const resolvedOwner = rawOwner === 'Unassigned' ? 'Unassigned' : getOwnerDisplayName(rawOwner, state.owners);
      if (!groups[resolvedOwner]) {
        groups[resolvedOwner] = {
          ownerName: resolvedOwner,
          leads: [],
          totalValue: 0
        };
      }
      groups[resolvedOwner].leads.push(lead);
      groups[resolvedOwner].totalValue += (Number(lead.value) || 0);
    });
    return Object.values(groups).sort((a, b) => {
      if (a.ownerName === 'Unassigned') return 1;
      if (b.ownerName === 'Unassigned') return -1;
      return a.ownerName.localeCompare(b.ownerName);
    });
  }, [sortOrder, filteredLeads, state.owners]);

  const toggleOwnerCollapse = (ownerName) => {
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

  const renderLeadCard = (lead) => {
    if (!lead) return null;
    const score = bantScore(lead);
    const cat = bantCat(score);
    const stgColor = STG_COLORS[lead.status] || '#8A8D8F';
    const currentStageIdx = LEAD_STAGES.findIndex(s => s.toLowerCase() === (lead.status || '').trim().toLowerCase());
    const nextStage = currentStageIdx >= 0 && currentStageIdx < LEAD_STAGES.length - 1 ? LEAD_STAGES[currentStageIdx + 1] : null;

    const formatDate = (dateString) => {
      if (!dateString) return '--';
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getShortName = (name) => {
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      if (parts.length > 1) {
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        if (lastName.length === 1) return `${firstName} ${lastName}`;
        return `${firstName} ${lastName.charAt(0)}.`;
      }
      return name;
    };

    const formatTimeLeft = (deadlineString) => {
      if (!deadlineString) return '';
      const diffMs = new Date(deadlineString) - new Date();
      if (diffMs <= 0) return 'Overdue';
      const diffHours = Math.round(diffMs / 3600000);
      if (diffHours < 24) {
        if (diffHours <= 0) return 'Due now';
        return `${diffHours}h left`;
      }
      const diffDays = Math.round(diffMs / 86400000);
      return `${diffDays} days left`;
    };
    
    const isHighlighted = activeHighlightId === lead._id || activeHighlightId === lead.leadId;

    return (
      <div 
        key={lead._id} 
        id={`lead-card-${lead._id}`}
        className={`bg-white border rounded-crm shadow-sm transition-all duration-300 relative overflow-hidden ${
          isHighlighted
            ? 'border-brand-red ring-2 ring-brand-red/30 bg-brand-red/[0.02] shadow-md'
            : 'border-brand-border'
        }`}
      >
        {lead.status === 'Closure' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-redLight border-b border-brand-red/20" />
        )}
        
        <div className="p-4 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {onToggleSelect && (
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer accent-brand-red shrink-0"
                  checked={selectedLeads.includes(lead._id)}
                  onChange={() => onToggleSelect(lead._id)}
                />
              )}
              
              {/* Lead ID Badge */}
              <div className="px-3 py-2 bg-brand-red/[0.03] border border-brand-red/10 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[90px] shadow-[inset_0_1px_2px_rgba(218,41,28,0.02)]">
                <span className="text-[8px] font-black text-brand-red/60 uppercase tracking-widest leading-none mb-1">Lead ID</span>
                <span className="text-xs font-mono font-black text-brand-red leading-none">{lead.leadId || 'N/A'}</span>
              </div>

              <div className="min-w-0">
                <h4 className="font-serif text-lg font-bold text-brand-text leading-tight truncate">
                  {lead.company || 'Unnamed Company'}
                </h4>
                <div className="text-[10px] text-brand-silver font-bold mt-1.5 flex items-center gap-2 flex-wrap">
                  <span>Added: {formatDate(lead.createdAt)}</span>
                  {lead.deadline && lead.status === 'Leads' && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        new Date(lead.deadline) - new Date() <= 24 * 60 * 60 * 1000
                          ? 'bg-brand-redLight text-brand-red animate-pulse'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        <Clock className="w-3 h-3 shrink-0" /> {formatTimeLeft(lead.deadline)}
                      </span>
                    </>
                  )}
                </div>
                {lead.bio && (
                  <p className="text-xs text-brand-text font-normal mt-1.5 leading-relaxed">
                    <span className="font-bold text-[10px] text-brand-silver uppercase tracking-wider mr-1">Bio:</span>
                    <span className="text-gray-700">{lead.bio}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lead.owner && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full py-1 pl-1 pr-3 shadow-sm">
                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brand-red">
                      <span>{getOwnerDisplayName(lead.owner, state.owners).charAt(0).toUpperCase()}</span>
                   </div>
                   <span className="text-xs text-brand-charcoal font-bold">{getOwnerDisplayName(lead.owner, state.owners)}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleDocs(lead._id)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${expandedDocs[lead._id] ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt border border-brand-border text-brand-text hover:bg-brand-border'}`}
                >
                  Docs
                </button>
                <button 
                  onClick={() => onLeadClick && onLeadClick(lead)}
                  className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-silver rounded-md text-xs font-bold hover:bg-brand-border transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDeleteClick && onDeleteClick(lead)}
                  className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-red rounded-md text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Del
                </button>
              </div>
            </div>
          </div>

          {/* Lead Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3.5 px-5 bg-gray-50/50 border border-gray-100 rounded-xl">
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Decision Maker</span>
              <span className="text-xs font-bold text-brand-text">{lead.decisionMaker || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Industry</span>
              <span className="text-xs font-bold text-brand-text">{lead.industry || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Business Model</span>
              <span className="text-xs font-bold text-brand-text">{lead.businessModel || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Lead Value</span>
              <span className="text-xs font-bold text-brand-text">{fmt(lead.value)}</span>
            </div>
          </div>

          {/* Pipeline Tracker as 6 Stage Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-brand-border/40">
            <div className="flex-1 w-full max-w-3xl">
              {/* 6 Stage Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 sm:gap-2 w-full">
                {LEAD_STAGES.map((stage, idx) => {
                  const isCurrent = currentStageIdx === idx;
                  const isPassed = currentStageIdx >= 0 && idx < currentStageIdx;
                  const displayTitle = stage === 'Communicated' ? 'Communication' : stage;

                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStageUpdate) onStageUpdate(lead, stage);
                      }}
                      title={`Move to ${displayTitle}`}
                      className={`py-2 px-1 sm:px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all duration-150 flex items-center justify-center text-center cursor-pointer select-none active:scale-95 shadow-2xs ${
                        isCurrent
                          ? 'bg-brand-red text-white border border-brand-red shadow-sm ring-2 ring-brand-red/20 font-black'
                          : isPassed
                          ? 'bg-[#8A8D8F] text-white border border-[#8A8D8F] hover:bg-[#717476] font-bold'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-white hover:text-brand-text hover:border-gray-300 font-semibold'
                      }`}
                    >
                      <span className="truncate">{displayTitle}</span>
                    </button>
                  );
                })}
              </div>

              {/* Current Stage Indicator */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[10px] font-black text-brand-silver uppercase tracking-wider">STAGE:</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-red">
                  {lead.status === 'Communicated' ? 'Communication' : lead.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
               {nextStage && (
                 <button 
                   onClick={() => onStageUpdate && onStageUpdate(lead, nextStage)}
                   className="px-4 py-2 bg-brand-surfaceAlt border border-brand-border text-brand-text rounded-md text-xs font-bold hover:bg-brand-border transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                 >
                   Move to {nextStage === 'Communicated' ? 'Communication' : nextStage}
                 </button>
               )}
            </div>
          </div>

          {expandedDocs[lead._id] && (
            <div className="border-t border-brand-border p-4 sm:p-6 bg-brand-surfaceAlt/30">
              <DocsPanel entityId={lead._id} entityType="lead" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {filteredLeads && totalLeads > 0 && onToggleSelectAll && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-white border border-brand-border rounded-crm shadow-sm">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 cursor-pointer accent-brand-red"
              checked={
                sortOrder === 'group_by_owner'
                  ? (filteredLeads.length > 0 && filteredLeads.every(l => selectedLeads.includes(l._id)))
                  : (paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeads.includes(l._id)))
              }
              onChange={() => {
                const targetLeads = sortOrder === 'group_by_owner' ? filteredLeads : paginatedLeads;
                onToggleSelectAll(targetLeads.map(l => l._id));
              }}
            />
            <span className="text-sm font-bold text-brand-text">
              Select All ({sortOrder === 'group_by_owner' ? filteredLeads.length : paginatedLeads.length})
            </span>
          </div>

          {sortOrder === 'group_by_owner' && ownerGroups && ownerGroups.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-1 rounded-lg text-xs font-bold text-brand-silver hover:text-brand-text hover:bg-gray-100 transition-colors border border-transparent hover:border-brand-border cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-1 rounded-lg text-xs font-bold text-brand-silver hover:text-brand-text hover:bg-gray-100 transition-colors border border-transparent hover:border-brand-border cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      )}

      {sortOrder === 'group_by_owner' && ownerGroups ? (
        ownerGroups.map(group => {
          const isCollapsed = Boolean(collapsedOwners[group.ownerName]);
          const isUnassigned = group.ownerName === 'Unassigned';

          return (
            <div key={group.ownerName} className="flex flex-col gap-3">
              {/* Owner Header (Expand & Shrink Toggle) */}
              <div 
                onClick={() => toggleOwnerCollapse(group.ownerName)}
                className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-brand-border rounded-crm px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm hover:border-gray-300 transition-all cursor-pointer select-none group"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-7 h-7 rounded-lg bg-white border border-brand-border group-hover:border-brand-red/40 flex items-center justify-center text-brand-silver group-hover:text-brand-red transition-all shadow-2xs"
                    title={isCollapsed ? "Click to expand" : "Click to shrink"}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                    isUnassigned ? 'bg-purple-600' : 'bg-brand-charcoal'
                  }`}>
                    {isUnassigned ? '?' : group.ownerName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-sm text-brand-text leading-tight group-hover:text-brand-red transition-colors">
                      {group.ownerName}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isUnassigned ? 'bg-purple-100 text-purple-700' : 'bg-brand-surfaceAlt text-brand-silver'
                    }`}>
                      {group.leads.length} {group.leads.length === 1 ? 'Lead' : 'Leads'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-brand-silver">
                  <div>
                    <span>Pipeline Value: </span>
                    <span className="text-brand-red font-mono font-bold">{fmt(group.totalValue)}</span>
                  </div>
                  <span className="text-[11px] font-bold text-brand-silver bg-white border border-brand-border px-2.5 py-1 rounded-lg group-hover:border-brand-red/30 group-hover:text-brand-red transition-colors">
                    {isCollapsed ? 'Expand' : 'Shrink'}
                  </span>
                </div>
              </div>

              {/* Leads for this owner */}
              {!isCollapsed && (
                <div className="flex flex-col gap-4 pl-0 sm:pl-3 border-l-2 border-brand-red/10 ml-1 sm:ml-2">
                  {group.leads.map(lead => renderLeadCard(lead))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        paginatedLeads.map(lead => renderLeadCard(lead))
      )}
      
      {totalLeads > 0 && (
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
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalLeads)} of {totalLeads}
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
