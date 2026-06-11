export default function TargetAchievement({ targets = { partners: 150, droneSales: 200 }, actuals = { partners: 0, droneSales: 0 } }) {
  const pPct = targets.partners ? Math.min(100, Math.round((actuals.partners / targets.partners) * 100)) : 0;
  const dPct = targets.droneSales ? Math.min(100, Math.round((actuals.droneSales / targets.droneSales) * 100)) : 0;

  return (
    <div className="bg-white border border-brand-border rounded-crm p-5 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-text">Annual Target Achievement</h3>
          <p className="text-[10px] text-brand-silver">Partners: {targets.partners} • Drone Sales: {targets.droneSales}</p>
        </div>
        <button className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-xs font-bold rounded-xl px-4 py-1.5 cursor-pointer">Set Targets</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-brand-redLight/50 border border-brand-red/20 rounded-lg p-4 relative overflow-hidden">
          <div className="text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-2">Partners</div>
          <div className="flex items-end gap-2 mb-3">
            <span className="font-serif text-3xl font-black text-brand-red">{actuals.partners}</span>
            <span className="text-xs text-brand-silver mb-1">of {targets.partners} target</span>
          </div>
          <div className="h-1.5 bg-brand-lightGrey rounded-full overflow-hidden">
            <div className="h-full bg-brand-red rounded-full" style={{ width: `${pPct}%` }} />
          </div>
          <div className="absolute right-4 top-4 bg-brand-redLight border border-brand-red/30 rounded px-2 py-1 text-brand-red text-xs font-bold text-center">
            {pPct}%<br/><span className="text-[8px] font-normal uppercase">Done</span>
          </div>
        </div>

        <div className="bg-brand-surfaceAlt border border-brand-border rounded-lg p-4 relative overflow-hidden">
          <div className="text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-2">Drone Sales</div>
          <div className="flex items-end gap-2 mb-3">
            <span className="font-serif text-3xl font-black text-brand-text">{actuals.droneSales}</span>
            <span className="text-xs text-brand-silver mb-1">of {targets.droneSales} target</span>
          </div>
          <div className="h-1.5 bg-brand-lightGrey rounded-full overflow-hidden">
            <div className="h-full bg-brand-charcoal rounded-full" style={{ width: `${dPct}%` }} />
          </div>
          <div className="absolute right-4 top-4 bg-brand-lightGrey/50 border border-brand-border rounded px-2 py-1 text-brand-text text-xs font-bold text-center">
            {dPct}%<br/><span className="text-[8px] font-normal uppercase">Done</span>
          </div>
        </div>
      </div>
    </div>
  );
}
