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
  const { state, dispatch } = useCRM();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExportCSV = () => {
    if (!state.deals || state.deals.length === 0) return;
    const headers = Object.keys(state.deals[0]).filter(k => k !== '__v');
    const csvRows = [];
    csvRows.push(headers.join(','));
    state.deals.forEach(deal => {
      const values = headers.map(header => {
        let val = deal[header] === null || deal[header] === undefined ? '' : deal[header].toString();
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "deals_export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (!state.deals || state.deals.length === 0) return;
    const blob = new Blob([JSON.stringify(state.deals, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "deals_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

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
        
        <div className="flex items-center gap-3">
          <button onClick={openNew} className="bg-brand-red text-white font-bold text-sm rounded-xl px-6 py-2.5 cursor-pointer hover:opacity-90 shadow-md flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Deal
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setExportMenuOpen(!exportMenuOpen)} 
              className="p-2.5 bg-white border border-brand-border text-brand-silver rounded-xl hover:bg-gray-50 hover:text-brand-text transition-all shadow-sm flex items-center justify-center"
              title="Export Options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </button>
            
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-border z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-sm text-brand-text font-bold hover:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Export as CSV
                  </button>
                  <button onClick={handleExportJSON} className="w-full text-left px-4 py-2.5 text-sm text-brand-text font-bold hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50">
                    <svg className="w-4 h-4 text-brand-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export as JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
