import Modal from './Modal.jsx';

export default function Confirm({ isOpen, onClose, title, message, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-serif font-bold text-brand-text mb-4">{title}</h2>
      <p className="text-sm text-brand-text mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2 cursor-pointer">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 cursor-pointer hover:opacity-90">Confirm</button>
      </div>
    </Modal>
  );
}
