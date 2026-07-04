import { useState } from 'react';
import useCRM from '../hooks/useCRM.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import LeadsView from '../components/leads/LeadsView.jsx';
import Modal from '../components/common/Modal.jsx';
import Field from '../components/common/Field.jsx';
import BANTSection from '../components/leads/BANTSection.jsx';
import DocsPanel from '../components/docs/DocsPanel.jsx';
import Confirm from '../components/common/Confirm.jsx';
import ImportWizard from '../components/leads/ImportWizard.jsx';
import { createLead, updateLead, deleteLead, deleteMultipleLeads, convertLead, resetLeadCounter, updateMultipleLeads } from '../api/leadsApi.js';
import useToast from '../hooks/useToast.js';
import { LEAD_STAGES, SOURCES, OWNERS, SECTORS, STG_COLORS } from '../constants/index.js';
import { bantScore, bantCat } from '../utils/bantHelpers.js';

export default function LeadsPage() {
  const { state, dispatch } = useCRM();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({ status: '', outbound: '', owner: '', industry: '', customOutbound: '' });

  const statusStats = LEAD_STAGES.map(stage => ({
    key: stage,
    label: stage.toUpperCase(),
    count: state.leads.filter(l => l.status === stage).length,
    color: STG_COLORS[stage] || '#8A8D8F'
  }));

  const filterTabs = [
    { key: 'all', label: 'All Leads', color: 'bg-brand-red' },
    { key: 'hot', label: 'Hot', color: 'bg-brand-redLight text-brand-red' },
    { key: 'warm', label: 'Warm', color: 'bg-orange-100 text-orange-600' },
    { key: 'cold', label: 'Cold', color: 'bg-blue-100 text-blue-600' },
    { key: 'nurture', label: 'Nurture', color: 'bg-green-100 text-green-600' },
    { key: 'unscored', label: 'Unscored', color: 'bg-gray-100 text-gray-600' },
    { key: 'unassigned', label: 'Unassigned', color: 'bg-purple-100 text-purple-600' },
  ];

  const getCount = (key) => {
    if (key === 'all') return state.leads.length;
    if (key === 'unassigned') return state.leads.filter(l => !l || !l.owner).length;
    return state.leads.filter(l => {
      const score = bantScore(l);
      return bantCat(score).label.toLowerCase() === key;
    }).length;
  };

  const openNew = () => {
    setSelectedLead(null);
    setFormData({ decisionMaker: '', company: '', email: '', phone: '', value: 0, status: 'Leads', outbound: '', owner: '', industry: '', remarks: '', city: '', state: '', designation: '', bant_b: 0, bant_a: 0, bant_n: 0, bant_t: 0 });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({ ...lead });
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
    if (!formData.company?.trim()) newErrors.company = 'Company is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
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
      if (selectedLead) {
        const res = await updateLead(selectedLead._id, formData);
        dispatch({ type: 'UPDATE_LEAD', payload: res.data });
        addToast({ type: 'success', message: 'Lead updated' });
      } else {
        const res = await createLead(formData);
        dispatch({ type: 'ADD_LEAD', payload: res.data });
        addToast({ type: 'success', message: 'Lead created' });
      }
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error saving lead' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead(selectedLead._id);
      dispatch({ type: 'DELETE_LEAD', payload: selectedLead._id });
      addToast({ type: 'success', message: 'Lead deleted' });
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error deleting lead' });
    }
    setDeleteConfirm(false);
  };

  const handleDeleteClick = (lead) => {
    setSelectedLead(lead);
    setDeleteConfirm(true);
  };

  const handleBulkDelete = async () => {
    try {
      await deleteMultipleLeads(selectedLeads);
      // Dispatch could be modified to handle multiple, or just fetch again. 
      // For now, let's dispatch multiple DELETE_LEAD or just reload.
      selectedLeads.forEach(id => dispatch({ type: 'DELETE_LEAD', payload: id }));
      addToast({ type: 'success', message: `${selectedLeads.length} leads deleted` });
      setSelectedLeads([]);
      setBulkDeleteConfirm(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error deleting leads' });
    }
  };

  const handleResetCounter = async () => {
    if (window.confirm("Are you sure you want to reset the Lead ID sequence back to 1? Only do this if you have deleted all existing leads.")) {
      try {
        await resetLeadCounter();
        addToast({ type: 'success', message: 'Lead ID sequence reset to 1 successfully' });
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Error resetting sequence' });
      }
    }
  };

  const handleBulkUpdateSubmit = async () => {
    try {
      let finalData = {};
      if (bulkUpdateData.status) finalData.status = bulkUpdateData.status;
      if (bulkUpdateData.owner) finalData.owner = bulkUpdateData.owner;
      if (bulkUpdateData.industry) finalData.industry = bulkUpdateData.industry;
      
      if (bulkUpdateData.outbound) {
        if (bulkUpdateData.outbound === 'Others') {
           if (bulkUpdateData.customOutbound) finalData.outbound = bulkUpdateData.customOutbound;
        } else {
           finalData.outbound = bulkUpdateData.outbound;
        }
      }

      if (Object.keys(finalData).length === 0) {
        addToast({ type: 'error', message: 'No fields selected to update' });
        return;
      }

      await updateMultipleLeads(selectedLeads, finalData);
      
      selectedLeads.forEach(id => {
         const lead = state.leads.find(l => l._id === id);
         if (lead) dispatch({ type: 'UPDATE_LEAD', payload: { ...lead, ...finalData } });
      });
      addToast({ type: 'success', message: `${selectedLeads.length} leads updated` });
      setSelectedLeads([]);
      setBulkUpdateModalOpen(false);
      setBulkUpdateData({ status: '', outbound: '', owner: '', industry: '', customOutbound: '' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error updating leads' });
    }
  };

  const toggleSelectAll = (filteredLeadsIds) => {
    if (selectedLeads.length === filteredLeadsIds.length && filteredLeadsIds.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeadsIds);
    }
  };

  const toggleSelect = (id) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };

  const handleStageUpdate = async (lead, newStage) => {
    try {
      const res = await updateLead(lead._id, { ...lead, status: newStage });
      dispatch({ type: 'UPDATE_LEAD', payload: res.data });
      addToast({ type: 'success', message: `Moved to ${newStage}` });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error updating stage' });
    }
  };

  const handleConvert = async () => {
    try {
      const res = await convertLead(selectedLead._id);
      dispatch({ type: 'UPDATE_LEAD', payload: res.data.lead });
      dispatch({ type: 'ADD_DEAL', payload: res.data.deal });
      addToast({ type: 'success', message: 'Lead converted to Deal!' });
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Conversion failed' });
    }
  };

  if (state.loading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 px-6">
        <PageHeader 
          title="Lead Management" 
          subtitle="BANT scoring • pipeline stages • auto-saved"
        />
        <div className="flex flex-col items-center justify-center py-20 mt-12 bg-white rounded-crm border border-brand-border shadow-sm">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-bold text-brand-text mb-1">Loading Leads...</h3>
          <p className="text-sm text-brand-silver">Syncing data from the server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12 px-6">
      <PageHeader 
        title="Lead Management" 
        subtitle="BANT scoring • pipeline stages • auto-saved"
      />

      <div className="grid grid-cols-6 gap-0 border border-brand-border rounded-crm bg-white overflow-hidden mb-8 shadow-sm">
        {statusStats.map((stat, i) => (
          <div 
            key={stat.label} 
            onClick={() => setActiveStatusFilter(activeStatusFilter === stat.key ? 'all' : stat.key)}
            className={`p-6 text-center border-r border-brand-border last:border-0 cursor-pointer transition-colors ${activeStatusFilter === stat.key ? 'bg-brand-redLight' : 'hover:bg-gray-50'}`}
          >
            <div className="text-2xl font-serif font-black mb-1" style={{ color: i === 0 || i === 2 || i === 5 ? '#DA291C' : '#54585A' }}>
              {stat.count}
            </div>
            <div className="text-[10px] font-bold text-brand-silver tracking-widest leading-tight uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {filterTabs.map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${activeTab === tab.key ? 'border-transparent ' + tab.color.replace('text-', 'border-').replace('bg-', 'bg-') : 'bg-white border-brand-border text-brand-silver'}`}
            style={activeTab === tab.key && tab.key === 'all' ? { backgroundColor: '#DA291C', color: 'white' } : {}}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-white' : 'bg-brand-surfaceAlt'} ${tab.key === 'all' ? 'text-brand-red' : ''}`}>
              {getCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-10 items-center">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm outline-none focus:border-brand-silver shadow-sm transition-all"
          />
        </div>
        {selectedLeads.length > 0 && (
          <>
            {selectedLeads.length > 1 && (
              <button onClick={() => setBulkUpdateModalOpen(true)} className="bg-brand-surfaceAlt border border-brand-border text-brand-text font-bold text-sm rounded-xl px-6 py-3 cursor-pointer hover:bg-gray-100 shadow-sm transition-all">
                Update ({selectedLeads.length})
              </button>
            )}
            <button onClick={() => setBulkDeleteConfirm(true)} className="bg-brand-redLight text-brand-red font-bold text-sm rounded-xl px-6 py-3 cursor-pointer hover:bg-red-100 shadow-sm border border-brand-red/20 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Delete ({selectedLeads.length})
            </button>
          </>
        )}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <button 
            onClick={handleResetCounter} 
            className="bg-brand-surfaceAlt border border-brand-border text-brand-silver font-bold text-sm rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 shadow-sm"
            title="Reset Lead ID Sequence to 1"
          >
            Reset ID
          </button>
        )}
        <button onClick={() => setImportWizardOpen(true)} className="bg-white border border-brand-border text-brand-text font-bold text-sm rounded-xl px-8 py-3 cursor-pointer hover:bg-gray-50 shadow-md">
          Import Leads
        </button>
        <button onClick={openNew} className="bg-brand-red text-white font-bold text-sm rounded-xl px-8 py-3 cursor-pointer hover:opacity-90 shadow-md">
          + Add Lead
        </button>
      </div>

      <LeadsView 
        onLeadClick={openEdit} 
        onDeleteClick={handleDeleteClick}
        onStageUpdate={handleStageUpdate}
        activeTab={activeTab} 
        activeStatusFilter={activeStatusFilter}
        search={search} 
        selectedLeads={selectedLeads}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      {state.leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-brand-silver text-sm font-bold opacity-50">
          No leads found.
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">{selectedLead ? 'Edit Lead' : 'New Lead'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Decision Maker" value={formData.decisionMaker} onChange={e => handleChange('decisionMaker', e.target.value)} error={errors.decisionMaker} />
            <Field label="Title / Designation" value={formData.designation} onChange={e => handleChange('designation', e.target.value)} />
            <Field label="Company" value={formData.company} onChange={e => handleChange('company', e.target.value)} error={errors.company} required />
            <Field label="Email" value={formData.email} onChange={e => handleChange('email', e.target.value)} error={errors.email} required />
            <Field label="Phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
            <Field label="City" value={formData.city} onChange={e => handleChange('city', e.target.value)} />
            <Field label="State" value={formData.state} onChange={e => handleChange('state', e.target.value)} />
            <Field label="Value (Rs.)" type="number" value={formData.value} onChange={e => handleChange('value', e.target.value)} />
            <Field label="Status" type="select" options={LEAD_STAGES} value={formData.status} onChange={e => handleChange('status', e.target.value)} />
            <div className="flex flex-col gap-2">
              <Field label="Outbound (Source)" type="select" options={SOURCES} value={SOURCES.includes(formData.outbound) || !formData.outbound ? formData.outbound : 'Others'} onChange={e => handleChange('outbound', e.target.value)} />
              {(formData.outbound === 'Others' || (formData.outbound && !SOURCES.includes(formData.outbound))) && (
                <Field label="Custom Source" value={formData.outbound === 'Others' ? '' : formData.outbound} onChange={e => handleChange('outbound', e.target.value)} placeholder="Type custom source..." />
              )}
            </div>
            <Field label="Owner" type="select" options={OWNERS} value={formData.owner} onChange={e => handleChange('owner', e.target.value)} />
            <Field label="Industry" type="select" options={SECTORS} value={formData.industry} onChange={e => handleChange('industry', e.target.value)} />
          </div>
          <Field label="Remarks" type="textarea" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} />

          <BANTSection lead={formData} onChange={handleChange} />

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2">Cancel</button>
            <button type="submit" className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Save Lead</button>
          </div>
        </form>

      </Modal>

      <Confirm 
        isOpen={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)} 
        onConfirm={handleDelete}
        title="Delete Lead" 
        message="Are you sure you want to delete this lead? This action cannot be undone." 
      />
      <Confirm 
        isOpen={bulkDeleteConfirm} 
        onClose={() => setBulkDeleteConfirm(false)} 
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedLeads.length} Leads`} 
        message={`Are you sure you want to delete ${selectedLeads.length} selected leads? This action cannot be undone.`} 
      />

      <Modal isOpen={bulkUpdateModalOpen} onClose={() => setBulkUpdateModalOpen(false)}>
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">Bulk Update {selectedLeads.length} Leads</h2>
          <p className="text-sm text-brand-silver mt-1">Select the fields you want to apply to all selected leads.</p>
        </div>

        <div className="flex flex-col gap-4">
          <Field 
            label="Status" 
            type="select" 
            options={LEAD_STAGES} 
            value={bulkUpdateData.status} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, status: e.target.value })} 
          />
          <Field 
            label="Owner" 
            type="select" 
            options={OWNERS} 
            value={bulkUpdateData.owner} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, owner: e.target.value })} 
          />
          <Field 
            label="Industry" 
            type="select" 
            options={SECTORS} 
            value={bulkUpdateData.industry} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, industry: e.target.value })} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Field 
              label="Outbound (Source)" 
              type="select" 
              options={SOURCES} 
              value={bulkUpdateData.outbound} 
              onChange={e => setBulkUpdateData({ ...bulkUpdateData, outbound: e.target.value, customOutbound: '' })} 
            />
            {bulkUpdateData.outbound === 'Others' && (
              <Field 
                label="Custom Source" 
                value={bulkUpdateData.customOutbound} 
                onChange={e => setBulkUpdateData({ ...bulkUpdateData, customOutbound: e.target.value })} 
                placeholder="Type source here..."
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setBulkUpdateModalOpen(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleBulkUpdateSubmit} className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Apply Changes</button>
        </div>
      </Modal>

      <ImportWizard isOpen={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  );
}
