import { useState } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { LEAD_STAGES, STG_COLORS } from '../../constants/index.js';
import { bantScore, bantCat } from '../../utils/bantHelpers.js';
import Badge from '../common/Badge.jsx';
import DocsPanel from '../docs/DocsPanel.jsx';

export default function LeadsView({ onLeadClick, onDeleteClick, onStageUpdate, activeTab, search }) {
  const { state } = useCRM();
  const [expandedDocs, setExpandedDocs] = useState({});
  
  let filteredLeads = state.leads;

  // Search filter
  if (search) {
    filteredLeads = (filteredLeads || []).filter(l => 
      l && (l.name?.toLowerCase().includes(search.toLowerCase()) || 
      l.company?.toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  // Active Tab filter
  if (activeTab !== 'all') {
    filteredLeads = (filteredLeads || []).filter(l => {
      if (!l) return false;
      const score = bantScore(l);
      const cat = bantCat(score).label.toLowerCase();
      return cat === activeTab;
    });
  }

  const toggleDocs = (id) => {
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-4">
      {(filteredLeads || []).map(lead => {
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
        
        return (
          <div 
            key={lead._id} 
            className="bg-white border border-brand-border rounded-crm shadow-sm transition-all relative overflow-hidden"
          >
            {lead.status === 'Closure' && (
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-redLight border-b border-brand-red/20" />
            )}
            
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm bg-brand-surfaceAlt text-brand-text border border-brand-border">
                    {lead.name.charAt(0)}{lead.company.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-bold text-brand-text leading-tight">{lead.name}</h4>
                    <p className="text-xs text-brand-silver font-bold tracking-wider mt-0.5">{lead.company}</p>
                    <p className="text-[10px] text-brand-silver mt-1">Added: {formatDate(lead.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge label={lead.status} color={stgColor} />
                  <span className="text-brand-silver">--</span>
                  {lead.owner && (
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brand-redLight">
                         <span className="text-brand-red">{lead.owner.charAt(0)}</span>
                       </div>
                       <span className="text-xs text-brand-silver font-bold">{lead.owner}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 ml-4">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-4">
                 <div className="flex-1 mr-6">
                    <div className="flex gap-1 h-1.5 rounded-full overflow-hidden w-full">
                      {LEAD_STAGES.map((stage, idx) => (
                        <div 
                          key={stage}
                          className="h-full rounded-full"
                          style={{
                            flex: 1,
                            backgroundColor: idx <= currentStageIdx ? '#8A8D8F' : '#f3f4f6', // Use a neutral gray for past/current stages, very light gray for future. Wait, in image it's solid gray. Let's use brand-silver for filled, and a lighter gray for unfilled
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] font-bold text-brand-silver mt-2 tracking-widest cursor-pointer hover:text-brand-text transition-colors">
                       Click bar to move stage
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
    </div>
  );
}
