export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-brand-charcoal/55 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white border border-brand-border rounded-2xl p-10 max-w-[800px] w-full max-h-[95vh] overflow-y-auto relative shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-brand-red flex items-center justify-center transition-all shadow-sm cursor-pointer border border-transparent hover:border-red-100"
          aria-label="Close"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
