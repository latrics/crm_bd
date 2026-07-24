import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../common/Modal.jsx';
import useCRM from '../../hooks/useCRM.js';
import useToast from '../../hooks/useToast.js';
import { importTenders, updateTender } from '../../api/tendersApi.js';

const TENDER_FIELDS = [
  { key: 'latrics_tender_id', label: 'Latrics Tender ID', aliases: ['latrics tender id', 'latrics id', 'latrics_id', 'ltr id'] },
  { key: 'tender_id', label: 'Tender ID', aliases: ['tender id', 'tender_id', 'tender no', 'tender_no', 'govt tender id'] },
  { key: 'portal', label: 'Portal', aliases: ['portal', 'website', 'source portal', 'portal name'] },
  { key: 'doc_link', label: 'Doc Link', aliases: ['doc link', 'doc_link', 'document link', 'docs url', 'url', 'link'] },
  { key: 'authority', label: 'Authority', required: true, aliases: ['authority', 'organization', 'dept', 'department', 'client'] },
  { key: 'description', label: 'Description', aliases: ['description', 'title', 'subject', 'work description'] },
  { key: 'location', label: 'Location', aliases: ['location', 'place', 'city', 'state'] },
  { key: 'amount', label: 'Amount (Rs.)', aliases: ['amount', 'tender value', 'value', 'cost'] },
  { key: 'opening_date', label: 'Opening Date', aliases: ['opening date', 'start date', 'publish date', 'opening_date'] },
  { key: 'closing_date', label: 'Closing Date', aliases: ['closing date', 'due date', 'end date', 'closing_date'] },
  { key: 'emd', label: 'EMD Status', aliases: ['emd', 'emd status'] },
  { key: 'emd_amount', label: 'EMD Amount', aliases: ['emd amount', 'emd_amount'] },
  { key: 'jv', label: 'JV Status', aliases: ['jv', 'jv status', 'joint venture'] },
  { key: 'jv_partner', label: 'JV Partner', aliases: ['jv partner', 'partner'] },
  { key: 'status', label: 'Status', aliases: ['status', 'stage'] },
  { key: 'notes', label: 'Notes', aliases: ['notes', 'remarks'] }
];

export default function TenderImportWizard({ isOpen, onClose }) {
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
    setIsImporting(false);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!json || json.length < 2) {
          addToast({ type: 'error', message: 'File is empty or missing data rows' });
          return;
        }

        const headers = json[0].map(h => String(h || '').trim()).filter(Boolean);
        const rows = json.slice(1).filter(r => r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

        setRawColumns(headers);
        setRawData(rows);

        // Auto mapping
        const autoMapping = {};
        headers.forEach(h => {
          const normHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          TENDER_FIELDS.forEach(field => {
            if (autoMapping[field.key]) return;
            const normKey = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchAlias = field.aliases.some(alias => normHeader === alias.replace(/[^a-z0-9]/g, ''));
            if (normHeader === normKey || matchAlias) {
              autoMapping[field.key] = h;
            }
          });
        });

        setMapping(autoMapping);
        setStep(2);
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to parse file: ' + err.message });
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const processPreview = () => {
    const valid = [];
    const invalid = [];
    const duplicates = [];

    rawData.forEach((row, idx) => {
      const tender = { _rowNum: idx + 2 };
      let isValid = true;
      const errorReason = [];

      TENDER_FIELDS.forEach(field => {
        const colHeader = mapping[field.key];
        if (colHeader) {
          const colIdx = rawColumns.indexOf(colHeader);
          if (colIdx !== -1 && row[colIdx] !== undefined && row[colIdx] !== null) {
            tender[field.key] = String(row[colIdx]).trim();
          }
        }
      });

      if (!tender.authority || !tender.authority.trim()) {
        isValid = false;
        errorReason.push('Missing Authority');
      }

      tender._errorReason = errorReason.join(', ');

      if (!isValid) {
        invalid.push(tender);
        return;
      }

      // Check duplicates in database tenders (state.tenders)
      const isDuplicate = state.tenders.find(existing => 
        (tender.tender_id && existing.tender_id && existing.tender_id.toLowerCase() === tender.tender_id.toLowerCase()) ||
        (tender.tender_no && existing.tender_no && existing.tender_no.toLowerCase() === tender.tender_no.toLowerCase()) ||
        (tender.latrics_tender_id && existing.latrics_tender_id && existing.latrics_tender_id.toLowerCase() === tender.latrics_tender_id.toLowerCase())
      );

      if (isDuplicate) {
        tender._existingId = isDuplicate._id;
        duplicates.push(tender);
      } else {
        valid.push(tender);
      }
    });

    setPreviewData({ valid, invalid, duplicates });
    setStep(3);
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    let tendersToImport = [...previewData.valid];
    let tendersToUpdate = [];

    if (duplicateAction === 'import_anyway') {
      tendersToImport = [...tendersToImport, ...previewData.duplicates];
    } else if (duplicateAction === 'update') {
      tendersToUpdate = [...previewData.duplicates];
    } // If 'skip', duplicates are ignored

    try {
      let createdCount = 0;
      let tenderIdRange = 'N/A';

      if (tendersToImport.length > 0) {
        const res = await importTenders(tendersToImport);
        if (res && res.success) {
          createdCount = res.count || res.data.length;
          const tenderIds = res.data.map(t => t.latrics_tender_id).filter(Boolean);
          if (tenderIds.length > 0) {
            tenderIdRange = tenderIds.length === 1 
              ? tenderIds[0] 
              : `${tenderIds[0]} to ${tenderIds[tenderIds.length - 1]}`;
          }
          res.data.forEach(t => dispatch({ type: 'ADD_TENDER', payload: t }));
        }
      }

      let updatedCount = 0;
      if (tendersToUpdate.length > 0) {
        for (const tender of tendersToUpdate) {
          try {
            const { _rowNum, _errorReason, _existingId, ...updateData } = tender;
            const res = await updateTender(_existingId, updateData);
            if (res && res.success !== false) {
              dispatch({ type: 'UPDATE_TENDER', payload: res.data });
              updatedCount++;
            }
          } catch (e) {
            console.error('Failed to update duplicate tender', e);
          }
        }
      }

      setImportResult({
        totalFound: rawData.length,
        created: createdCount,
        updated: updatedCount,
        skipped: duplicateAction === 'skip' ? previewData.duplicates.length : 0,
        invalid: previewData.invalid.length,
        tenderIdRange
      });

      addToast({ 
        type: 'success', 
        message: `Import complete: ${createdCount} created, ${updatedCount} updated` 
      });
      setStep(4);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-[800px] max-w-full">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-brand-border gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-brand-text">Import Tenders</h2>
          </div>
        </div>

        {/* VISUAL PROGRESS STEPPER */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto mb-8 mt-2 relative px-4">
          {/* Background line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          {/* Active progress line */}
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
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-brand-border bg-brand-surfaceAlt rounded-xl w-full p-12 text-center relative hover:bg-brand-border/20 transition cursor-pointer"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-redLight/50 border border-brand-red/10 text-brand-red mb-4 shadow-sm">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="font-bold text-brand-text mb-2">Click or Drag & Drop file here</h3>
              <p className="text-sm text-brand-silver">Supports .xlsx, .xls, .csv</p>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-brand-silver font-bold uppercase tracking-wider">Map CSV Columns to Tender Fields:</p>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {TENDER_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col gap-1 p-2.5 bg-brand-surfaceAlt rounded-xl border border-brand-border">
                  <span className="text-xs font-bold text-brand-text flex items-center justify-between">
                    {field.label}
                    {field.required && <span className="text-brand-red text-[10px]">*required</span>}
                  </span>
                  <select 
                    value={mapping[field.key] || ''} 
                    onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text outline-none focus:border-brand-silver"
                  >
                    <option value="">-- Skip Field --</option>
                    {rawColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-brand-border">
              <button type="button" onClick={() => setStep(1)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-xs rounded-xl px-4 py-2 font-bold hover:bg-gray-200">Back</button>
              <button type="button" onClick={processPreview} className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-red-700 shadow-md">Next: Preview ({rawData.length} rows)</button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-4 mb-2">
              <div className="bg-brand-surfaceAlt p-4 rounded-xl text-center border border-brand-border">
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

            {/* DUPLICATE RESOLUTION CONTROLS */}
            {previewData.duplicates.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <h4 className="font-bold text-orange-800 text-sm mb-2">Duplicate Resolution</h4>
                <p className="text-xs text-orange-700 mb-3">We found {previewData.duplicates.length} rows that match existing tenders by ID or Number.</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupActionTnd" checked={duplicateAction === 'skip'} onChange={() => setDuplicateAction('skip')} className="accent-brand-red" />
                    Skip Duplicates
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupActionTnd" checked={duplicateAction === 'update'} onChange={() => setDuplicateAction('update')} className="accent-brand-red" />
                    Update Existing Tenders
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-brand-text cursor-pointer">
                    <input type="radio" name="dupActionTnd" checked={duplicateAction === 'import_anyway'} onChange={() => setDuplicateAction('import_anyway')} className="accent-brand-red" />
                    Import Anyway
                  </label>
                </div>
              </div>
            )}

            {previewData.invalid.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-red-800 text-sm mb-1">{previewData.invalid.length} Invalid Rows</h4>
                  <p className="text-xs text-red-700">These rows are missing required fields (like Authority) and will be skipped.</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-bold text-sm mb-3">Preview (First 5 valid rows)</h4>
              <div className="max-h-[30vh] overflow-auto border border-brand-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-surfaceAlt border-b border-brand-border font-bold text-brand-silver uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Latrics ID</th>
                      <th className="p-2.5">Tender ID</th>
                      <th className="p-2.5">Portal</th>
                      <th className="p-2.5">Authority</th>
                      <th className="p-2.5">Doc Link</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-brand-text bg-white">
                    {previewData.valid.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 font-mono font-bold text-brand-red">{row.latrics_tender_id || '(Auto-gen)'}</td>
                        <td className="p-2.5 font-bold">{row.tender_id || row.tender_no || '--'}</td>
                        <td className="p-2.5">{row.portal || '--'}</td>
                        <td className="p-2.5 font-medium">{row.authority}</td>
                        <td className="p-2.5 max-w-[120px] truncate text-brand-silver">{row.doc_link || '--'}</td>
                        <td className="p-2.5">{row.status}</td>
                      </tr>
                    ))}
                    {previewData.valid.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-brand-silver">No valid new tenders to preview.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-brand-border">
              <button type="button" onClick={() => setStep(2)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-xs rounded-xl px-4 py-2 font-bold hover:bg-gray-200">Back</button>
              <button 
                type="button" 
                onClick={handleExecuteImport} 
                disabled={isImporting}
                className="px-6 py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-red-700 shadow-md transition-all"
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
            
            <div className="bg-brand-surfaceAlt border border-brand-border rounded-xl p-6 inline-block text-left min-w-[320px] mt-6 shadow-xs">
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Rows Found:</span>
                <span className="font-bold">{importResult.totalFound}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Tenders Created:</span>
                <span className="font-bold text-green-600">{importResult.created}</span>
              </div>
              {importResult.updated > 0 && (
                <div className="flex justify-between mb-3 text-sm">
                  <span className="text-brand-silver font-bold">Tenders Updated:</span>
                  <span className="font-bold text-blue-600">{importResult.updated}</span>
                </div>
              )}
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-brand-silver font-bold">Generated Tender IDs:</span>
                <span className="font-bold text-brand-text">{importResult.tenderIdRange}</span>
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
              <button type="button" onClick={handleClose} className="bg-brand-red text-white text-sm rounded-xl px-8 py-3 font-bold hover:bg-red-700 shadow-md">Done</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
