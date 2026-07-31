import { useState, useEffect } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { LEAD_STAGES, STG_COLORS } from '../../constants/index.js';
import { bantScore, bantCat } from '../../utils/bantHelpers.js';
import Badge from '../common/Badge.jsx';
import DocsPanel from '../docs/DocsPanel.jsx';
import { Clock } from 'lucide-react';
import { fmt } from '../../utils/formatters.js';

export default function LeadsView({ onLeadClick, onDeleteClick, onStageUpdate, activeTab, search, activeStatusFilter, sortOrder, selectedLeads = [], onToggleSelect, onToggleSelectAll }) {
  const { state } = useCRM();
  const [expandedDocs, setExpandedDocs] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, activeStatusFilter]);
  
  let filteredLeads = (state.leads || []).filter(l => l && l.status !== 'Converted');

  if (search) {
    const match = search.match(/^(state|city|company|industry):\s*(.*)$/i);
    if (match) {
      const field = match[1].toLowerCase();
      const value = match[2].toLowerCase();
      filteredLeads = (filteredLeads || []).filter(l => 
        l && (l[field] || '').toLowerCase() === value
      );
    } else {
      filteredLeads = (filteredLeads || []).filter(l => 
        l && (
          (l.decisionMaker || '').toLowerCase().includes(search.toLowerCase()) || 
          (l.company || '').toLowerCase().includes(search.toLowerCase()) ||
          (l.state || '').toLowerCase().includes(search.toLowerCase()) ||
          (l.city || '').toLowerCase().includes(search.toLowerCase()) ||
          (l.industry || '').toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }
  
  // Active Tab filter
  if (activeTab !== 'all') {
    if (activeTab === 'unassigned') {
      filteredLeads = (filteredLeads || []).filter(l => !l || !l.owner);
    } else {
      filteredLeads = (filteredLeads || []).filter(l => {
        if (!l) return false;
        const score = bantScore(l);
        const cat = bantCat(score).label.toLowerCase();
        return cat === activeTab;
      });
    }
  }

  // Active Status filter
  if (activeStatusFilter && activeStatusFilter !== 'all') {
    filteredLeads = (filteredLeads || []).filter(l => l && l.status === activeStatusFilter);
  }

  // Sorting
  if (sortOrder) {
    filteredLeads.sort((a, b) => {
      const valA = a?.value || 0;
      const valB = b?.value || 0;
      if (sortOrder === 'desc') return valB - valA;
      return valA - valB;
    });
  } else {
    // Always sort by leadId descending so latest lead ID (e.g. LED-000068) is at the top
    filteredLeads.sort((a, b) => {
      const numA = parseInt((a?.leadId || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b?.leadId || '').replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });
  }

  const toggleDocs = (id) => {
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalLeads = (filteredLeads || []).length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize));
  const paginatedLeads = (filteredLeads || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      {filteredLeads && totalLeads > 0 && onToggleSelectAll && (
        <div className="flex items-center gap-3 px-6 py-2 bg-white border border-brand-border rounded-crm shadow-sm">
          <input 
            type="checkbox" 
            className="w-4 h-4 cursor-pointer accent-brand-red"
            checked={selectedLeads.length > 0 && selectedLeads.length === totalLeads}
            onChange={() => onToggleSelectAll(filteredLeads.map(l => l._id))}
          />
          <span className="text-sm font-bold text-brand-text">Select All ({totalLeads})</span>
        </div>
      )}
      {paginatedLeads.map(lead => {
        if (!lead) return null;
        const score = bantScore(lead);
        const cat = bantCat(score);
        const stgColor = STG_COLORS[lead.status] || '#8A8D8F';
        const currentStageIdx = LEAD_STAGES.indexOf(lead.status);
        const nextStage = currentStageIdx < LEAD_STAGES.length - 1 ? LEAD_STAGES[currentStageIdx + 1] : null;

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
        
        return (
          <div 
            key={lead._id} 
            className="bg-white border border-brand-border rounded-crm shadow-sm transition-all relative overflow-hidden"
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
                  
                  {/* Lead ID Badge replacing Avatar Circle */}
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
                          <span>{lead.owner.charAt(0)}</span>
                       </div>
                       <span className="text-xs text-brand-charcoal font-bold">{getShortName(lead.owner)}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleDocs(lead._id)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${expandedDocs[lead._id] ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt border border-brand-border text-brand-text hover:bg-brand-border'}`}
                    >
                      Docs
                    </button>
                    <button 
                      onClick={() => onLeadClick && onLeadClick(lead)}
                      className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-silver rounded-md text-xs font-bold hover:bg-brand-border transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteClick && onDeleteClick(lead)}
                      className="px-4 py-1.5 bg-brand-surfaceAlt border border-brand-border text-brand-red rounded-md text-xs font-bold hover:bg-red-50 transition-colors"
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
              </div>              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-4">
                 <div className="flex-1 mr-6">
                    <div className="flex gap-1 h-1.5 w-full">
                      {LEAD_STAGES.map((stage, idx) => (
                        <div 
                          key={stage}
                          onClick={(e) => { e.stopPropagation(); if (onStageUpdate) onStageUpdate(lead, stage); }}
                          className="h-full rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                          title={`Move to ${stage}`}
                          style={{
                            flex: 1,
                            backgroundColor: idx <= currentStageIdx ? '#8A8D8F' : '#f3f4f6', 
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-[9px] font-black text-brand-silver mt-2 tracking-widest uppercase">
                       Stage: <span className="text-brand-red font-black">{lead.status}</span>
                    </div>
                 </div>
                 
                 {nextStage && (
                   <button
                     onClick={() => onStageUpdate && onStageUpdate(lead, nextStage)}
                     className="px-4 py-2 bg-brand-surfaceAlt border border-brand-border text-brand-text rounded-md text-xs font-bold hover:bg-brand-border transition-colors whitespace-nowrap"
                   >
                     Move to {nextStage}
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
        );
      })}
      
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
