export default function Field({ label, type = 'text', value, onChange, options, error, required, placeholder }) {
  const inputClass = `w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-silver shadow-sm transition-all ${error ? 'bg-brand-redLight border-brand-red' : ''}`;
  
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-xs font-bold text-brand-text uppercase tracking-wide">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      {type === 'select' ? (
        <select className={inputClass} value={value} onChange={onChange}>
          <option value="">{placeholder || '-- Select --'}</option>
          {options?.map(o => (
            <option key={o.v ?? o.value ?? o} value={o.v ?? o.value ?? o}>{o.l ?? o.label ?? o}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea className={inputClass} value={value} onChange={onChange} rows={3} />
      ) : (
        <input type={type} className={inputClass} value={value} onChange={onChange} />
      )}
      {error && <span className="text-[10px] text-brand-red">{error}</span>}
    </div>
  );
}
