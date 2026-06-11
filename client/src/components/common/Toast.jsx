import useToast from '../../hooks/useToast.js';

export default function ToastContainer() {
  const { toasts } = useToast();
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => {
        let bg = '#54585A'; // info
        if (t.type === 'success') bg = '#16a34a';
        if (t.type === 'error') bg = '#DA291C';
        if (t.type === 'info') bg = '#2563EB';

        return (
          <div key={t.id} style={{ backgroundColor: bg }} className="rounded-xl px-4 py-3 font-bold text-sm text-white flex items-center gap-2 shadow-lg animate-[slideIn_0.3s_ease-out]">
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
