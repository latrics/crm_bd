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
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExportCSV = () => {
    if (state.tenders.length === 0) return;
    const headers = Object.keys(state.tenders[0]).filter(k => k !== '__v');
    const csvRows = [];
    csvRows.push(headers.join(','));
    state.tenders.forEach(tender => {
      const values = headers.map(header => {
        let val = tender[header] === null || tender[header] === undefined ? '' : tender[header].toString();
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "tenders_export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (state.tenders.length === 0) return;
    const blob = new Blob([JSON.stringify(state.tenders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "tenders_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

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
        
        <div className="flex items-center gap-3">
          <button onClick={openNew} className="bg-brand-red text-white font-bold text-sm rounded-xl px-8 py-3 cursor-pointer hover:opacity-90 shadow-md flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Tender
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setExportMenuOpen(!exportMenuOpen)} 
              className="p-3 bg-white border border-brand-border text-brand-silver rounded-xl hover:bg-gray-50 hover:text-brand-text transition-all shadow-sm flex items-center justify-center"
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
