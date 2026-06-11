export default function PageHeader({ title, subtitle, rightNode }) {
  return (
    <div className="flex justify-between items-end mb-8">
      <div>
        <h1 className="font-serif text-3xl font-black text-brand-text mb-2">{title}</h1>
        {subtitle && <p className="text-brand-silver text-sm">{subtitle}</p>}
      </div>
      {rightNode && <div>{rightNode}</div>}
    </div>
  );
}
