import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../common/Modal.jsx';
import useCRM from '../../hooks/useCRM.js';
import useToast from '../../hooks/useToast.js';
import { importLeads, updateLead } from '../../api/leadsApi.js';
import { LEAD_STAGES, SOURCES, SECTORS } from '../../constants/index.js';

import { isValidValue, normalizeEmail, normalizePhone, normalizeText } from '../../utils/importHelpers.js';

const CRM_FIELDS = [
  { key: 'company', label: 'Company', required: true, aliases: ['company', 'company name', 'organization', 'client'] },
  { key: 'decisionMaker', label: 'Decision Maker', aliases: ['decision maker', 'name', 'contact person', 'contact', 'person'] },
  { key: 'email', label: 'Email', aliases: ['email', 'email id', 'email address', 'mail'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'phone number', 'contact number', 'mobile', 'cell'] },
  { key: 'value', label: 'Value (Rs.)', aliases: ['value', 'revenue', 'amount', 'deal value'] },
  { key: 'bio', label: 'Bio / Notes', aliases: ['bio', 'bio notes', 'about'] },
  { key: 'remarks', label: 'Remarks', aliases: ['remarks', 'notes', 'comment', 'comments'] },
  { key: 'city', label: 'City', aliases: ['city', 'location', 'town'] },
  { key: 'state', label: 'State', aliases: ['state', 'region', 'province'] },
  { key: 'designation', label: 'Title / Designation', aliases: ['title', 'designation', 'job title', 'role'] },
  { key: 'outbound', label: 'Lead Source', aliases: ['lead source', 'source', 'outbound', 'channel'] },
  { key: 'broughtBy', label: 'Brought By', aliases: ['brought by', 'brought_by', 'referred by', 'broughtby'] },
  { key: 'businessModel', label: 'Business Model', aliases: ['business model', 'model', 'business_model'] },
  { key: 'businessModelDetail', label: 'Business Model Detail', aliases: ['business model detail', 'model detail', 'business_model_detail'] },
];

export default function ImportWizard({ isOpen, onClose }) {
  const { state, dispatch } = useCRM();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [rawColumns, setRawColumns] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [previewData, setPreviewData] = useState({ valid: [], invalid: [], duplicates: [] });
  const [previewTab, setPreviewTab] = useState('valid');
  const [duplicateAction, setDuplicateAction] = useState('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setRawColumns([]);
    setRawData([]);
    setMapping({});
    setPreviewData({ valid: [], invalid: [], duplicates: [] });
    setPreviewTab('valid');
    setDuplicateAction('skip');
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Find header row by scanning for keywords
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        let headerRowIndex = 0;
        const keywords = ['company', 'email', 'phone', 'name', 'lead', 'decision maker', 'source', 'industry'];
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowStr = rawRows[i].join(' ').toLowerCase();
          const matches = keywords.filter(k => rowStr.includes(k));
          if (matches.length >= 2) {
            headerRowIndex = i;
            break;
          }
        }

        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: '' });
        
        if (data.length === 0) {
          addToast({ type: 'error', message: 'The uploaded file is empty or contains no valid data rows.' });
          return;
        }

        const columns = Object.keys(data[0]);
        setRawColumns(columns);
        setRawData(data);
        
        // Auto-mapping logic
        const initialMapping = {};
        CRM_FIELDS.forEach(field => {
          const match = columns.find(c => {
            const normalizedCol = c.toLowerCase().replace(/[^a-z0-9]/g, '');
            return field.aliases.some(alias => normalizedCol === alias.toLowerCase().replace(/[^a-z0-9]/g, ''));
          });
          if (match) initialMapping[field.key] = match;
        });
        
        setMapping(initialMapping);
        setStep(2);
      } catch (err) {
        addToast({ type: 'error', message: 'Error reading file. Please ensure it is a valid Excel or CSV file.' });
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const processPreview = () => {
    const valid = [];
    const invalid = [];
    const duplicates = [];

    // Track rows already accepted in this sheet to detect intra-batch duplicates
    const inSheetEmails = new Map();
    const inSheetPhones = new Map();
    const inSheetCompanyDMs = new Map();

    const dbLeads = state.leads || [];

    rawData.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header
      const lead = {
        _rowNum: rowNum
      };
      
      let isValid = true;
      let errorReason = [];

      // Extract mapped fields exactly as in spreadsheet (blank stays empty string)
      CRM_FIELDS.forEach(field => {
        const colName = mapping[field.key];
        let val = colName && row[colName] !== undefined && row[colName] !== null ? row[colName] : '';
        
        if (typeof val === 'string') val = val.trim();

        if (field.required && (!val || String(val).trim() === '')) {
          isValid = false;
          errorReason.push(`Missing required field: ${field.label}`);
        }
        
        if (val && field.key === 'value') {
          val = Number(val) || 0;
        }
        
        lead[field.key] = val !== undefined && val !== null ? val : '';
      });

      lead.status = 'Leads';
      lead._errorReason = errorReason.join(', ');

      if (!isValid) {
        invalid.push(lead);
        return;
      }

      const cleanEmail = normalizeEmail(lead.email);
      const cleanPhone = normalizePhone(lead.phone);
      const cleanCompany = normalizeText(lead.company);
      const cleanDM = normalizeText(lead.decisionMaker);

      let duplicateFound = false;
      let duplicateReason = '';
      let existingId = null;

      // 1. Check for Intra-Batch Duplicates (Duplicate within uploaded spreadsheet itself)
      if (cleanEmail && inSheetEmails.has(cleanEmail)) {
        duplicateFound = true;
        duplicateReason = `Duplicate in current file (Row ${inSheetEmails.get(cleanEmail)} has same Email: ${lead.email})`;
      } else if (cleanPhone && inSheetPhones.has(cleanPhone)) {
        duplicateFound = true;
        duplicateReason = `Duplicate in current file (Row ${inSheetPhones.get(cleanPhone)} has same Phone: ${lead.phone})`;
      } else if (cleanCompany && cleanDM && cleanCompany !== cleanDM && inSheetCompanyDMs.has(`${cleanCompany}__${cleanDM}`)) {
        duplicateFound = true;
        duplicateReason = `Duplicate in current file (Row ${inSheetCompanyDMs.get(`${cleanCompany}__${cleanDM}`)} has same Company & Contact)`;
      }

      // 2. If not intra-sheet duplicate, check against Database records (state.leads)
      if (!duplicateFound) {
        const dbMatch = dbLeads.find(existing => {
          const exEmail = normalizeEmail(existing.email);
          const exPhone = normalizePhone(existing.phone);
          const exCompany = normalizeText(existing.company);
          const exDM = normalizeText(existing.decisionMaker);

          if (cleanEmail && exEmail && cleanEmail === exEmail) {
            duplicateReason = `Matches existing ${existing.status === 'Converted' ? 'Deal' : 'Lead'} (${existing.leadId || existing.company}) by Email (${lead.email})`;
            return true;
          }
          if (cleanPhone && exPhone && cleanPhone === exPhone) {
            duplicateReason = `Matches existing ${existing.status === 'Converted' ? 'Deal' : 'Lead'} (${existing.leadId || existing.company}) by Phone (${lead.phone})`;
            return true;
          }
          if (cleanCompany && cleanDM && exCompany && exDM && cleanCompany !== cleanDM && exCompany !== exDM) {
            if (cleanCompany === exCompany && cleanDM === exDM) {
              duplicateReason = `Matches existing ${existing.status === 'Converted' ? 'Deal' : 'Lead'} (${existing.leadId || existing.company}) by Company & Contact`;
              return true;
            }
          }
          return false;
        });

        if (dbMatch) {
          duplicateFound = true;
          existingId = dbMatch._id;
          lead._existingStatus = dbMatch.status;
          lead._existingLeadId = dbMatch.leadId;
        }
      }

      if (duplicateFound) {
        lead._existingId = existingId;
        lead._duplicateReason = duplicateReason;
        duplicates.push(lead);
      } else {
        // Register in-sheet uniqueness tracking
        if (cleanEmail) inSheetEmails.set(cleanEmail, rowNum);
        if (cleanPhone) inSheetPhones.set(cleanPhone, rowNum);
        if (cleanCompany && cleanDM && cleanCompany !== cleanDM) {
          inSheetCompanyDMs.set(`${cleanCompany}__${cleanDM}`, rowNum);
        }
        valid.push(lead);
      }
    });

    setPreviewData({ valid, invalid, duplicates });
    setPreviewTab(valid.length > 0 ? 'valid' : duplicates.length > 0 ? 'duplicates' : 'invalid');
    setStep(3);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let leadsToImport = [...previewData.valid];
    let leadsToUpdate = [];

    if (duplicateAction === 'import_anyway') {
      leadsToImport = [...leadsToImport, ...previewData.duplicates];
    } else if (duplicateAction === 'update') {
      // Only update database matches with existing IDs, and avoid multi-row collision on same ID
      const seenUpdateIds = new Set();
      previewData.duplicates.forEach(d => {
        if (d._existingId && !seenUpdateIds.has(String(d._existingId))) {
          seenUpdateIds.add(String(d._existingId));
          leadsToUpdate.push(d);
        }
      });
    }

    try {
      let createdCount = 0;
      let leadIdRange = 'N/A';

      if (leadsToImport.length > 0) {
        // Clean temporary preview keys before sending to server
        const sanitizedLeads = leadsToImport.map(l => {
          const { _rowNum, _errorReason, _duplicateReason, _existingId, _existingStatus, _existingLeadId, ...cleanLead } = l;
          return cleanLead;
        });

        const res = await importLeads({ leads: sanitizedLeads });
        if (res && res.success) {
          createdCount = res.total;
          leadIdRange = res.leadIdRange;
          res.data.forEach(l => dispatch({ type: 'ADD_LEAD', payload: l }));
        }
      }

      let updatedCount = 0;
      if (leadsToUpdate.length > 0) {
        for (const lead of leadsToUpdate) {
          try {
            const { _rowNum, _errorReason, _duplicateReason, _existingId, _existingStatus, _existingLeadId, ...updateData } = lead;
            // If the record was Converted, preserve Converted status so it doesn't revert to active leads
            if (_existingStatus === 'Converted') {
              updateData.status = 'Converted';
            }
            const res = await updateLead(_existingId, updateData);
            if (res.data && res.success !== false) {
              dispatch({ type: 'UPDATE_LEAD', payload: res.data });
              updatedCount++;
            }
          } catch (e) {
            console.error('Failed to update duplicate', e);
          }
        }
      }

      setImportResult({
        totalFound: rawData.length,
        created: createdCount,
        updated: updatedCount,
        skipped: duplicateAction === 'skip' ? previewData.duplicates.length : (previewData.duplicates.length - updatedCount),
        invalid: previewData.invalid.length,
        leadIdRange: leadIdRange
      });
      addToast({ type: 'success', message: 'Import completed successfully' });
      setStep(4);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadErrorReport = () => {
    const errorData = previewData.invalid.map(row => {
      const obj = { 'Row Number': row._rowNum, 'Error Reason': row._errorReason };
      const originalRow = rawData[row._rowNum - 2];
      return { ...obj, ...originalRow };
    });
    
    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, "Import_Error_Report.xlsx");
  };

  const downloadTemplate = () => {
    const templateData = [{
      'Company': 'Acme Corp',
      'Decision Maker': 'John Doe',
      'Email': 'john@acme.com',
      'Phone': '9876543210',
      'Lead Source': 'Website',
      'To be assigned': 'Sivaram B',
      'Industry': 'Mining',
      'Remarks': 'Sample note (blanks allowed)',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Title': 'CTO'
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Lead_Import_Template.xlsx");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-[850px] max-w-full">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-brand-border gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-brand-text">Bulk Lead Import</h2>
            <p className="text-xs text-brand-silver mt-0.5">Upload CSV or Excel files. Blank fields are safely preserved.</p>
          </div>
        </div>

        {/* VISUAL PROGRESS STEPPER */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto mb-8 mt-2 relative px-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-brand-red -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>

          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Map Fields' },
            { num: 3, label: 'Preview' },
            { num: 4, label: 'Results' }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center z-10">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-all shadow-sm ${
                  step >= s.num 
                    ? 'bg-brand-red border-brand-red text-white' 
                    : 'bg-white border-brand-border text-brand-silver'
                }`}
              >
                {step > s.num ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span 
                className={`text-[9px] font-black uppercase tracking-wider mt-2.5 px-2.5 py-0.5 rounded-md transition-all ${
                  step === s.num 
                    ? 'text-brand-red bg-brand-redLight/40 border border-brand-red/10' 
                    : 'text-brand-silver bg-white border border-brand-border/40'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="border-2 border-dashed border-brand-border bg-brand-surfaceAlt rounded-xl w-full p-12 text-center relative hover:bg-brand-border/20 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-redLight/50 border border-brand-red/10 text-brand-red mb-4 shadow-sm">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="font-bold text-brand-text mb-2">Click or Drag & Drop file here</h3>
              <p className="text-sm text-brand-silver">Supports .xlsx, .xls, .csv (Blanks are safely preserved)</p>
            </div>
            <div className="mt-6 text-sm text-brand-silver flex gap-4">
              Need a template? <button onClick={downloadTemplate} className="text-brand-red hover:underline font-bold">Download Excel Template</button>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
          <div>
            <p className="text-sm text-brand-silver mb-4">Map columns from your file to CRM fields. Only <strong>Company</strong> is required; all other missing fields will remain blank.</p>
            <div className="max-h-[380px] overflow-y-auto pr-2">
              <table className="w-full text-sm text-left">
                <thead className="bg-brand-surfaceAlt text-brand-silver font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-lg">CRM Field</th>
                    <th className="py-3 px-4 rounded-tr-lg">File Column</th>
                  </tr>
                </thead>
                <tbody>
                  {CRM_FIELDS.map(field => (
                    <tr key={field.key} className="border-b border-brand-border last:border-0">
                      <td className="py-3 px-4 font-bold text-brand-text">
                        {field.label} {field.required && <span className="text-brand-red">*</span>}
                      </td>
                      <td className="py-3 px-4">
                        <select 
                          className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-silver"
                          value={mapping[field.key] || ''}
                          onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        >
                          <option value="">-- Leave Blank / Unmapped --</option>
                          {rawColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setStep(1)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2 font-bold hover:bg-gray-200">Back</button>
              <button onClick={processPreview} className="bg-brand-red text-white text-sm rounded-xl px-6 py-2 font-bold hover:bg-red-700">Preview Import</button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {step === 3 && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-brand-surfaceAlt p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-brand-text">{rawData.length}</div>
                <div className="text-[10px] font-bold text-brand-silver uppercase">Total Rows</div>
              </div>
              <div 
                onClick={() => setPreviewTab('valid')} 
                className={`p-4 rounded-xl text-center border cursor-pointer transition ${previewTab === 'valid' ? 'bg-green-100 border-green-300 ring-2 ring-green-400' : 'bg-green-50 border-green-100 hover:bg-green-100/50'}`}
              >
                <div className="text-2xl font-black text-green-600">{previewData.valid.length}</div>
                <div className="text-[10px] font-bold text-green-700 uppercase">Valid New</div>
              </div>
              <div 
                onClick={() => setPreviewTab('duplicates')} 
                className={`p-4 rounded-xl text-center border cursor-pointer transition ${previewTab === 'duplicates' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-400' : 'bg-orange-50 border-orange-100 hover:bg-orange-100/50'}`}
              >
                <div className="text-2xl font-black text-orange-600">{previewData.duplicates.length}</div>
                <div className="text-[10px] font-bold text-orange-700 uppercase">Duplicates</div>
              </div>
              <div 
                onClick={() => setPreviewTab('invalid')} 
                className={`p-4 rounded-xl text-center border cursor-pointer transition ${previewTab === 'invalid' ? 'bg-red-100 border-red-300 ring-2 ring-red-400' : 'bg-red-50 border-red-100 hover:bg-red-100/50'}`}
              >
                <div className="text-2xl font-black text-brand-red">{previewData.invalid.length}</div>
                <div className="text-[10px] font-bold text-brand-red uppercase">Invalid</div>
              </div>
            </div>

            {previewData.duplicates.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                <h4 className="font-bold text-orange-800 text-sm mb-1">Duplicate Handling</h4>
                <p className="text-xs text-orange-700 mb-3">Found {previewData.duplicates.length} duplicate entries (matching on non-empty email, phone, or contact). Select how to handle them:</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupAction" checked={duplicateAction === 'skip'} onChange={() => setDuplicateAction('skip')} className="accent-brand-red" />
                    Skip Duplicates ({previewData.duplicates.length})
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupAction" checked={duplicateAction === 'update'} onChange={() => setDuplicateAction('update')} className="accent-brand-red" />
                    Update Existing Leads
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupAction" checked={duplicateAction === 'import_anyway'} onChange={() => setDuplicateAction('import_anyway')} className="accent-brand-red" />
                    Import Anyway (Create Duplicates)
                  </label>
                </div>
              </div>
            )}

            {previewData.invalid.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-red-800 text-sm mb-1">{previewData.invalid.length} Invalid Rows</h4>
                  <p className="text-xs text-red-700">These rows are missing the required Company name and will be skipped.</p>
                </div>
                <button onClick={downloadErrorReport} className="text-xs font-bold bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 shadow-xs">
                  Download Error Report
                </button>
              </div>
            )}

            {/* PREVIEW TABLE WITH TABS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPreviewTab('valid')} 
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${previewTab === 'valid' ? 'bg-green-600 text-white' : 'bg-brand-surfaceAlt text-brand-silver hover:text-brand-text'}`}
                  >
                    Valid New ({previewData.valid.length})
                  </button>
                  <button 
                    onClick={() => setPreviewTab('duplicates')} 
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${previewTab === 'duplicates' ? 'bg-orange-600 text-white' : 'bg-brand-surfaceAlt text-brand-silver hover:text-brand-text'}`}
                  >
                    Duplicates ({previewData.duplicates.length})
                  </button>
                  <button 
                    onClick={() => setPreviewTab('invalid')} 
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${previewTab === 'invalid' ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt text-brand-silver hover:text-brand-text'}`}
                  >
                    Invalid ({previewData.invalid.length})
                  </button>
                </div>
                <span className="text-[11px] text-brand-silver">Showing top entries</span>
              </div>

              <div className="overflow-x-auto max-h-[240px] border border-brand-border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brand-surfaceAlt text-brand-silver font-bold uppercase sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Decision Maker</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Phone</th>
                      {previewTab === 'duplicates' && <th className="py-2.5 px-3">Duplicate Reason</th>}
                      {previewTab === 'invalid' && <th className="py-2.5 px-3">Error Reason</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewTab === 'valid' && previewData.valid.slice(0, 15).map((row, i) => (
                      <tr key={i} className="border-b border-brand-border last:border-0 hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-mono text-brand-silver">{row._rowNum}</td>
                        <td className="py-2 px-3 font-bold text-brand-text">{row.company}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.decisionMaker || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.email || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.phone || <span className="text-gray-300 italic">—</span>}</td>
                      </tr>
                    ))}
                    {previewTab === 'duplicates' && previewData.duplicates.slice(0, 15).map((row, i) => (
                      <tr key={i} className="border-b border-brand-border last:border-0 bg-orange-50/30 hover:bg-orange-50/70">
                        <td className="py-2 px-3 font-mono text-brand-silver">{row._rowNum}</td>
                        <td className="py-2 px-3 font-bold text-brand-text">{row.company}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.decisionMaker || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.email || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.phone || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-orange-700 font-medium text-[11px]">{row._duplicateReason}</td>
                      </tr>
                    ))}
                    {previewTab === 'invalid' && previewData.invalid.slice(0, 15).map((row, i) => (
                      <tr key={i} className="border-b border-brand-border last:border-0 bg-red-50/30 hover:bg-red-50/70">
                        <td className="py-2 px-3 font-mono text-brand-silver">{row._rowNum}</td>
                        <td className="py-2 px-3 font-bold text-brand-red">{row.company || '<Missing>'}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.decisionMaker || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.email || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.phone || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="py-2 px-3 text-brand-red font-medium text-[11px]">{row._errorReason}</td>
                      </tr>
                    ))}
                    {previewData[previewTab].length === 0 && (
                      <tr><td colSpan="6" className="py-6 text-center text-brand-silver">No records in this category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
              <button onClick={() => setStep(2)} disabled={isImporting} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2 font-bold hover:bg-gray-200">Back</button>
              <button 
                onClick={handleImport} 
                disabled={isImporting || (previewData.valid.length === 0 && (duplicateAction === 'skip' || previewData.duplicates.length === 0))}
                className="bg-brand-red text-white text-sm rounded-xl px-6 py-2 font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isImporting ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === 4 && importResult && (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 border border-green-200 text-green-600 mb-6 shadow-sm">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-black text-brand-text mb-2">Import Completed Successfully</h3>
            
            <div className="bg-brand-surfaceAlt border border-brand-border rounded-xl p-6 inline-block text-left min-w-[340px] mt-6 shadow-xs">
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Rows Found:</span>
                <span className="font-bold text-brand-text">{importResult.totalFound}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Leads Created:</span>
                <span className="font-bold text-green-600">+{importResult.created}</span>
              </div>
              {importResult.updated > 0 && (
                <div className="flex justify-between mb-3 text-sm">
                  <span className="text-brand-silver font-bold">Leads Updated:</span>
                  <span className="font-bold text-blue-600">{importResult.updated}</span>
                </div>
              )}
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Generated Lead IDs:</span>
                <span className="font-bold text-brand-text font-mono text-xs">{importResult.leadIdRange}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Duplicates Skipped:</span>
                <span className="font-bold text-orange-600">{importResult.skipped}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-silver font-bold">Invalid Rows (No Company):</span>
                <span className="font-bold text-brand-red">{importResult.invalid}</span>
              </div>
            </div>

            <div className="mt-8">
              <button onClick={handleClose} className="bg-brand-red text-white text-sm rounded-xl px-8 py-3 font-bold hover:bg-red-700 shadow-sm">Done</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
