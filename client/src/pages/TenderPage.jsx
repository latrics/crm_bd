import { useState, useEffect, useRef } from 'react';
import useCRM from '../hooks/useCRM.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import TenderView from '../components/tenders/TenderView.jsx';
import TenderForm from '../components/tenders/TenderForm.jsx';
import TenderImportWizard from '../components/tenders/TenderImportWizard.jsx';
import Modal from '../components/common/Modal.jsx';
import Confirm from '../components/common/Confirm.jsx';
import Field from '../components/common/Field.jsx';
import { deleteTender, deleteMultipleTenders, updateMultipleTenders, resetTenderCounter } from '../api/tendersApi.js';
import useToast from '../hooks/useToast.js';
import { T_STATUSES, T_EMD, T_JV } from '../constants/index.js';

export default function TenderPage() {
  const { state, dispatch } = useCRM();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Bulk Operations State
  const [selectedTenders, setSelectedTenders] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({ status: '', portal: '', jv: '', emd: '', emd_amount: '', location: '' });

  const dropdownRef = useRef(null);

  // Auto-suggestions calculation
  useEffect(() => {
    if (!search || !state.tenders) {
      setSuggestions([]);
      return;
    }
    if (/^(location|authority|portal|status|tender_id|latrics_id):/i.test(search)) {
      setSuggestions([]);
      return;
    }

    const query = search.trim().toLowerCase();
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const uniqueLocations = [...new Set(state.tenders.map(t => t.location).filter(Boolean))];
    const uniqueAuthorities = [...new Set(state.tenders.map(t => t.authority).filter(Boolean))];
    const uniquePortals = [...new Set(state.tenders.map(t => t.portal).filter(Boolean))];

    const matched = [];

    uniqueLocations.forEach(val => {
      if (val.toLowerCase().includes(query)) matched.push({ field: 'location', value: val });
    });
    uniqueAuthorities.forEach(val => {
      if (val.toLowerCase().includes(query)) matched.push({ field: 'authority', value: val });
    });
    uniquePortals.forEach(val => {
      if (val.toLowerCase().includes(query)) matched.push({ field: 'portal', value: val });
    });

    setSuggestions(matched.slice(0, 10));
  }, [search, state.tenders]);

  // Click-away listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const uniqueLocations = [...new Set((state.tenders || []).map(t => t.location).filter(Boolean))].sort();

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

  const statusFilters = T_STATUSES.map(s => ({
    key: s,
    label: s.toUpperCase(),
    count: state.tenders.filter(t => t.status === s).length
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
      const res = await deleteTender(selectedTender._id);
      if (res?.isPending) {
        addToast({ type: 'warning', message: res.message });
      } else {
        dispatch({ type: 'DELETE_TENDER', payload: selectedTender._id });
        addToast({ type: 'success', message: 'Tender deleted' });
      }
      setModalOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error deleting tender' });
    }
    setDeleteConfirm(false);
  };

  // Bulk operation handlers
  const handleToggleSelect = (id) => {
    setSelectedTenders(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (ids) => {
    if (ids.every(id => selectedTenders.includes(id))) {
      setSelectedTenders(prev => prev.filter(x => !ids.includes(x)));
    } else {
      setSelectedTenders(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await deleteMultipleTenders(selectedTenders);
      if (res?.isPending) {
        addToast({ type: 'warning', message: res.message });
      } else {
        selectedTenders.forEach(id => dispatch({ type: 'DELETE_TENDER', payload: id }));
        addToast({ type: 'success', message: `${selectedTenders.length} tenders deleted` });
      }
      setSelectedTenders([]);
      setBulkDeleteConfirm(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error deleting tenders' });
    }
  };

  const handleBulkUpdateSubmit = async () => {
    try {
      const finalData = {};
      if (bulkUpdateData.status) finalData.status = bulkUpdateData.status;
      if (bulkUpdateData.portal) finalData.portal = bulkUpdateData.portal;
      if (bulkUpdateData.jv) finalData.jv = bulkUpdateData.jv;
      if (bulkUpdateData.emd) {
        finalData.emd = bulkUpdateData.emd;
        if (bulkUpdateData.emd === 'EMD Paid') {
          finalData.emd_amount = Number(bulkUpdateData.emd_amount) || 0;
        } else {
          finalData.emd_amount = 0;
        }
      }
      if (bulkUpdateData.location) finalData.location = bulkUpdateData.location;

      if (Object.keys(finalData).length === 0) {
        addToast({ type: 'error', message: 'No fields selected to update' });
        return;
      }

      const res = await updateMultipleTenders(selectedTenders, finalData);
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(updatedTender => {
          dispatch({ type: 'UPDATE_TENDER', payload: updatedTender });
        });
      } else {
        selectedTenders.forEach(id => {
          const tender = state.tenders.find(t => t._id === id);
          if (tender) dispatch({ type: 'UPDATE_TENDER', payload: { ...tender, ...finalData } });
        });
      }
      addToast({ type: 'success', message: `${selectedTenders.length} tenders updated` });
      setSelectedTenders([]);
      setBulkUpdateModalOpen(false);
      setBulkUpdateData({ status: '', portal: '', jv: '', emd: '', emd_amount: '', location: '' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error updating tenders' });
    }
  };

  const handleResetCounter = async () => {
    if (window.confirm("Are you sure you want to reset the Tender ID sequence back to 1? Only do this if you have deleted all existing tenders.")) {
      try {
        await resetTenderCounter();
        addToast({ type: 'success', message: 'Tender ID sequence reset to 1 successfully' });
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Error resetting sequence' });
      }
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <PageHeader 
        title="Tender Management" 
        subtitle="Tender tracking • Latrics Tender ID • Portals • Persistent Storage"
      />

      {/* Status Bar Row */}
      <div className="grid grid-cols-7 gap-0 border border-brand-border rounded-crm bg-white overflow-hidden mb-8 shadow-sm">
        {statusFilters.map((stat, i) => (
          <div 
            key={stat.key} 
            onClick={() => setActiveStatusFilter(activeStatusFilter === stat.key ? 'all' : stat.key)}
            className={`p-4 text-center border-r border-brand-border last:border-0 cursor-pointer transition-colors ${activeStatusFilter === stat.key ? 'bg-brand-redLight' : 'hover:bg-gray-50'}`}
          >
            <div className="text-xl font-serif font-black mb-1" style={{ color: i === 0 || i === 2 || i === 5 ? '#DA291C' : '#54585A' }}>
              {stat.count}
            </div>
            <div className="text-[9px] font-bold text-brand-silver tracking-widest leading-tight uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR SECTION */}
      <div className="bg-white p-4 rounded-crm border border-brand-border shadow-sm mb-8 flex flex-col gap-4">
        
        {/* Main Controls Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search and Location Filter */}
          <div className="flex flex-1 w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 max-w-md" ref={dropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-brand-silver/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by location, authority, portal, tender ID..." 
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-brand-surfaceAlt/50 border border-brand-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 transition-all font-medium"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-silver hover:text-brand-red transition-colors"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-brand-border rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
                  {suggestions.map((s, idx) => (
                    <button
                      key={`${s.field}-${s.value}-${idx}`}
                      onClick={() => {
                        setSearch(`${s.field}: ${s.value}`);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-brand-redLight/10 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                    >
                      <span className="font-bold text-brand-text group-hover:text-brand-red">{s.value}</span>
                      <span className="text-[9px] uppercase font-bold text-brand-silver bg-brand-surfaceAlt px-2 py-0.5 rounded border border-brand-border group-hover:bg-brand-redLight/20 group-hover:text-brand-red group-hover:border-brand-red/20 transition-all">
                        {s.field}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Dynamic Location & State-Wise Dropdown */}
            <select 
              value={selectedLocation} 
              onChange={e => setSelectedLocation(e.target.value)}
              className="bg-brand-surfaceAlt/50 border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:bg-white focus:border-brand-red/50 shadow-sm font-bold cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="statewise">State Wise (Grouped)</option>
              {uniqueLocations.length > 0 && (
                <optgroup label="Filter by Specific Location / State">
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button 
                onClick={handleResetCounter} 
                className="text-brand-silver hover:text-brand-text p-2 transition-colors" 
                title="Reset Tender ID Sequence to 1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            )}
            <button onClick={() => setImportWizardOpen(true)} className="px-5 py-2.5 bg-white border border-brand-border text-brand-text font-bold text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm">
              Import
            </button>
            <button onClick={openNew} className="px-5 py-2.5 bg-brand-red text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-md transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add Tender
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
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedTenders.length > 0 && (
        <div className="bg-brand-surfaceAlt border border-brand-border p-4 rounded-crm shadow-sm mb-8 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-text">
              {selectedTenders.length} {selectedTenders.length === 1 ? 'tender' : 'tenders'} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setBulkUpdateModalOpen(true)}
              className="px-4 py-2 bg-white border border-brand-border text-brand-text font-bold text-xs rounded-lg hover:bg-gray-50 shadow-xs"
            >
              Bulk Update
            </button>
            {user?.role !== 'member' && (
              <button 
                onClick={() => setBulkDeleteConfirm(true)}
                className="px-4 py-2 bg-brand-red text-white font-bold text-xs rounded-lg hover:bg-red-700 shadow-xs"
              >
                Bulk Delete
              </button>
            )}
          </div>
        </div>
      )}

      <TenderView 
        onTenderClick={openEdit} 
        search={search} 
        selectedLocation={selectedLocation} 
        activeStatusFilter={activeStatusFilter}
        selectedTenders={selectedTenders}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />

      {/* Tender Edit/Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">{selectedTender ? 'Edit Tender' : 'Add Tender'}</h2>
        </div>

        <TenderForm 
          initialData={selectedTender} 
          onClose={() => setModalOpen(false)} 
        />
        
        {selectedTender && user?.role !== 'member' && (
          <div className="flex justify-end mt-4 pt-4 border-t border-brand-border">
             <button type="button" onClick={() => setDeleteConfirm(true)} className="text-brand-red font-bold text-xs hover:underline">Delete Tender</button>
          </div>
        )}
      </Modal>

      {/* Delete Single Tender Confirmation */}
      <Confirm 
        isOpen={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)} 
        onConfirm={handleDelete}
        title="Delete Tender" 
        message="Are you sure you want to delete this tender? This action cannot be undone." 
      />

      {/* Bulk Delete Confirmation */}
      <Confirm 
        isOpen={bulkDeleteConfirm} 
        onClose={() => setBulkDeleteConfirm(false)} 
        onConfirm={handleBulkDelete}
        title={user?.role === 'manager' ? `Request Deletion for ${selectedTenders.length} Tenders` : `Delete ${selectedTenders.length} Tenders`}
        message={user?.role === 'manager'
          ? `Are you sure you want to request deletion for ${selectedTenders.length} selected tenders? These deletion requests will be reviewed by admin and acted upon based on admin or super admin's judgement.`
          : `Are you sure you want to delete ${selectedTenders.length} selected tenders? This action cannot be undone.`}
      />

      {/* Bulk Update Modal */}
      <Modal isOpen={bulkUpdateModalOpen} onClose={() => setBulkUpdateModalOpen(false)}>
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-brand-text">Bulk Update {selectedTenders.length} Tenders</h2>
          <p className="text-sm text-brand-silver mt-1">Select the fields you want to apply to all selected tenders.</p>
        </div>

        <div className="flex flex-col gap-4">
          <Field 
            label="Status" 
            type="select" 
            options={T_STATUSES} 
            value={bulkUpdateData.status} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, status: e.target.value })} 
          />
          <Field 
            label="Portal" 
            value={bulkUpdateData.portal} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, portal: e.target.value })} 
            placeholder="Type portal name..."
          />
          <Field 
            label="JV Status" 
            type="select" 
            options={T_JV} 
            value={bulkUpdateData.jv} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, jv: e.target.value })} 
          />
          <Field 
            label="EMD Status" 
            type="select" 
            options={T_EMD} 
            value={bulkUpdateData.emd} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, emd: e.target.value, emd_amount: e.target.value === 'EMD Paid' ? '' : 0 })} 
          />
          {bulkUpdateData.emd === 'EMD Paid' && (
            <Field 
              label="EMD Amount" 
              type="number"
              value={bulkUpdateData.emd_amount} 
              onChange={e => setBulkUpdateData({ ...bulkUpdateData, emd_amount: e.target.value })} 
              placeholder="Enter EMD Amount..."
            />
          )}
          <Field 
            label="Location" 
            value={bulkUpdateData.location} 
            onChange={e => setBulkUpdateData({ ...bulkUpdateData, location: e.target.value })} 
            placeholder="Type location..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setBulkUpdateModalOpen(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleBulkUpdateSubmit} className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Apply Changes</button>
        </div>
      </Modal>

      <TenderImportWizard isOpen={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  );
}
