import { SECTORS } from '../../constants/index.js';

export default function PipelineBySector({ leads = [], deals = [] }) {
  return (
    <div className="bg-white border border-brand-border rounded-crm p-5 shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-text uppercase tracking-widest text-xs">Pipeline By Sector</h3>
          <p className="text-[10px] text-brand-silver">{leads.length + deals.length} total records</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-brand-silver">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-brand-charcoal"></div> Leads</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-brand-blue"></div> Deals</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {SECTORS.map(sector => {
          const leadsCount = leads.filter(l => l.sector === sector).length;
          const dealsCount = deals.filter(d => d.sector === sector).length;
          return (
            <div key={sector} className="flex-1 min-w-[120px] bg-brand-surfaceAlt border border-brand-border rounded p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-3 mb-2 font-serif text-xl font-black">
                <span className="text-brand-charcoal">{leadsCount}</span>
                <span className="text-brand-blue">{dealsCount}</span>
              </div>
              <div className="text-[10px] text-brand-silver uppercase tracking-wider text-center line-clamp-1" title={sector}>{sector}</div>
            </div>
          );
        })}
      </div>
      {(leads.length === 0 && deals.length === 0) && (
        <div className="text-center text-brand-silver text-xs py-4">No data available<br/><span className="text-[10px]">Add leads or deals with a sector to see distribution.</span></div>
      )}
    </div>
  );
}
