import { useState } from 'react';
import { Info, Shield, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function DeveloperGuide({ title, description, steps = [], cautions = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mb-6 bg-brand-red/[0.04] hover:bg-brand-red/[0.08] text-brand-red text-xs font-semibold px-4 py-2 rounded-xl border border-brand-red/10 flex items-center justify-between transition-all"
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-red shrink-0" /> Show Page Guide & Development Notes
        </span>
        <ChevronDown className="w-4 h-4 text-brand-red shrink-0" />
      </button>
    );
  }

  return (
    <div className="w-full mb-6 bg-white border border-brand-red/10 rounded-xl p-5 shadow-[0_8px_30px_rgb(218,41,28,0.02)] transition-all relative overflow-hidden space-y-4">
      <div className="absolute top-0 left-0 h-full w-1 bg-brand-red"></div>
      
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-brand-charcoal">
            <Shield className="w-4 h-4 text-brand-red shrink-0" />
            <h3 className="font-serif text-base font-bold tracking-tight">{title}</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-brand-silver hover:text-brand-charcoal text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            Hide Guide <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-brand-silver leading-relaxed">
          {description}
        </p>
      </div>

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

      {cautions.length > 0 && (
        <div className="border-t border-red-100/60 pt-3 bg-red-50/40 p-3.5 rounded-xl border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest">Serious Attention & Cautionary Actions:</h4>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {cautions.map((caution, idx) => (
              <li key={idx} className="text-xs text-red-900 font-semibold leading-relaxed">
                {caution}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
