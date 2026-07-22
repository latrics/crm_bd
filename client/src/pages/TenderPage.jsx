import { useState, useEffect, useRef } from 'react';
import useCRM from '../hooks/useCRM.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import TenderView from '../components/tenders/TenderView.jsx';
import TenderForm from '../components/tenders/TenderForm.jsx';
import TenderImportWizard from '../components/tenders/TenderImportWizard.jsx';
import Modal from '../components/common/Modal.jsx';
import Confirm from '../components/common/Confirm.jsx';
import { deleteTender } from '../api/tendersApi.js';
import useToast from '../hooks/useToast.js';
import { T_STATUSES } from '../constants/index.js';

export default function TenderPage() {
  const { state, dispatch } = useCRM();
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

      <TenderView 
        onTenderClick={openEdit} 
        search={search} 
        selectedLocation={selectedLocation} 
        activeStatusFilter={activeStatusFilter} 
      />

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

      <TenderImportWizard isOpen={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  );
}
