import { useState } from 'react';
import useCRM from '../hooks/useCRM.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import DealsView from '../components/deals/DealsView.jsx';
import DealsListView from '../components/deals/DealsListView.jsx';
import Modal from '../components/common/Modal.jsx';
import Field from '../components/common/Field.jsx';
import DocsPanel from '../components/docs/DocsPanel.jsx';
import Confirm from '../components/common/Confirm.jsx';
import { createDeal, updateDeal, deleteDeal, revertDeal } from '../api/dealsApi.js';
import useToast from '../hooks/useToast.js';
import { DEAL_STAGES, OWNERS, SECTORS } from '../constants/index.js';

export default function DealsPage() {
  const { dispatch } = useCRM();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban');

  const openNew = () => {
    setSelectedDeal(null);
    setFormData({ title: '', company: '', contact: '', stage: 'Negotiation', value: '', probability: 30, close_date: '', owner: 'Sivaram B', sector: 'Mining', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (deal) => {
    setSelectedDeal(deal);
    setFormData({ ...deal });
    setModalOpen(true);
  };

  const handleChange = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      addToast({ type: 'error', message: 'Deal Title is required' });
      return;
    }

    try {
      if (selectedDeal) {
        const res = await updateDeal(selectedDeal._id, formData);
        dispatch({ type: 'UPDATE_DEAL', payload: res.data });
        addToast({ type: 'success', message: 'Deal updated' });
      } else {
        const res = await createDeal(formData);
        dispatch({ type: 'ADD_DEAL', payload: res.data });
        addToast({ type: 'success', message: 'Deal created' });
      }
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error saving deal' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal(selectedDeal._id);
      dispatch({ type: 'DELETE_DEAL', payload: selectedDeal._id });
      addToast({ type: 'success', message: 'Deal deleted' });
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error deleting deal' });
    }
    setDeleteConfirm(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12 px-6">
      <PageHeader 
        title="Deal Pipeline" 
        subtitle="Kanban and list view • persistent storage"
      />

      <div className="flex justify-between items-center mb-8">
        <div className="flex bg-brand-surfaceAlt rounded-lg p-1 border border-brand-border">
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`px-6 py-1.5 text-sm font-bold rounded shadow-sm transition-all ${activeTab === 'kanban' ? 'bg-white text-brand-red' : 'text-brand-silver'}`}
          >
            Kanban
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-6 py-1.5 text-sm font-bold rounded transition-all ${activeTab === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-brand-silver'}`}
          >
            List
          </button>
        </div>
        <button onClick={openNew} className="bg-brand-red text-white font-bold text-sm rounded-xl px-6 py-2.5 cursor-pointer hover:opacity-90 shadow-md">
          + Add Deal
        </button>
      </div>

      {activeTab === 'kanban' ? (
        <DealsView onDealClick={openEdit} />
      ) : (
        <DealsListView onDealClick={openEdit} onDeleteClick={(deal) => { setSelectedDeal(deal); setDeleteConfirm(true); }} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">{selectedDeal ? 'Edit Deal' : 'New Deal'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Deal Title" value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
            <Field label="Company" value={formData.company} onChange={e => handleChange('company', e.target.value)} />
            <Field label="Contact" value={formData.contact} onChange={e => handleChange('contact', e.target.value)} />
            <Field label="Value (Rs.)" type="number" value={formData.value} onChange={e => handleChange('value', e.target.value)} />
            <Field label="Probability %" type="number" value={formData.probability} onChange={e => handleChange('probability', e.target.value)} />
            <Field label="Stage" type="select" options={DEAL_STAGES} value={formData.stage} onChange={e => handleChange('stage', e.target.value)} />
            <Field label="Close Date" type="date" value={formData.close_date} onChange={e => handleChange('close_date', e.target.value)} />
            <Field label="Owner" type="select" options={OWNERS} value={formData.owner} onChange={e => handleChange('owner', e.target.value)} />
          </div>
          <Field label="Sector" type="select" options={SECTORS} value={formData.sector} onChange={e => handleChange('sector', e.target.value)} />
          <Field label="Notes" type="textarea" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} />

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2">Cancel</button>
            <button type="submit" className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Save Deal</button>
          </div>
        </form>

        {selectedDeal && (
          <div className="mt-8 border-t border-brand-border pt-8 flex flex-col gap-6">
            <DocsPanel entityId={selectedDeal._id} entityType="deal" />
            
            <div className="flex justify-between items-center border-t border-brand-border pt-6 mt-4">
              <button type="button" onClick={() => setDeleteConfirm(true)} className="text-brand-red font-bold text-xs hover:underline">Delete Deal</button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm 
        isOpen={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)} 
        onConfirm={handleDelete}
        title="Delete Deal" 
        message="Are you sure you want to delete this deal? This action cannot be undone." 
      />
    </div>
  );
}
