import { useState, useEffect } from 'react';
import Field from '../common/Field.jsx';
import { T_STATUSES, T_EMD, T_JV } from '../../constants/index.js';
import useCRM from '../../hooks/useCRM.js';
import { createTender, updateTender } from '../../api/tendersApi.js';
import useToast from '../../hooks/useToast.js';

export default function TenderForm({ initialData, onClose }) {
  const { state, dispatch } = useCRM();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    latrics_tender_id: '', tender_id: '', tender_no: '', portal: '', doc_link: '', authority: '', description: '', location: '', opening_date: '', closing_date: '',
    amount: '', emd: 'EMD Exempted', emd_amount: 0, jv: 'JV Not Allowed', jv_partner: '', status: 'New', notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData });
  }, [initialData]);

  const handleChange = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload = { ...formData };
      if (!payload.tender_no || !payload.tender_no.trim()) {
        payload.tender_no = payload.tender_id || payload.latrics_tender_id || 'TND-UNNAMED';
      }

      if (initialData?._id) {
        const res = await updateTender(initialData._id, payload);
        dispatch({ type: 'UPDATE_TENDER', payload: res.data });
        addToast({ type: 'success', message: 'Tender updated' });
      } else {
        const res = await createTender(payload);
        dispatch({ type: 'ADD_TENDER', payload: res.data });
        addToast({ type: 'success', message: 'Tender created' });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-brand-red text-sm bg-brand-redLight p-2 rounded mb-2">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <Field 
          label="Latrics Tender ID" 
          value={formData.latrics_tender_id || ''} 
          onChange={e => handleChange('latrics_tender_id', e.target.value)} 
          placeholder="Auto-generated if left blank (e.g. LTR-TND-000001)"
        />
        <Field 
          label="Tender ID" 
          value={formData.tender_id || ''} 
          onChange={e => handleChange('tender_id', e.target.value)} 
          placeholder="Portal / Government Tender ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Authority" value={formData.authority} onChange={e => handleChange('authority', e.target.value)} required />
        <Field 
          label="Portal" 
          value={formData.portal || ''} 
          onChange={e => handleChange('portal', e.target.value)} 
          placeholder="Enter portal (e.g. GEM, Pureways, CPPP)"
        />
      </div>

      <Field 
        label="Doc Link (URL for Tender Docs)" 
        value={formData.doc_link || ''} 
        onChange={e => handleChange('doc_link', e.target.value)} 
        placeholder="https://drive.google.com/... or document link"
      />

      <Field label="Description" value={formData.description} onChange={e => handleChange('description', e.target.value)} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Location" value={formData.location} onChange={e => handleChange('location', e.target.value)} />
        <Field label="Amount (Rs.)" type="number" value={formData.amount} onChange={e => handleChange('amount', e.target.value)} />
        
        <Field label="Opening Date" type="date" value={formData.opening_date} onChange={e => handleChange('opening_date', e.target.value)} />
        <Field label="Closing Date" type="date" value={formData.closing_date} onChange={e => handleChange('closing_date', e.target.value)} />
      </div>

      <div className="p-4 bg-brand-surfaceAlt border border-brand-border rounded-lg flex flex-col gap-4">
        <h3 className="text-[13px] font-bold text-brand-text">EMD</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="EMD Status" type="select" options={T_EMD} value={formData.emd} onChange={e => handleChange('emd', e.target.value)} />
          {formData.emd === 'EMD Paid' && (
            <Field label="EMD Amount" type="number" value={formData.emd_amount} onChange={e => handleChange('emd_amount', e.target.value)} />
          )}
        </div>
      </div>

      <div className="p-4 bg-brand-surfaceAlt border border-brand-border rounded-lg flex flex-col gap-4">
        <h3 className="text-[13px] font-bold text-brand-text">Joint Venture</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="JV Type" type="select" options={T_JV} value={formData.jv} onChange={e => handleChange('jv', e.target.value)} />
          {formData.jv === 'JV' && (
            <Field label="JV Partner" value={formData.jv_partner} onChange={e => handleChange('jv_partner', e.target.value)} />
          )}
        </div>
      </div>

      <div className="w-1/2 pr-2">
        <Field label="Status" type="select" options={T_STATUSES} value={formData.status} onChange={e => handleChange('status', e.target.value)} />
      </div>

      <Field label="Notes" type="textarea" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} />

      <div className="flex justify-end gap-3 mt-2">
        <button type="button" onClick={onClose} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2">Cancel</button>
        <button type="submit" className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Save Tender</button>
      </div>
    </form>
  );
}
