export default function AdminStatCard({ label, value, icon, badgeCount }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-50 text-brand-text flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <div className="font-serif text-2xl font-bold text-brand-charcoal leading-none mb-1">
            {value}
          </div>
          <div className="text-[10px] font-semibold text-brand-silver uppercase tracking-wider">
            {label}
          </div>
        </div>
      </div>
      {badgeCount > 0 && (
        <div className="bg-brand-red text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {badgeCount}
        </div>
      )}
    </div>
  );
}

