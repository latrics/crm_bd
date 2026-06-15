import { useState } from 'react';

export default function DeveloperGuide({ title, description, steps = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mb-6 bg-brand-red/[0.04] hover:bg-brand-red/[0.08] text-brand-red text-xs font-semibold px-4 py-2 rounded-xl border border-brand-red/10 flex items-center justify-between transition-all"
      >
        <span className="flex items-center gap-2">
          <span>ℹ️</span> Show Page Guide & Development Notes
        </span>
        <span>▼</span>
      </button>
    );
  }

  return (
    <div className="w-full mb-6 bg-white border border-brand-red/10 rounded-xl p-5 shadow-[0_8px_30px_rgb(218,41,28,0.02)] transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 h-full w-1 bg-brand-red"></div>
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-brand-charcoal">
          <span className="text-lg">🛡️</span>
          <h3 className="font-serif text-base font-bold tracking-tight">{title}</h3>
          <span className="bg-brand-redLight text-brand-red text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
            SuperAdmin Dev Mode
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-brand-silver hover:text-brand-charcoal text-xs font-semibold transition-colors"
        >
          Hide Guide ▲
        </button>
      </div>

      <p className="text-xs text-brand-silver leading-relaxed mb-4">
        {description}
      </p>

      {steps.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="text-[10px] font-black text-brand-charcoal uppercase tracking-widest mb-2">Operational Steps:</h4>
          <ol className="list-decimal list-inside space-y-1.5">
            {steps.map((step, idx) => (
              <li key={idx} className="text-xs text-brand-charcoal font-medium">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
