import { useState } from 'react';
import useCRM from '../hooks/useCRM.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import LeadsView from '../components/leads/LeadsView.jsx';
import Modal from '../components/common/Modal.jsx';
import Field from '../components/common/Field.jsx';
import BANTSection from '../components/leads/BANTSection.jsx';
import DocsPanel from '../components/docs/DocsPanel.jsx';
import Confirm from '../components/common/Confirm.jsx';
import { createLead, updateLead, deleteLead, convertLead } from '../api/leadsApi.js';
import useToast from '../hooks/useToast.js';
import { LEAD_STAGES, SOURCES, OWNERS, SECTORS, STG_COLORS } from '../constants/index.js';
import { bantScore, bantCat } from '../utils/bantHelpers.js';

export default function LeadsPage() {
  const { state, dispatch } = useCRM();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const statusStats = LEAD_STAGES.map(stage => ({
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
  ];

  const getCount = (key) => {
    if (key === 'all') return state.leads.length;
    return state.leads.filter(l => {
      const score = bantScore(l);
      return bantCat(score).label.toLowerCase() === key;
    }).length;
  };

  const openNew = () => {
    setSelectedLead(null);
    setFormData({ name: '', company: '', email: '', phone: '', value: 0, status: 'Leads', source: 'LinkedIn', owner: 'Sivaram B', sector: 'Mining', notes: '', bant_b: 0, bant_a: 0, bant_n: 0, bant_t: 0 });
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
    if (!formData.name?.trim()) newErrors.name = 'Full Name is required';
    if (!formData.company?.trim()) newErrors.company = 'Company is required';
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

  return (
    <div className="max-w-[1200px] mx-auto pb-12 px-6">
      <PageHeader 
        title="Lead Management" 
        subtitle="BANT scoring • pipeline stages • auto-saved"
      />

      <div className="grid grid-cols-6 gap-0 border border-brand-border rounded-crm bg-white overflow-hidden mb-8 shadow-sm">
        {statusStats.map((stat, i) => (
          <div key={stat.label} className={`p-6 text-center border-r border-brand-border last:border-0`}>
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

      <div className="flex gap-4 mb-10">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-brand-border rounded-full px-6 py-3 text-sm outline-none focus:border-brand-silver shadow-sm transition-all"
          />
        </div>
        <button onClick={openNew} className="bg-brand-red text-white font-bold text-sm rounded-xl px-8 py-3 cursor-pointer hover:opacity-90 shadow-md">
          + Add Lead
        </button>
      </div>

      <LeadsView 
        onLeadClick={openEdit} 
        onDeleteClick={handleDeleteClick}
        onStageUpdate={handleStageUpdate}
        activeTab={activeTab} 
        search={search} 
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
            <Field label="Full Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} error={errors.name} required />
            <Field label="Company" value={formData.company} onChange={e => handleChange('company', e.target.value)} error={errors.company} required />
            <Field label="Email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
            <Field label="Phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
            <Field label="Value (Rs.)" type="number" value={formData.value} onChange={e => handleChange('value', e.target.value)} />
            <Field label="Status" type="select" options={LEAD_STAGES} value={formData.status} onChange={e => handleChange('status', e.target.value)} />
            <Field label="Source" type="select" options={SOURCES} value={formData.source} onChange={e => handleChange('source', e.target.value)} />
            <Field label="Owner" type="select" options={OWNERS} value={formData.owner} onChange={e => handleChange('owner', e.target.value)} />
          </div>
          <Field label="Sector" type="select" options={SECTORS} value={formData.sector} onChange={e => handleChange('sector', e.target.value)} />
          <Field label="Notes" type="textarea" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} />

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
    </div>
  );
}
