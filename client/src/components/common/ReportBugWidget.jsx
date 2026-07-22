import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { reportBug } from '../../api/bugApi.js';
import { addToast } from '../../hooks/useToast.js';

export default function ReportBugWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for global custom events to trigger this modal from other menus/buttons
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-bug-report-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-bug-report-modal', handleOpenModal);
    };
  }, []);

  if (!isAuthenticated) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      await reportBug({
        title: title.trim(),
        severity,
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      });

      addToast({ type: 'success', message: 'Bug reported successfully! Thank you.' });
      
      // Reset form & close
      setTitle('');
      setSeverity('medium');
      setDescription('');
      setStepsToReproduce('');
      setIsOpen(false);
    } catch (err) {
      console.error('Error reporting bug:', err);
      addToast({
        type: 'error',
        message: err.message || 'Failed to submit bug report. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - Circle that expands to a pill on hover, perfectly centered when collapsed */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[999] flex items-center justify-start bg-brand-red text-white h-12 w-12 hover:w-[155px] rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-[#c12217] transition-all duration-300 ease-in-out cursor-pointer outline-none border-none group overflow-hidden pl-3.5"
        title="Report a bug"
      >
        <div className="flex items-center gap-2">
          {/* Warning Triangle Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="w-5 h-5 flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {/* Text: hidden when collapsed, slides/fades in when container is hovered */}
          <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap text-[10px] tracking-widest font-black">
            Report Bug
          </span>
        </div>
      </button>

      {/* Modal Backdrop & Form */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-crm border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-brand-surfaceAlt border-b border-brand-border px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-redLight flex items-center justify-center text-brand-red font-bold text-base">
                  🪲
                </div>
                <div>
                  <h3 className="font-serif text-lg font-black text-brand-text leading-tight">Report a Bug</h3>
                  <p className="text-[10px] text-brand-silver font-bold uppercase tracking-wider mt-0.5">Help us improve Latrics CRM</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-brand-silver hover:text-brand-text font-black text-lg p-1.5 hover:bg-brand-surfaceAlt/80 rounded transition-colors border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-black text-brand-silver uppercase tracking-wider mb-1">
                  Bug Summary <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead conversion page throws a white screen"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfcfc] border border-brand-border rounded-crm text-sm font-medium text-brand-text placeholder-brand-lightGrey focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-[10px] font-black text-brand-silver uppercase tracking-wider mb-1">
                  Severity Level <span className="text-brand-red">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfcfc] border border-brand-border rounded-crm text-sm font-medium text-brand-text focus:outline-none focus:border-brand-red transition-all cursor-pointer"
                >
                  <option value="low">Low (Minor UI issue, formatting, typos)</option>
                  <option value="medium">Medium (Non-blocking bug, has workaround)</option>
                  <option value="high">High (Major functional breakdown, blocked workflow)</option>
                  <option value="critical">Critical (Data loss, system crash, security issue)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-brand-silver uppercase tracking-wider mb-1">
                  Description <span className="text-brand-red">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the bug in detail, including what you expected to happen vs what actually occurred."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfcfc] border border-brand-border rounded-crm text-sm font-medium text-brand-text placeholder-brand-lightGrey focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all resize-none"
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-[10px] font-black text-brand-silver uppercase tracking-wider mb-1">
                  Steps to Reproduce (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Go to Leads Page&#10;2. Click on conversion button&#10;3. Observe the blank screen"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcfcfc] border border-brand-border rounded-crm text-sm font-medium text-brand-text placeholder-brand-lightGrey focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all resize-none"
                />
              </div>

              {/* System Metadata (Read-Only Info) */}
              <div className="bg-brand-surfaceAlt/50 border border-brand-border/60 rounded-crm p-3.5 text-[11px] font-medium text-brand-silver space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-brand-text mb-1">Captured Environment Details</div>
                <div className="flex justify-between">
                  <span className="font-bold">Page URL:</span>
                  <span className="truncate max-w-[280px] font-mono text-[10px]">{window.location.href}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Browser info:</span>
                  <span className="truncate max-w-[280px] font-mono text-[10px]">{navigator.userAgent.split(' ').pop()}</span>
                </div>
              </div>

              {/* Modal Footer / Action Buttons */}
              <div className="border-t border-brand-border pt-4 mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-brand-border rounded-crm text-xs font-bold uppercase tracking-wider text-brand-charcoal hover:bg-brand-surfaceAlt transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand-red text-white rounded-crm text-xs font-bold uppercase tracking-wider hover:bg-[#c12217] transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
