import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, children }) {
  const containerRef = useRef(null);
  const initialValuesRef = useRef(null);

  // Capture the form state immediately after opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const el = containerRef.current;
        if (el) {
          const inputs = el.querySelectorAll('input:not([type="hidden"]), textarea, select');
          initialValuesRef.current = Array.from(inputs).map(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
              return input.checked;
            }
            return input.value;
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      initialValuesRef.current = null;
    }
  }, [isOpen]);

  const checkFormDirty = () => {
    const el = containerRef.current;
    if (!el || !initialValuesRef.current) return false;

    const currentInputs = el.querySelectorAll('input:not([type="hidden"]), textarea, select');
    
    // Check if any value has changed from the initial saved state
    for (let i = 0; i < currentInputs.length; i++) {
      const input = currentInputs[i];
      const initialVal = initialValuesRef.current[i];
      const currentVal = (input.type === 'checkbox' || input.type === 'radio') ? input.checked : input.value;
      
      if (currentVal !== initialVal) {
        return true;
      }
    }

    return false;
  };

  const confirmClose = () => {
    if (checkFormDirty()) {
      return window.confirm("You have unsaved changes. Are you sure you want to close this popup? Any changes you made will be lost.");
    }
    return true;
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmClose()) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (confirmClose()) {
        onClose();
      }
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-brand-charcoal/55 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
    >
      <div 
        ref={containerRef}
        className="bg-white border border-brand-border rounded-2xl p-10 max-w-[800px] w-full max-h-[95vh] overflow-y-auto relative shadow-2xl"
      >
        <button 
          onClick={() => {
            if (confirmClose()) {
              onClose();
            }
          }} 
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
