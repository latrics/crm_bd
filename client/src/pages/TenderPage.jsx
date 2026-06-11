import { useState } from 'react';
import useCRM from '../hooks/useCRM.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import TenderView from '../components/tenders/TenderView.jsx';
import TenderForm from '../components/tenders/TenderForm.jsx';
import Modal from '../components/common/Modal.jsx';
import Confirm from '../components/common/Confirm.jsx';
import { deleteTender } from '../api/tendersApi.js';
import useToast from '../hooks/useToast.js';
import { T_STATUSES } from '../constants/index.js';

export default function TenderPage() {
  const { state, dispatch } = useCRM();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total', count: state.tenders.length, icon: 'bg-brand-charcoal', colorClass: 'text-brand-charcoal' },
    { label: 'Active', count: state.tenders.filter(t => !['Won', 'Lost'].includes(t.status)).length, icon: 'bg-blue-600', colorClass: 'text-blue-600' },
    { label: 'Won', count: state.tenders.filter(t => t.status === 'Won').length, icon: 'bg-brand-green', colorClass: 'text-brand-green' },
    { label: 'Lost', count: state.tenders.filter(t => t.status === 'Lost').length, icon: 'bg-brand-red', colorClass: 'text-brand-red' },
    { label: 'Total Value', count: '--', icon: 'bg-brand-charcoal', colorClass: 'text-brand-charcoal' },
    { label: 'Won Value', count: '--', icon: 'bg-brand-green', colorClass: 'text-brand-green' },
  ];

  const statusFilters = T_STATUSES.map(s => ({
    label: s.toUpperCase(),
    count: state.tenders.filter(t => t.status === s).length,
    color: s === 'Won' ? 'text-brand-green' : s === 'Lost' ? 'text-brand-red' : 'text-brand-text'
  }));

  const openNew = () => {
    setSelectedTender(null);
    setModalOpen(true);
  };

  const openEdit = (tender) => {
    setSelectedTender(tender);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteTender(selectedTender._id);
      dispatch({ type: 'DELETE_TENDER', payload: selectedTender._id });
      addToast({ type: 'success', message: 'Tender deleted' });
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error deleting tender' });
    }
    setDeleteConfirm(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <PageHeader 
        title="Tender Management" 
        subtitle="Tender tracking • EMD • JV • persistent storage"
      />

      <div className="grid grid-cols-6 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${stat.icon || 'bg-brand-silver'}`}></div>
            </div>
            <div>
              <div className={`text-xl font-serif font-black mb-1 ${stat.colorClass}`}>
                {stat.count}
              </div>
              <div className="text-[10px] font-bold text-brand-silver tracking-widest uppercase">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 border border-brand-border rounded-xl bg-white overflow-hidden mb-8 shadow-sm">
        {statusFilters.map((stat) => (
          <div key={stat.label} className="p-4 text-center border-r border-brand-border last:border-0 hover:bg-brand-surfaceAlt cursor-pointer transition-colors">
            <div className={`text-lg font-serif font-black mb-1 ${stat.color}`}>
              {stat.count}
            </div>
            <div className="text-[8px] font-bold text-brand-silver tracking-widest leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-8 items-center">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search tenders..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm outline-none focus:border-brand-silver shadow-sm"
          />
        </div>
        <select className="bg-white border border-brand-border rounded-lg px-4 py-2 text-sm text-brand-text outline-none">
          <option>All Locations</option>
        </select>
        <button className="bg-brand-charcoal text-white font-bold text-xs rounded-lg px-6 py-2 cursor-pointer hover:opacity-90">CSV</button>
        <button onClick={openNew} className="bg-brand-red text-white font-bold text-sm rounded-xl px-8 py-3 cursor-pointer hover:opacity-90 shadow-md">+ Add Tender</button>
      </div>

      <TenderView onTenderClick={openEdit} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">{selectedTender ? 'Edit Tender' : 'Add Tender'}</h2>
        </div>

        <TenderForm 
          initialData={selectedTender} 
          onClose={() => setModalOpen(false)} 
        />
        
        {selectedTender && (
          <div className="flex justify-end mt-4 pt-4 border-t border-brand-border">
             <button type="button" onClick={() => setDeleteConfirm(true)} className="text-brand-red font-bold text-xs hover:underline">Delete Tender</button>
          </div>
        )}
      </Modal>

      <Confirm 
        isOpen={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)} 
        onConfirm={handleDelete}
        title="Delete Tender" 
        message="Are you sure you want to delete this tender? This action cannot be undone." 
      />
    </div>
  );
}
