export default function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white border border-brand-border rounded-crm p-5 shadow-sm ${className}`}>
      {title && <h3 className="font-serif text-lg font-bold text-brand-text mb-4">{title}</h3>}
      {children}
    </div>
  );
}
