import { DEAL_COLORS } from '../../constants/index.js';
import { fmt } from '../../utils/formatters.js';

export default function DealCard({ deal, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-brand-border rounded-xl p-3 text-sm mb-3 cursor-pointer shadow-sm hover:border-brand-silver transition-colors"
    >
      <div className="font-bold text-brand-text mb-1">{deal.title}</div>
      <div className="text-xs text-brand-silver mb-2">{deal.company} • {fmt(deal.value)}</div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-brand-lightGrey h-[3px] rounded">
          <div 
            className="h-full rounded transition-all" 
            style={{ width: `${deal.probability}%`, backgroundColor: DEAL_COLORS[deal.stage] || '#54585A' }} 
          />
        </div>
        <span className="text-[10px] font-bold text-brand-silver">{deal.probability}%</span>
      </div>
    </div>
  );
}
