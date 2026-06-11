import { STG_COLORS } from '../../constants/index.js';

export default function Funnel({ data }) {
  // data is array of { stage, count }
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="flex overflow-hidden rounded-xl border border-brand-border mb-6">
      {data.map((item, i) => {
        const isActive = item.count > 0;
        const bg = isActive ? STG_COLORS[item.stage] : '#F0F0F0';
        const color = isActive ? '#FFF' : '#8A8D8F';
        
        return (
          <div 
            key={item.stage} 
            className="flex-1 flex flex-col items-center justify-center p-3 relative"
            style={{ backgroundColor: bg, color }}
          >
            <div className="text-xl font-black font-serif">{item.count}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-center">{item.stage}</div>
            {i !== data.length - 1 && (
              <div 
                className="absolute right-0 top-0 h-full w-4 z-10"
                style={{ 
                  clipPath: 'polygon(0 0, 100% 50%, 0 100%)', 
                  backgroundColor: 'white',
                  transform: 'translateX(50%)'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
