import { getQuickRange } from '../../utils/dateHelpers.js';

export default function DateFilter({ range, setRange }) {
  const options = [
    { key: 'all_time', label: 'All Time' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_quarter', label: 'This Quarter' },
    { key: 'this_year', label: 'This Year' },
    { key: 'custom', label: 'Custom' }
  ];

  const handleQuick = (key) => {
    if (key === 'custom') {
      setRange({ ...range, key });
      return;
    }
    const r = getQuickRange(key);
    setRange({ key, start: r.start, end: r.end });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white border border-brand-border rounded-crm p-4 mb-6 shadow-sm">
      <span className="text-sm font-bold text-brand-text">Date Range</span>
      <div className="flex gap-2">
        {options.map(o => (
          <button
            key={o.key}
            onClick={() => handleQuick(o.key)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              range.key === o.key 
                ? 'bg-brand-red text-white border-brand-red' 
                : 'bg-white text-brand-silver border-brand-border hover:border-brand-silver'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {range.key === 'custom' && (
        <div className="flex items-center gap-2 ml-4">
          <input type="date" value={range.start} onChange={e => setRange({...range, start: e.target.value})} className="border border-brand-border rounded px-2 py-1 text-xs" />
          <span className="text-brand-silver">-</span>
          <input type="date" value={range.end} onChange={e => setRange({...range, end: e.target.value})} className="border border-brand-border rounded px-2 py-1 text-xs" />
        </div>
      )}
      {range.key !== 'custom' && (
        <div className="ml-auto text-xs text-brand-silver bg-brand-surfaceAlt px-3 py-1 rounded-full border border-brand-border">
          {new Date(range.start).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric'})} - {new Date(range.end).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric'})}
        </div>
      )}
    </div>
  );
}
