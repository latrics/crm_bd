import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../common/Modal.jsx';
import useCRM from '../../hooks/useCRM.js';
import useToast from '../../hooks/useToast.js';
import { importLeads, updateLead } from '../../api/leadsApi.js';
import { LEAD_STAGES, SOURCES, OWNERS, SECTORS } from '../../constants/index.js';

const CRM_FIELDS = [
  { key: 'decisionMaker', label: 'Decision Maker', aliases: ['decision maker', 'name', 'contact person'] },
  { key: 'company', label: 'Company', required: true, aliases: ['company', 'company name', 'organization'] },
  { key: 'email', label: 'Email', required: true, aliases: ['email', 'email id', 'email address'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'phone number', 'contact number', 'mobile'] },
  { key: 'value', label: 'Value (Rs.)', aliases: ['value', 'revenue', 'amount'] },
  { key: 'bio', label: 'Bio / Notes', aliases: ['bio', 'bio notes', 'about'] },
  { key: 'remarks', label: 'Remarks', aliases: ['remarks', 'notes'] },
  { key: 'city', label: 'City', aliases: ['city', 'location'] },
  { key: 'state', label: 'State', aliases: ['state', 'region'] },
  { key: 'designation', label: 'Title / Designation', aliases: ['title', 'designation', 'job title'] },
  { key: 'outbound', label: 'Lead Source', aliases: ['lead source', 'source', 'outbound'] },
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

    rawData.forEach((row, index) => {
      const lead = {
        _rowNum: index + 2 // +1 for 0-index, +1 for header
      };
      
      let isValid = true;
      let errorReason = [];

      // Extract mapped fields
      CRM_FIELDS.forEach(field => {
        const colName = mapping[field.key];
        let val = colName && row[colName] !== undefined && row[colName] !== '' ? row[colName] : null;
        
        if (field.required && !val) {
          isValid = false;
          errorReason.push(`Missing required field: ${field.label}`);
        }
        
        if (val && field.key === 'value') val = Number(val) || 0;
        
        if (val) lead[field.key] = typeof val === 'string' ? val.trim() : val;
      });

      if (!lead.status) lead.status = 'Leads';

      const dmLower = lead.decisionMaker ? lead.decisionMaker.toLowerCase() : '';
      if (!lead.decisionMaker || ['na', 'n/a', 'not available', '-'].includes(dmLower)) {
        lead.decisionMaker = lead.company || '';
      }

      lead._errorReason = errorReason.join(', ');

      if (!isValid) {
        invalid.push(lead);
        return;
      }

      // Check for duplicates in state.leads
      const isDuplicate = state.leads.find(existing => 
        (lead.email && existing.email && existing.email.toLowerCase() === lead.email.toLowerCase()) ||
        (lead.phone && existing.phone && existing.phone === lead.phone) ||
        (lead.decisionMaker && lead.company && existing.decisionMaker && existing.decisionMaker.toLowerCase() === lead.decisionMaker.toLowerCase() && existing.company.toLowerCase() === lead.company.toLowerCase())
      );

      if (isDuplicate) {
        lead._existingId = isDuplicate._id;
        duplicates.push(lead);
      } else {
        valid.push(lead);
      }
    });

    setPreviewData({ valid, invalid, duplicates });
    setStep(3);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let leadsToImport = [...previewData.valid];
    let leadsToUpdate = [];

    if (duplicateAction === 'import_anyway') {
      leadsToImport = [...leadsToImport, ...previewData.duplicates];
    } else if (duplicateAction === 'update') {
      leadsToUpdate = [...previewData.duplicates];
    } // if 'skip', we just ignore previewData.duplicates

    try {
      let createdCount = 0;
      let leadIdRange = 'N/A';

      if (leadsToImport.length > 0) {
        const res = await importLeads({ leads: leadsToImport });
        if (res && res.success) {
          createdCount = res.total;
          leadIdRange = res.leadIdRange;
          // Optimistically update local state or trigger a re-fetch
          res.data.forEach(l => dispatch({ type: 'ADD_LEAD', payload: l }));
        }
      }

      let updatedCount = 0;
      if (leadsToUpdate.length > 0) {
        for (const lead of leadsToUpdate) {
          try {
            const { _rowNum, _errorReason, _existingId, ...updateData } = lead;
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
        skipped: duplicateAction === 'skip' ? previewData.duplicates.length : 0,
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
      // Include original data
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
      'Decision Maker': 'John Doe',
      'Company': 'Acme Corp',
      'Email': 'john@acme.com',
      'Phone': '9876543210',
      'Lead Source': 'Website',
      'To be assigned': 'Sivaram B',
      'Industry': 'Mining',
      'Remarks': 'Sample note',
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
      <div className="w-[800px] max-w-full">
        <div className="mb-6 flex justify-between items-center border-b pb-4 border-brand-border">
          <h2 className="text-xl font-serif font-bold text-brand-text">Bulk Lead Import</h2>
          <div className="flex gap-2 text-sm text-brand-silver font-bold">
            <span className={step === 1 ? 'text-brand-red' : ''}>1. Upload</span> / 
            <span className={step === 2 ? 'text-brand-red' : ''}>2. Map Fields</span> / 
            <span className={step === 3 ? 'text-brand-red' : ''}>3. Preview</span> / 
            <span className={step === 4 ? 'text-brand-red' : ''}>4. Result</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="border-2 border-dashed border-brand-border bg-brand-surfaceAlt rounded-xl w-full p-12 text-center relative hover:bg-brand-border/20 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="text-4xl mb-4">📄</div>
              <h3 className="font-bold text-brand-text mb-2">Click or Drag & Drop file here</h3>
              <p className="text-sm text-brand-silver">Supports .xlsx, .xls, .csv</p>
            </div>
            <div className="mt-6 text-sm text-brand-silver flex gap-4">
              Need a template? <button onClick={downloadTemplate} className="text-brand-red hover:underline font-bold">Download Excel Template</button>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
          <div>
            <p className="text-sm text-brand-silver mb-4">Map the columns from your uploaded file to the corresponding CRM Lead fields.</p>
            <div className="max-h-[400px] overflow-y-auto pr-2">
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
                          <option value="">-- Ignore this field --</option>
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
              <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                <div className="text-2xl font-black text-green-600">{previewData.valid.length}</div>
                <div className="text-[10px] font-bold text-green-600 uppercase">Valid New</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
                <div className="text-2xl font-black text-orange-600">{previewData.duplicates.length}</div>
                <div className="text-[10px] font-bold text-orange-600 uppercase">Duplicates</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                <div className="text-2xl font-black text-brand-red">{previewData.invalid.length}</div>
                <div className="text-[10px] font-bold text-brand-red uppercase">Invalid</div>
              </div>
            </div>

            {previewData.duplicates.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                <h4 className="font-bold text-orange-800 text-sm mb-2">Duplicate Resolution</h4>
                <p className="text-xs text-orange-700 mb-3">We found {previewData.duplicates.length} rows that match existing leads by Email, Phone, or Name+Company.</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupAction" checked={duplicateAction === 'skip'} onChange={() => setDuplicateAction('skip')} className="accent-brand-red" />
                    Skip Duplicates
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
                  <p className="text-xs text-red-700">These rows are missing required fields and will be skipped.</p>
                </div>
                <button onClick={downloadErrorReport} className="text-xs font-bold bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                  Download Error Report
                </button>
              </div>
            )}

            <div>
              <h4 className="font-bold text-sm mb-3">Preview (First 5 valid rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brand-surfaceAlt text-brand-silver font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">Decision Maker</th>
                      <th className="py-2 px-3">Company</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.valid.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-brand-border">
                        <td className="py-2 px-3 font-bold text-brand-text">{row.decisionMaker}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.company}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.email}</td>
                        <td className="py-2 px-3 text-brand-silver">{row.phone}</td>
                      </tr>
                    ))}
                    {previewData.valid.length === 0 && (
                      <tr><td colSpan="4" className="py-4 text-center text-brand-silver">No valid rows to preview.</td></tr>
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
                className="bg-brand-red text-white text-sm rounded-xl px-6 py-2 font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === 4 && importResult && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-serif font-black text-brand-text mb-2">Import Completed Successfully</h3>
            
            <div className="bg-brand-surfaceAlt rounded-xl p-6 inline-block text-left min-w-[300px] mt-6">
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Rows Found:</span>
                <span className="font-bold">{importResult.totalFound}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Leads Created:</span>
                <span className="font-bold text-green-600">{importResult.created}</span>
              </div>
              {importResult.updated > 0 && (
                <div className="flex justify-between mb-3 text-sm">
                  <span className="text-brand-silver font-bold">Leads Updated:</span>
                  <span className="font-bold text-blue-600">{importResult.updated}</span>
                </div>
              )}
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Generated Lead IDs:</span>
                <span className="font-bold text-brand-text">{importResult.leadIdRange}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Duplicates Skipped:</span>
                <span className="font-bold text-orange-600">{importResult.skipped}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-silver font-bold">Invalid Rows:</span>
                <span className="font-bold text-brand-red">{importResult.invalid}</span>
              </div>
            </div>

            <div className="mt-8">
              <button onClick={handleClose} className="bg-brand-red text-white text-sm rounded-xl px-8 py-3 font-bold hover:bg-red-700">Done</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
