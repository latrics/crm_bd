import { useState, useRef } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { uploadDoc, deleteDoc as apiDeleteDoc } from '../../api/docsApi.js';
import useToast from '../../hooks/useToast.js';
import { fileIcon, fmtBytes, today } from '../../utils/formatters.js';
import { DOC_TYPES } from '../../constants/index.js';
import Confirm from '../common/Confirm.jsx';

export default function DocsPanel({ entityId, entityType }) {
  const { state, dispatch } = useCRM();
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const docs = state.docs.filter(d => d.entity_id === entityId && d.entity_type === entityType);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const payload = {
          entity_id: entityId,
          entity_type: entityType,
          name: file.name,
          size: file.size,
          mime_type: file.type,
          doc_type: 'Others', // Defaulting to Others for quick upload
          data_url: reader.result
        };
        const res = await uploadDoc(payload);
        dispatch({ type: 'ADD_DOC', payload: res.data });
        addToast({ type: 'success', message: 'Document uploaded' });
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Upload failed' });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiDeleteDoc(deleteId);
      dispatch({ type: 'DELETE_DOC', payload: deleteId });
      addToast({ type: 'success', message: 'Document deleted' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Delete failed' });
    }
    setDeleteId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-brand-text">Documents</h3>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-brand-red text-white font-bold text-xs rounded-xl px-5 py-2 cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {docs.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-brand-border bg-brand-surfaceAlt/50 rounded-xl p-8 flex items-center justify-center cursor-pointer hover:bg-brand-surfaceAlt transition-colors"
        >
          <span className="text-xs font-bold text-brand-silver">Click Upload to attach files</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map(doc => (
            <div key={doc._id} className="flex justify-between items-center p-3 border border-brand-border rounded-lg bg-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{fileIcon(doc.name)}</span>
                <div>
                  <a href={doc.data_url} download={doc.name} className="font-bold text-brand-text hover:text-brand-red transition-colors text-sm">{doc.name}</a>
                  <div className="text-[10px] text-brand-silver font-bold uppercase tracking-wider">{fmtBytes(doc.size)} • {doc.createdAt?.slice(0,10) || today()}</div>
                </div>
              </div>
              <button onClick={() => setDeleteId(doc._id)} className="text-brand-silver hover:text-brand-red p-2 rounded-full font-bold transition-colors">&times;</button>
            </div>
          ))}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-brand-border bg-brand-surfaceAlt/50 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-brand-surfaceAlt transition-colors mt-2"
          >
            <span className="text-xs font-bold text-brand-silver">Click Upload to attach more files</span>
          </div>
        </div>
      )}

      <Confirm 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Document" 
        message="Are you sure you want to delete this document?" 
      />
    </div>
  );
}
