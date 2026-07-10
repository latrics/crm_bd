import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useCRM from '../hooks/useCRM.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import DealsView from '../components/deals/DealsView.jsx';
import Modal from '../components/common/Modal.jsx';
import Field from '../components/common/Field.jsx';
import DocsPanel from '../components/docs/DocsPanel.jsx';
import Confirm from '../components/common/Confirm.jsx';
import { createDeal, updateDeal, deleteDeal, revertDeal } from '../api/dealsApi.js';
import useToast from '../hooks/useToast.js';
import { DEAL_STAGES, LEAD_STAGES, OWNERS, SECTORS, DEAL_COLORS } from '../constants/index.js';

export default function DealsPage() {
  const { state, dispatch } = useCRM();
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [revertConfirm, setRevertConfirm] = useState(false);
  const [revertStage, setRevertStage] = useState('Prospecting');
  const [search, setSearch] = useState('');
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban'); // kanban or list
  const [activeStageFilter, setActiveStageFilter] = useState('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    if (location.state?.highlightDealId) {
      const dealIdToEdit = location.state.highlightDealId;
      const deal = state.deals?.find(l => l._id === dealIdToEdit || l.dealId === dealIdToEdit);
      if (deal) {
        setSelectedDeal(deal);
        setFormData({ ...deal });
        setErrors({});
        setModalOpen(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, state.deals]);


  const statusStats = DEAL_STAGES.map(stage => ({
    key: stage,
    label: stage.toUpperCase(),
    count: state.deals.filter(d => d.stage === stage).length,
    color: DEAL_COLORS[stage] || '#8A8D8F'
  }));

  // ... (keep the export functions same) ...
  const handleExportCSV = () => {
    if (state.deals.length === 0) return;
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
    if (state.deals.length === 0) return;
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
    setFormData({ title: '', company: '', contact: '', value: 0, stage: 'Negotiation', probability: 50, owner: '', sector: '', notes: '', close_date: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (deal) => {
    setSelectedDeal(deal);
    setFormData({ ...deal });
    setErrors({});
    setModalOpen(true);
  };

  const handleChange = (field, val) => {
    setFormData(p => ({ ...p, [field]: val }));
    if (errors[field]) {
      setErrors(p => ({ ...p, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast({ type: 'error', message: 'Please fill in all compulsory fields' });
      return;
    }

    try {
      let finalData = { ...formData };
      if (selectedDeal) {
        const res = await updateDeal(selectedDeal._id, finalData);
        dispatch({ type: 'UPDATE_DEAL', payload: res.data });
        addToast({ type: 'success', message: 'Deal updated' });
      } else {
        const res = await createDeal(finalData);
        dispatch({ type: 'ADD_DEAL', payload: res.data });
        addToast({ type: 'success', message: 'Deal created' });
      }
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error saving deal' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal(selectedDeal._id);
      dispatch({ type: 'DELETE_DEAL', payload: selectedDeal._id });
      addToast({ type: 'success', message: 'Deal deleted' });
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error deleting deal' });
    }
    setDeleteConfirm(false);
  };

  const handleRevert = async () => {
    try {
      const targetIds = selectedDeal ? [selectedDeal._id] : selectedDeals;
      for (const id of targetIds) {
        const res = await revertDeal(id, revertStage);
        dispatch({ type: 'DELETE_DEAL', payload: id });
        
        if (res?.data?.leadId) {
            const leadToUpdate = state.leads?.find(l => l._id === res.data.leadId);
            if (leadToUpdate) {
                dispatch({ type: 'UPDATE_LEAD', payload: { ...leadToUpdate, status: revertStage }});
            }
        }
      }
      addToast({ type: 'success', message: `Deal(s) reverted to ${revertStage}` });
      setSelectedDeals([]);
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error reverting deal' });
    }
    setRevertConfirm(false);
  };

  const handleDeleteClick = (deal) => {
    setSelectedDeal(deal);
    setDeleteConfirm(true);
  };

  const handleRevertClick = (deal) => {
    setSelectedDeal(deal);
    setRevertConfirm(true);
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedDeals) {
        await deleteDeal(id);
        dispatch({ type: 'DELETE_DEAL', payload: id });
      }
      addToast({ type: 'success', message: `${selectedDeals.length} deals deleted` });
      setSelectedDeals([]);
      setBulkDeleteConfirm(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error deleting deals' });
    }
  };

  const toggleSelectAll = (filteredDealsIds) => {
    if (selectedDeals.length === filteredDealsIds.length && filteredDealsIds.length > 0) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(filteredDealsIds);
    }
  };

  const toggleSelect = (id) => {
    setSelectedDeals(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  const handleStageUpdate = async (deal, newStage) => {
    try {
      const res = await updateDeal(deal._id, { ...deal, stage: newStage });
      dispatch({ type: 'UPDATE_DEAL', payload: res.data });
      addToast({ type: 'success', message: `Moved to ${newStage}` });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error updating stage' });
    }
  };

  if (state.loading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 px-6">
        <PageHeader 
          title="Deal Pipeline" 
          subtitle="Pipeline stages • auto-saved"
        />
        <div className="flex flex-col items-center justify-center py-20 mt-12 bg-white rounded-crm border border-brand-border shadow-sm">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-bold text-brand-text mb-1">Loading Deals...</h3>
          <p className="text-sm text-brand-silver">Syncing data from the server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12 px-6">
      <PageHeader 
        title="Deal Pipeline" 
        subtitle="Pipeline stages • auto-saved"
      />

      <div className="grid grid-cols-4 gap-0 border border-brand-border rounded-crm bg-white overflow-hidden mb-8 shadow-sm">
        {statusStats.map((stat, i) => (
          <div 
            key={stat.label} 
            onClick={() => setActiveStageFilter(activeStageFilter === stat.key ? 'all' : stat.key)}
            className={`p-6 text-center border-r border-brand-border last:border-0 cursor-pointer transition-colors ${activeStageFilter === stat.key ? 'bg-brand-redLight' : 'hover:bg-gray-50'}`}
          >
            <div className="text-2xl font-serif font-black mb-1" style={{ color: i === 0 || i === 2 || i === 5 ? '#DA291C' : '#54585A' }}>
              {stat.count}
            </div>
            <div className="text-[10px] font-bold text-brand-silver tracking-widest leading-tight uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* VIEW TOGGLE & TOOLBAR SECTION */}
      <div className="bg-white p-4 rounded-crm border border-brand-border shadow-sm mb-8 flex flex-col gap-4">
        
        {/* Top Row: View Toggle */}
        <div className="flex justify-between items-center border-b border-brand-border pb-4">
          <div className="flex bg-brand-surfaceAlt rounded-lg p-1 border border-brand-border">
            <button 
              onClick={() => setActiveTab('kanban')}
              className={`px-6 py-1.5 text-sm font-bold rounded shadow-sm transition-all ${activeTab === 'kanban' ? 'bg-white text-brand-red' : 'text-brand-silver'}`}
            >
              Card View (Kanban)
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-6 py-1.5 text-sm font-bold rounded transition-all ${activeTab === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-brand-silver'}`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search and Filters */}
          <div className="flex flex-1 w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-brand-silver/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search deals..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-brand-surfaceAlt/50 border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 transition-all"
              />
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm font-bold text-brand-text hover:bg-gray-50 transition-all shadow-sm">
              <svg className="w-4 h-4 text-brand-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm font-bold text-brand-text hover:bg-gray-50 transition-all shadow-sm">
              <svg className="w-4 h-4 text-brand-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
              <span className="hidden sm:inline">Sort</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button onClick={openNew} className="px-5 py-2.5 bg-brand-red text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-md transition-all flex items-center gap-2">
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

        {/* Contextual Action Bar (Shows when items are selected) */}
        {selectedDeals.length > 0 && (
          <>
            <hr className="border-brand-border" />
            <div className="flex justify-start items-center gap-4 min-h-[36px]">
              <div className="flex items-center gap-3 bg-brand-surfaceAlt px-4 py-2 rounded-xl border border-brand-border">
                <span className="text-sm font-bold text-brand-text flex items-center gap-2 mr-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-xs">{selectedDeals.length}</span>
                  Selected
                </span>
                
                <button onClick={() => { setSelectedDeal(null); setRevertConfirm(true); }} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-bold text-brand-text hover:bg-gray-50 transition-all shadow-sm">
                  <svg className="w-3.5 h-3.5 text-brand-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Revert to Lead
                </button>
                
                <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-redLight border border-brand-red/20 rounded-lg text-xs font-bold text-brand-red hover:bg-red-100 transition-all shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {activeTab === 'kanban' ? (
        <DealsView 
          onDealClick={openEdit} 
          onDeleteClick={handleDeleteClick}
          onRevertClick={handleRevertClick}
          onStageUpdate={handleStageUpdate}
          activeStageFilter={activeStageFilter}
          search={search} 
          selectedDeals={selectedDeals}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      ) : (
        <DealsListView 
          onDealClick={openEdit} 
          onDeleteClick={handleDeleteClick}
          onRevertClick={handleRevertClick}
          onStageUpdate={handleStageUpdate}
          activeStageFilter={activeStageFilter}
          search={search}
          selectedDeals={selectedDeals}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      {state.deals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-brand-silver text-sm font-bold opacity-50">
          No deals found.
        </div>
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
            <Field label="Close Date" type="date" value={formData.close_date ? new Date(formData.close_date).toISOString().split('T')[0] : ''} onChange={e => handleChange('close_date', e.target.value)} />
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
      <Confirm 
        isOpen={bulkDeleteConfirm} 
        onClose={() => setBulkDeleteConfirm(false)} 
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedDeals.length} Deals`} 
        message={`Are you sure you want to delete ${selectedDeals.length} selected deals? This action cannot be undone.`} 
      />

      <Modal isOpen={revertConfirm} onClose={() => setRevertConfirm(false)}>
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">Revert Deal to Lead</h2>
          <p className="text-sm text-brand-silver mt-1">
            This will remove the Deal record and reinstate the associated Lead into your selected stage.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Field 
            label="Target Lead Stage" 
            type="select" 
            options={LEAD_STAGES.filter(s => s !== 'Closure' && s !== 'Converted')} 
            value={revertStage} 
            onChange={e => setRevertStage(e.target.value)} 
          />
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setRevertConfirm(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleRevert} className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Revert to Lead</button>
        </div>
      </Modal>
    </div>
  );
}
