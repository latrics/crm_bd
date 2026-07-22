import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../common/Modal.jsx';
import useCRM from '../../hooks/useCRM.js';
import useToast from '../../hooks/useToast.js';
import { importTenders } from '../../api/tendersApi.js';

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
  const { dispatch } = useCRM();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [rawColumns, setRawColumns] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setRawColumns([]);
    setRawData([]);
    setMapping({});
    setPreviewData([]);
    setIsImporting(false);
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

  const generatePreview = () => {
    const parsed = rawData.map((row) => {
      const obj = {};
      TENDER_FIELDS.forEach(field => {
        const colHeader = mapping[field.key];
        if (colHeader) {
          const colIdx = rawColumns.indexOf(colHeader);
          if (colIdx !== -1 && row[colIdx] !== undefined && row[colIdx] !== null) {
            obj[field.key] = String(row[colIdx]).trim();
          }
        }
      });
      if (!obj.authority) obj.authority = 'Unknown Authority';
      if (!obj.status) obj.status = 'New';
      if (!obj.emd) obj.emd = 'EMD Exempted';
      if (!obj.jv) obj.jv = 'JV Not Allowed';
      return obj;
    });

    setPreviewData(parsed);
    setStep(3);
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      const res = await importTenders(previewData);
      if (res.data) {
        if (Array.isArray(res.data)) {
          res.data.forEach(tender => dispatch({ type: 'ADD_TENDER', payload: tender }));
        }
        addToast({ type: 'success', message: `${res.count || previewData.length} Tenders imported successfully` });
        handleClose();
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-brand-text">Import Tenders</h2>
          <p className="text-xs text-brand-silver">Upload Excel or CSV file to bulk add tenders</p>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-brand-border rounded-2xl bg-brand-surfaceAlt/40">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <svg className="w-12 h-12 text-brand-silver mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="text-sm font-bold text-brand-text mb-1">Click to select an Excel / CSV file</p>
          <p className="text-xs text-brand-silver mb-4">Supports .xlsx, .xls, and .csv formats</p>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl shadow-md hover:bg-red-700 transition-all"
          >
            Select File
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs text-brand-silver font-bold uppercase tracking-wider">Map CSV Columns to Tender Fields:</p>
          <div className="grid grid-cols-2 gap-3">
            {TENDER_FIELDS.map(field => (
              <div key={field.key} className="flex flex-col gap-1 p-2.5 bg-brand-surfaceAlt rounded-xl border border-brand-border">
                <span className="text-xs font-bold text-brand-text flex items-center justify-between">
                  {field.label}
                  {field.required && <span className="text-brand-red text-[10px]">*required</span>}
                </span>
                <select 
                  value={mapping[field.key] || ''} 
                  onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text outline-none"
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
            <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-brand-silver hover:text-brand-text">Back</button>
            <button type="button" onClick={generatePreview} className="px-5 py-2 bg-brand-red text-white text-xs font-bold rounded-xl">Next: Preview ({rawData.length} rows)</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-brand-surfaceAlt p-3 rounded-xl border border-brand-border">
            <span className="text-xs font-bold text-brand-text">Ready to import {previewData.length} Tenders</span>
          </div>

          <div className="max-h-[40vh] overflow-auto border border-brand-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-surfaceAlt border-b border-brand-border font-bold text-brand-silver">
                <tr>
                  <th className="p-2.5">Latrics ID</th>
                  <th className="p-2.5">Tender ID</th>
                  <th className="p-2.5">Portal</th>
                  <th className="p-2.5">Authority</th>
                  <th className="p-2.5">Doc Link</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2.5 font-mono font-bold text-brand-red">{row.latrics_tender_id || '(Auto-gen)'}</td>
                    <td className="p-2.5 font-bold">{row.tender_id || row.tender_no || '--'}</td>
                    <td className="p-2.5">{row.portal || '--'}</td>
                    <td className="p-2.5">{row.authority}</td>
                    <td className="p-2.5 max-w-[120px] truncate text-brand-silver">{row.doc_link || '--'}</td>
                    <td className="p-2.5">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-brand-border">
            <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-brand-silver hover:text-brand-text">Back to Mapping</button>
            <button 
              type="button" 
              onClick={handleExecuteImport} 
              disabled={isImporting}
              className="px-6 py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all"
            >
              {isImporting ? 'Importing...' : `Import ${previewData.length} Tenders`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
