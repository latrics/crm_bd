import { useState } from 'react';
import useCRM from '../../hooks/useCRM.js';
import DealCard from './DealCard.jsx';
import { DEAL_STAGES, DEAL_COLORS } from '../../constants/index.js';

export default function DealsView({ onDealClick }) {
  const { state } = useCRM();
  const deals = state.deals;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {DEAL_STAGES.map(stage => {
        const stageDeals = (deals || []).filter(d => d && d.stage === stage);
        const stgColor = DEAL_COLORS[stage] || '#8A8D8F';
        
        return (
          <div key={stage} className="min-w-[300px] flex-1 bg-brand-surfaceAlt rounded-xl border border-brand-border p-4 flex flex-col min-h-[150px] max-h-[70vh]">
            <div className="flex justify-between items-center mb-6 text-xs font-bold text-brand-silver">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stgColor }}></div>
                <span className="uppercase tracking-wider text-brand-text text-[11px]">{stage}</span>
              </div>
              <span>--</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {stageDeals.length > 0 ? (
                stageDeals.map(deal => (
                  <DealCard key={deal._id} deal={deal} onClick={() => onDealClick && onDealClick(deal)} />
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs font-bold text-brand-silver opacity-40 py-8">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
