import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import { createLead, updateLead, deleteLead, deleteMultipleLeads, convertLead, resetLeadCounter, updateMultipleLeads, cleanupOrphanedLeads } from '../api/leadsApi.js';
import useToast from '../hooks/useToast.js';
import { LEAD_STAGES, SOURCES, FLAT_SOURCES, SECTORS, STG_COLORS, BUSINESS_MODELS, BANT_TABS } from '../constants/index.js';
import { bantScore, bantCat } from '../utils/bantHelpers.js';
import { Search, Filter, ChevronDown, User, Users, X, Building, MapPin, Briefcase } from 'lucide-react';

export default function LeadsPage() {
  const { state, dispatch } = useCRM();
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Filtering & Sorting States
  const [leadFilter, setLeadFilter] = useState('all'); // 'all' | 'unassigned' | 'converted'
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [bantFilter, setBantFilter] = useState('all'); // 'all' | 'hot' | 'warm' | 'cold' | 'nurture' | 'unscored'
  const [ownerFilter, setOwnerFilter] = useState('all'); // 'all' | ownerName
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('latest');
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({ status: '', outbound: '', owner: '', industry: '', customIndustry: '', customOutbound: '', deadline: '' });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const ownerDropdownRef = useRef(null);

  // Parse and calculate suggestions on search change
  useEffect(() => {
    if (!search || !state.leads) {
      setSuggestions([]);
      return;
    }
    // Don't show suggestions if already searching by a parameter tag
    if (/^(state|city|company|industry):/i.test(search)) {
      setSuggestions([]);
      return;
    }

    const query = search.trim().toLowerCase();
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const uniqueStates = [...new Set(state.leads.map(l => l.state).filter(Boolean))];
    const uniqueCities = [...new Set(state.leads.map(l => l.city).filter(Boolean))];
    const uniqueCompanies = [...new Set(state.leads.map(l => l.company).filter(Boolean))];
    const uniqueIndustries = [...new Set(state.leads.map(l => l.industry).filter(Boolean))];

    const matched = [];

    uniqueStates.forEach(val => {
      if (val.toLowerCase().includes(query)) {
        matched.push({ field: 'state', value: val });
      }
    });

    uniqueCities.forEach(val => {
      if (val.toLowerCase().includes(query)) {
        matched.push({ field: 'city', value: val });
      }
    });

    uniqueCompanies.forEach(val => {
      if (val.toLowerCase().includes(query)) {
        matched.push({ field: 'company', value: val });
      }
    });

    uniqueIndustries.forEach(val => {
      if (val.toLowerCase().includes(query)) {
        matched.push({ field: 'industry', value: val });
      }
    });

    setSuggestions(matched.slice(0, 10)); // limit to 10 suggestions
  }, [search, state.leads]);

  // Click-away listener for suggestions and dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setFilterMenuOpen(false);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target)) {
        setOwnerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const [highlightLeadId, setHighlightLeadId] = useState(null);

  useEffect(() => {
    if (location.state?.highlightLeadId) {
      setHighlightLeadId(location.state.highlightLeadId);
      // Clear location state to prevent repeating on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);


  const statusStats = LEAD_STAGES.map(stage => ({
    key: stage,
    label: stage.toUpperCase(),
    count: stage === 'Closure'
      ? (state.leads || []).filter(l => l && (l.status === 'Closure' || l.status === 'Converted')).length
      : (state.leads || []).filter(l => l && l.status === stage).length,
    color: STG_COLORS[stage] || '#8A8D8F'
  }));

  const existingOwners = useMemo(() => {
    const fromOwners = (state.owners || []).map(o => o.name).filter(Boolean);
    const fromLeads = (state.leads || []).map(l => l.owner).filter(Boolean);
    return [...new Set([...fromOwners, ...fromLeads])].sort();
  }, [state.owners, state.leads]);

  const allLeadsCount = (state.leads || []).filter(l => l && l.status !== 'Converted').length;
  const unassignedCount = (state.leads || []).filter(l => l && l.status !== 'Converted' && (!l.owner || !l.owner.trim())).length;
  const convertedCount = (state.leads || []).filter(l => l && l.status === 'Converted').length;

  const filterOptions = [
    { key: 'all', label: 'All Leads', count: allLeadsCount, dot: 'bg-brand-red' },
    { key: 'unassigned', label: 'Unassigned', count: unassignedCount, dot: 'bg-purple-500' },
    { key: 'converted', label: 'Converted', count: convertedCount, dot: 'bg-emerald-500' },
  ];

  const bantTabs = [
    { key: 'hot', label: 'Hot', activeBg: 'bg-red-600 text-white border-red-600', dot: 'bg-red-500' },
    { key: 'warm', label: 'Warm', activeBg: 'bg-amber-500 text-white border-amber-500', dot: 'bg-amber-500' },
    { key: 'cold', label: 'Cold', activeBg: 'bg-blue-600 text-white border-blue-600', dot: 'bg-blue-500' },
    { key: 'nurture', label: 'Nurture', activeBg: 'bg-emerald-600 text-white border-emerald-600', dot: 'bg-emerald-500' },
    { key: 'unscored', label: 'Unscored', activeBg: 'bg-gray-700 text-white border-gray-700', dot: 'bg-gray-400' },
  ];

  const getBantCount = (key) => {
    const baseLeads = (state.leads || []).filter(l => {
      if (!l) return false;
      if (leadFilter === 'converted') return l.status === 'Converted';
      if (leadFilter === 'unassigned') return l.status !== 'Converted' && (!l.owner || !l.owner.trim());
      return l.status !== 'Converted';
    });

    return baseLeads.filter(l => {
      const score = bantScore(l);
      return bantCat(score).label.toLowerCase() === key;
    }).length;
  };

  const getOwnerLeadCount = (ownerName) => {
    return (state.leads || []).filter(l => {
      if (!l) return false;
      if (leadFilter === 'converted') return l.status === 'Converted' && l.owner === ownerName;
      return l.status !== 'Converted' && l.owner === ownerName;
    }).length;
  };

  const handleExportCSV = () => {
    if (state.leads.length === 0) return;
    const headers = Object.keys(state.leads[0]).filter(k => k !== '__v');
    const csvRows = [];
    csvRows.push(headers.join(','));
    state.leads.forEach(lead => {
      const values = headers.map(header => {
        let val = lead[header] === null || lead[header] === undefined ? '' : lead[header].toString();
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "leads_export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (state.leads.length === 0) return;
    const blob = new Blob([JSON.stringify(state.leads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "leads_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

  const getCount = (key) => {
    if (key === 'converted') return (state.leads || []).filter(l => l && l.status === 'Converted').length;
    const activeLeads = (state.leads || []).filter(l => l && l.status !== 'Converted');
    if (key === 'all') return activeLeads.length;
    if (key === 'unassigned') return activeLeads.filter(l => !l || !l.owner).length;
    return activeLeads.filter(l => {
      const score = bantScore(l);
      return bantCat(score).label.toLowerCase() === key;
    }).length;
  };



  const formatTimeLeft = (deadlineString) => {
    if (!deadlineString) return '';
    const diffMs = new Date(deadlineString) - new Date();
    if (diffMs <= 0) return 'Overdue';
    const diffHours = Math.round(diffMs / 3600000);
    if (diffHours < 24) {
      return `${diffHours}h left`;
    }
    const diffDays = Math.round(diffMs / 86400000);
    return `${diffDays} days left`;
  };

  const openNew = () => {
    setSelectedLead(null);
    setFormData({ decisionMaker: '', company: '', email: '', phone: '', value: 0, status: 'Leads', outbound: '', broughtBy: '', owner: '', industry: '', businessModel: '', businessModelDetail: '', bio: '', remarks: '', city: '', state: '', designation: '', bant_b: 0, bant_a: 0, bant_n: 0, bant_t: 0, deadline: '' });
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

    setFormSubmitting(true);
    try {
      let finalData = { ...formData };


      if (selectedLead) {
        const res = await updateLead(selectedLead._id, finalData);
        dispatch({ type: 'UPDATE_LEAD', payload: res.data });
        if (res.deal) {
          dispatch({ type: 'ADD_DEAL', payload: res.deal });
          addToast({ type: 'success', message: 'Lead converted to Deal!' });
        } else {
          addToast({ type: 'success', message: 'Lead updated' });
        }
      } else {
        const res = await createLead(finalData);
        dispatch({ type: 'ADD_LEAD', payload: res.data });
        addToast({ type: 'success', message: 'Lead created' });
      }
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error saving lead' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteLead(selectedLead._id);
      
      if (res?.isPending) {
        addToast({ type: 'warning', message: res.message });
      } else {
        dispatch({ type: 'DELETE_LEAD', payload: selectedLead._id });
        addToast({ type: 'success', message: 'Lead deleted' });
      }
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error deleting lead' });
    }
    setDeleteConfirm(false);
  };

  const handleDeleteClick = (lead) => {
    setSelectedLead(lead);
    setDeleteConfirm(true);
  };

  const handleBulkDelete = async () => {
    try {
      const res = await deleteMultipleLeads(selectedLeads);
      
      if (res?.isPending) {
        addToast({ type: 'warning', message: res.message });
      } else {
        selectedLeads.forEach(id => dispatch({ type: 'DELETE_LEAD', payload: id }));
        addToast({ type: 'success', message: `${selectedLeads.length} leads deleted` });
      }
      setSelectedLeads([]);
      setBulkDeleteConfirm(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error deleting leads' });
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

  const handleCleanup = async () => {
    if (window.confirm("Run system sync to repair any orphaned or desynchronized converted leads and deals?")) {
      try {
        const res = await cleanupOrphanedLeads();
        if (res?.success) {
          addToast({ type: 'success', message: res.message });
        }
      } catch (err) {
        addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error running cleanup' });
      }
    }
  };

  const handleBulkUpdateSubmit = async () => {
    try {
      let finalData = {};
      if (bulkUpdateData.status) finalData.status = bulkUpdateData.status;
      if (bulkUpdateData.owner) finalData.owner = bulkUpdateData.owner;
      if (bulkUpdateData.industry) {
        if (bulkUpdateData.industry === 'Others') {
          if (bulkUpdateData.customIndustry) finalData.industry = bulkUpdateData.customIndustry;
        } else {
          finalData.industry = bulkUpdateData.industry;
        }
      }
      
      if (bulkUpdateData.outbound) {
        if (bulkUpdateData.outbound === 'Others') {
           if (bulkUpdateData.customOutbound) finalData.outbound = bulkUpdateData.customOutbound;
        } else {
           finalData.outbound = bulkUpdateData.outbound;
        }
      }

      if (bulkUpdateData.deadline) {
        finalData.deadline = bulkUpdateData.deadline;
      }

      if (Object.keys(finalData).length === 0) {
        addToast({ type: 'error', message: 'No fields selected to update' });
        return;
      }

      const res = await updateMultipleLeads(selectedLeads, finalData);
      
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(updatedLead => {
           dispatch({ type: 'UPDATE_LEAD', payload: updatedLead });
        });
      } else {
        selectedLeads.forEach(id => {
           const lead = state.leads.find(l => l._id === id);
           if (lead) dispatch({ type: 'UPDATE_LEAD', payload: { ...lead, ...finalData } });
        });
      }
      addToast({ type: 'success', message: `${selectedLeads.length} leads updated` });
      setSelectedLeads([]);
      setBulkUpdateModalOpen(false);
      setBulkUpdateData({ status: '', outbound: '', owner: '', industry: '', customIndustry: '', customOutbound: '', deadline: '' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error updating leads' });
    }
  };

  const toggleSelectAll = (ids) => {
    if (ids.every(id => selectedLeads.includes(id))) {
      setSelectedLeads(prev => prev.filter(x => !ids.includes(x)));
    } else {
      setSelectedLeads(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };

  const handleStageUpdate = async (lead, newStage) => {
    if (!lead || lead.status === newStage) return;

    // 1. Instant optimistic update in UI (0ms perceived latency)
    const previousStatus = lead.status;
    dispatch({ type: 'UPDATE_LEAD', payload: { ...lead, status: newStage } });

    try {
      // 2. Send only status change to avoid payload overhead
      const res = await updateLead(lead._id, { status: newStage });
      if (res?.data) {
        dispatch({ type: 'UPDATE_LEAD', payload: res.data });
      }
      if (res?.deal) {
        dispatch({ type: 'ADD_DEAL', payload: res.deal });
        addToast({ type: 'success', message: 'Lead moved to Closure and converted to Deal!' });
      } else {
        const displayStage = newStage === 'Communicated' ? 'Communication' : newStage;
        addToast({ type: 'success', message: `Moved to ${displayStage}` });
      }
    } catch (err) {
      // Roll back to previous status if network or server fails
      dispatch({ type: 'UPDATE_LEAD', payload: { ...lead, status: previousStatus } });
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Error updating stage' });
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

  if (state.loadingLeads) {
    return (
      <div className="w-full pb-12">
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
    <div className="w-full pb-12">
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

      {/* TOOLBAR SECTION */}
      <div className="bg-white p-4 rounded-crm border border-brand-border shadow-sm mb-8 flex flex-col gap-4">
        
        {/* Main Controls Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search and Filters */}
          <div className="flex flex-1 w-full md:w-auto items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[240px] max-w-md" ref={dropdownRef}>
              <div className="flex items-center bg-brand-surfaceAlt/60 border border-brand-border rounded-xl px-3.5 py-2 focus-within:border-brand-red/60 focus-within:ring-4 focus-within:ring-brand-red/10 focus-within:bg-white transition-all shadow-xs group">
                <Search className="w-4 h-4 text-brand-silver group-focus-within:text-brand-red transition-colors shrink-0 mr-2.5" />
                <input 
                  type="text" 
                  placeholder="Search leads, company, city, industry..." 
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-transparent text-sm text-brand-text placeholder-brand-silver/80 outline-none font-medium"
                />
                {search ? (
                  <button
                    onClick={() => {
                      setSearch('');
                      setShowSuggestions(false);
                    }}
                    className="text-brand-silver hover:text-brand-red p-1 transition-colors rounded-lg hover:bg-gray-100 shrink-0 ml-1 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-brand-silver/70 bg-gray-100 rounded border border-gray-200 shrink-0 ml-1">
                    /
                  </kbd>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-brand-border rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-silver border-b border-gray-100 mb-1 flex items-center justify-between">
                    <span>Suggested Filters</span>
                    <span className="text-[9px] text-brand-silver/80">Click to apply</span>
                  </div>
                  {suggestions.map((s, idx) => {
                    const getFieldIcon = (field) => {
                      if (field === 'company') return <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
                      if (field === 'industry') return <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
                      return <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
                    };
                    return (
                      <button
                        key={`${s.field}-${s.value}-${idx}`}
                        onClick={() => {
                          setSearch(`${s.field}: ${s.value}`);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-brand-redLight/10 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFieldIcon(s.field)}
                          <span className="font-bold text-brand-text group-hover:text-brand-red truncate">{s.value}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-brand-silver bg-brand-surfaceAlt px-2 py-0.5 rounded-md border border-brand-border group-hover:bg-brand-redLight/30 group-hover:text-brand-red group-hover:border-brand-red/30 transition-all shrink-0 ml-2">
                          {s.field}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Filter Button - All Leads, Unassigned, Converted */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all shadow-xs cursor-pointer ${
                  leadFilter !== 'all' 
                    ? 'bg-brand-redLight/40 border-brand-red/40 text-brand-red' 
                    : 'bg-brand-surfaceAlt/60 border-brand-border text-brand-text hover:bg-white hover:border-gray-300'
                }`}
              >
                <Filter className={`w-4 h-4 ${leadFilter !== 'all' ? 'text-brand-red' : 'text-brand-silver'}`} />
                <span>{filterOptions.find(o => o.key === leadFilter)?.label || 'All Leads'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-brand-silver transition-transform duration-200 ${filterMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {filterMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-brand-border z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-brand-silver border-b border-gray-100">
                    Lead Filter
                  </div>
                  {filterOptions.map(opt => {
                    const isSelected = leadFilter === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setLeadFilter(opt.key);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-brand-redLight/20 text-brand-red' : 'text-brand-text hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                          <span>{opt.label}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isSelected ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {opt.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-silver uppercase tracking-wider hidden lg:inline">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-brand-surfaceAlt/60 border border-brand-border rounded-xl px-3.5 py-2 text-sm text-brand-text outline-none focus:bg-white focus:border-brand-red/50 shadow-xs font-bold cursor-pointer"
              >
                <option value="latest">Latest Added</option>
                <option value="oldest">Older Added</option>
                <option value="highest_value">Highest Revenue</option>
                <option value="lowest_value">Lowest Revenue</option>
                <option value="group_by_owner">Group by Owner</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <>
                <button 
                  onClick={handleCleanup} 
                  className="text-brand-silver hover:text-brand-text p-2 transition-colors" 
                  title="Repair & Sync Orphaned / Converted Leads"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
                <button 
                  onClick={handleResetCounter} 
                  className="text-brand-silver hover:text-brand-text p-2 transition-colors" 
                  title="Reset Lead ID Sequence to 1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </>
            )}
            <button onClick={() => setImportWizardOpen(true)} className="px-5 py-2.5 bg-white border border-brand-border text-brand-text font-bold text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm">
              Import
            </button>
            <button onClick={openNew} className="px-5 py-2.5 bg-brand-red text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-md transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add Lead
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

        <hr className="border-brand-border" />

        {/* Secondary Row: BANT Tabs (Left) & Owner Filter (Right) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 min-h-[44px]">
          {/* Left: Prominent BANT Score Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-black text-brand-silver uppercase tracking-wider mr-1 hidden sm:block">BANT:</span>
            <div className={`flex flex-wrap items-center gap-2 transition-opacity duration-200 ${selectedLeads.length > 0 ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {bantTabs.map(tab => {
                const isActive = bantFilter === tab.key;
                return (
                  <button 
                    key={tab.key}
                    onClick={() => setBantFilter(isActive ? 'all' : tab.key)}
                    title={isActive ? `Active: ${tab.label} (Click to clear)` : `Filter by ${tab.label}`}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 border shadow-xs cursor-pointer ${
                      isActive 
                        ? `${tab.activeBg} shadow-md scale-102 ring-2 ring-brand-red/20` 
                        : 'bg-white border-brand-border text-brand-charcoal hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? 'bg-white shadow-xs' : tab.dot}`} />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-extrabold leading-none shrink-0 ${
                      isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-brand-silver'
                    }`}>
                      {getBantCount(tab.key)}
                    </span>
                  </button>
                );
              })}
              {bantFilter !== 'all' && (
                <button
                  onClick={() => setBantFilter('all')}
                  className="text-xs font-bold text-brand-silver hover:text-brand-red ml-1.5 underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Clear BANT
                </button>
              )}
            </div>
          </div>

          {/* Right: Owner Dropdown & Contextual Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Contextual Action Bar (Shows when items are selected) */}
            {selectedLeads.length > 0 && (
              <div className="flex items-center gap-2.5 bg-brand-surfaceAlt px-3.5 py-1.5 rounded-xl border border-brand-border shadow-xs">
                <span className="text-xs font-bold text-brand-text flex items-center gap-1.5 mr-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-xs">{selectedLeads.length}</span>
                  Selected
                </span>
                
                {selectedLeads.length > 1 && (
                  <button onClick={() => setBulkUpdateModalOpen(true)} className="flex items-center gap-1 px-3 py-1 bg-white border border-brand-border rounded-lg text-xs font-bold text-brand-text hover:bg-gray-50 transition-all shadow-xs cursor-pointer">
                    <svg className="w-3 h-3 text-brand-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Update
                  </button>
                )}
                
                <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1 bg-brand-redLight border border-brand-red/20 rounded-lg text-xs font-bold text-brand-red hover:bg-red-100 transition-all shadow-xs cursor-pointer">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Delete
                </button>
              </div>
            )}

            {/* Owner Dropdown (Right-aligned) */}
            <div className="relative" ref={ownerDropdownRef}>
              <button
                type="button"
                onClick={() => setOwnerMenuOpen(!ownerMenuOpen)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-xs cursor-pointer ${
                  ownerFilter !== 'all'
                    ? 'bg-brand-redLight/40 border-brand-red/40 text-brand-red ring-2 ring-brand-red/10'
                    : 'bg-white border-brand-border text-brand-text hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <User className={`w-4 h-4 ${ownerFilter !== 'all' ? 'text-brand-red' : 'text-brand-silver'}`} />
                <span>{ownerFilter !== 'all' ? `Owner: ${ownerFilter === 'unassigned' ? 'Unassigned' : ownerFilter}` : 'Owner'}</span>
                <ChevronDown className={`w-4 h-4 text-brand-silver transition-transform duration-200 ${ownerMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {ownerMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-brand-border z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-brand-silver border-b border-gray-100 flex items-center justify-between">
                    <span>Filter by Owner</span>
                    {ownerFilter !== 'all' && (
                      <button 
                        onClick={() => { setOwnerFilter('all'); setOwnerMenuOpen(false); }}
                        className="text-brand-red hover:underline capitalize text-[10px] font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {/* 1. All Owners */}
                    <button
                      onClick={() => {
                        setOwnerFilter('all');
                        setOwnerMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        ownerFilter === 'all' ? 'bg-brand-redLight/20 text-brand-red' : 'text-brand-text hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-brand-silver" />
                        <span>All Owners</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${ownerFilter === 'all' ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {allLeadsCount}
                      </span>
                    </button>

                    {/* 2. Owners Present in the System */}
                    {existingOwners.map(ownerName => {
                      const count = getOwnerLeadCount(ownerName);
                      const isSelected = ownerFilter === ownerName;
                      return (
                        <button
                          key={ownerName}
                          onClick={() => {
                            setOwnerFilter(ownerName);
                            setOwnerMenuOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-brand-redLight/20 text-brand-red' : 'text-brand-text hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <div className="w-5 h-5 rounded-full bg-brand-charcoal text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                              {ownerName.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{ownerName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${isSelected ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {/* 3. Unassigned */}
                    <button
                      onClick={() => {
                        setOwnerFilter('unassigned');
                        setOwnerMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors border-t border-gray-100 cursor-pointer ${
                        ownerFilter === 'unassigned' ? 'bg-brand-redLight/20 text-brand-red' : 'text-brand-text hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                          ?
                        </div>
                        <span>Unassigned</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${ownerFilter === 'unassigned' ? 'bg-brand-red text-white' : 'bg-purple-100 text-purple-700'}`}>
                        {unassignedCount}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LeadsView 
        onLeadClick={openEdit} 
        onDeleteClick={handleDeleteClick}
        onStageUpdate={handleStageUpdate}
        leadFilter={leadFilter}
        activeBant={bantFilter}
        selectedOwner={ownerFilter}
        activeStatusFilter={activeStatusFilter}
        search={search} 
        sortOrder={sortOrder}
        selectedLeads={selectedLeads}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        highlightLeadId={highlightLeadId}
        onClearHighlight={() => setHighlightLeadId(null)}
      />

      {state.leads.filter(l => l.status !== 'Converted').length === 0 && (
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
              <Field label="Lead Source" type="select" options={SOURCES} value={FLAT_SOURCES.includes(formData.outbound) || !formData.outbound ? formData.outbound : 'Others'} onChange={e => handleChange('outbound', e.target.value)} />
              {(formData.outbound === 'Others' || (formData.outbound && !FLAT_SOURCES.includes(formData.outbound))) && (
                <Field label="Custom Source" value={formData.outbound === 'Others' ? '' : formData.outbound} onChange={e => handleChange('outbound', e.target.value)} placeholder="Type custom source..." />
              )}
            </div>
            <Field label="Brought By" value={formData.broughtBy || ''} onChange={e => handleChange('broughtBy', e.target.value)} placeholder="Who brought the lead..." />
            <Field label="Owner" type="select" options={(state.owners || []).map(o => o.name)} value={formData.owner} onChange={e => handleChange('owner', e.target.value)} />
            <div className="flex flex-col gap-2">
              <Field label="Industry" type="select" options={SECTORS} value={SECTORS.includes(formData.industry) || !formData.industry ? formData.industry : 'Others'} onChange={e => handleChange('industry', e.target.value)} />
              {(formData.industry === 'Others' || (formData.industry && !SECTORS.includes(formData.industry))) && (
                <Field label="Custom Industry" value={formData.industry === 'Others' ? '' : formData.industry} onChange={e => handleChange('industry', e.target.value)} placeholder="Type custom industry..." />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Field label="Business Model" type="select" options={BUSINESS_MODELS} value={formData.businessModel || ''} onChange={e => handleChange('businessModel', e.target.value)} />
              {formData.businessModel && (
                <Field 
                  label={
                    formData.businessModel.toLowerCase().includes('joint') 
                      ? 'Joint Ownership Details' 
                      : formData.businessModel.toLowerCase().includes('drone') 
                      ? 'Drone Sales Details' 
                      : 'Service Project Details'
                  } 
                  value={formData.businessModelDetail || ''} 
                  onChange={e => handleChange('businessModelDetail', e.target.value)} 
                  placeholder={`Enter details for ${formData.businessModel}...`} 
                />
              )}
            </div>
            {formData.status === 'Leads' && (
              <div className="flex flex-col gap-1">
                <Field 
                  label="Deadline" 
                  type="date" 
                  value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''} 
                  onChange={e => handleChange('deadline', e.target.value)} 
                />
                {formData.deadline && (
                  <span className="text-[10px] font-bold text-brand-silver ml-1">
                    Current: {new Date(formData.deadline).toLocaleDateString()} ({formatTimeLeft(formData.deadline)})
                  </span>
                )}
              </div>
            )}
          </div>
          <Field label="Bio" type="textarea" value={formData.bio || ''} onChange={e => handleChange('bio', e.target.value)} placeholder="Input custom bio notes..." />
          <Field label="Remarks" type="textarea" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} />

          <BANTSection lead={formData} onChange={handleChange} />

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2">Cancel</button>
            <button 
              type="submit" 
              disabled={formSubmitting} 
              className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              {formSubmitting ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>

      </Modal>

      <Confirm 
        isOpen={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)} 
        onConfirm={handleDelete}
        title={user?.role === 'manager' ? "Request Deletion" : "Delete Lead"} 
        message={user?.role === 'manager' 
          ? "Are you sure you want to request deletion of this lead? These deletion requests will be viewed by admin and will be in action based on admin or super admin's judgement." 
          : "Are you sure you want to delete this lead? This action cannot be undone."} 
      />
      <Confirm 
        isOpen={bulkDeleteConfirm} 
        onClose={() => setBulkDeleteConfirm(false)} 
        onConfirm={handleBulkDelete}
        title={user?.role === 'manager' ? `Request Deletion for ${selectedLeads.length} Leads` : `Delete ${selectedLeads.length} Leads`} 
        message={user?.role === 'manager'
          ? `Are you sure you want to request deletion for ${selectedLeads.length} selected leads? These deletion requests will be viewed by admin and will be in action based on admin or super admin's judgement.`
          : `Are you sure you want to delete ${selectedLeads.length} selected leads? This action cannot be undone.`} 
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
            options={(state.owners || []).map(o => o.name)} 
            value={bulkUpdateData.owner} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, owner: e.target.value })} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Field 
              label="Industry" 
              type="select" 
              options={SECTORS} 
              value={bulkUpdateData.industry} 
              onChange={e => setBulkUpdateData({ ...bulkUpdateData, industry: e.target.value, customIndustry: '' })} 
            />
            {bulkUpdateData.industry === 'Others' && (
              <Field 
                label="Custom Industry" 
                value={bulkUpdateData.customIndustry} 
                onChange={e => setBulkUpdateData({ ...bulkUpdateData, customIndustry: e.target.value })} 
                placeholder="Type industry here..."
              />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Field 
              label="Lead Source" 
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
          {(!bulkUpdateData.status || bulkUpdateData.status === 'Leads') && (
            <Field 
              label="Deadline" 
              type="date" 
              value={bulkUpdateData.deadline ? new Date(bulkUpdateData.deadline).toISOString().split('T')[0] : ''} 
              onChange={e => setBulkUpdateData({ ...bulkUpdateData, deadline: e.target.value })} 
            />
          )}
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
