import { useState } from 'react';
import { reportBug } from '../api/bugApi.js';
import useToast from '../hooks/useToast.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import Field from '../components/common/Field.jsx';

export default function BugCenterPage() {
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [loading, setLoading] = useState(false);

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
      setTitle('');
      setSeverity('medium');
      setDescription('');
      setStepsToReproduce('');
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
    <div className="w-full pb-12">


      <div className="bg-white p-6 sm:p-8 rounded-crm border border-brand-border shadow-sm mt-8">
        <h2 className="text-lg font-serif font-black text-brand-text mb-6 pb-2 border-b border-brand-border">
          Submit Bug Report
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field 
            label="Bug Title / Short Summary" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
            placeholder="e.g. Lead details modal fails to open on click"
          />

          <div className="w-1/2">
            <Field 
              label="Severity Level" 
              type="select" 
              options={['low', 'medium', 'high', 'critical']} 
              value={severity} 
              onChange={e => setSeverity(e.target.value)} 
            />
          </div>

          <Field 
            label="Detailed Description" 
            type="textarea"
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            required 
            placeholder="Describe what happened, what you expected, and any errors you observed."
          />

          <Field 
            label="Steps to Reproduce" 
            type="textarea"
            value={stepsToReproduce} 
            onChange={e => setStepsToReproduce(e.target.value)} 
            placeholder="1. Go to Leads page&#10;2. Click on lead X&#10;3. Observe error..."
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-brand-border pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-brand-red text-white font-bold text-sm rounded-xl px-6 py-2.5 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
