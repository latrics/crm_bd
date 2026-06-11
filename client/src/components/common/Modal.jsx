export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-brand-charcoal/55 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white border border-brand-border rounded-2xl p-10 max-w-[800px] w-full max-h-[95vh] overflow-y-auto relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-silver hover:text-brand-text text-xl">&times;</button>
        {children}
      </div>
    </div>
  );
}
