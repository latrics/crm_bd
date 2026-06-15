import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const organization = 'Latrics India Private Limited';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-xs ml-2 cursor-pointer shadow-md hover:scale-105 transition-transform active:scale-95 outline-none"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-5 border-b border-brand-border bg-brand-surfaceAlt/30">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">{organization}</span>
              <button onClick={handleLogout} className="text-xs font-bold text-brand-red hover:underline">Sign out</button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-brand-border bg-white flex items-center justify-center text-2xl font-serif font-bold text-brand-text shadow-inner">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-xl font-black text-brand-text truncate leading-tight">{user.name}</h3>
                <p className="text-xs text-brand-silver truncate mb-1">{user.email}</p>
                <div className="flex flex-col gap-1 mt-2 text-left">
                   <div className="text-[9px] font-black bg-brand-redLight text-brand-red px-1.5 py-0.5 rounded inline-block uppercase mb-2">
                     {user.role}
                   </div>
                  <button className="text-[11px] font-bold text-blue-600 hover:underline text-left">View account</button>
                  <button className="text-[11px] font-bold text-blue-600 hover:underline text-left">Profile settings</button>
                </div>
              </div>
              <div className="self-center">
                 <button className="p-1 hover:bg-brand-surfaceAlt rounded transition-colors">
                    <svg className="w-5 h-5 text-brand-silver" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                 </button>
              </div>
            </div>
          </div>

          <div className="p-2 flex flex-col gap-1">
            {(user.role === 'admin' || user.role === 'super_admin') && (
              <button onClick={() => window.open('/admin/overview', '_blank')} className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-text hover:bg-brand-surfaceAlt rounded-lg transition-colors">
                <span className="text-lg opacity-60">🛡️</span> Admin Dashboard
              </button>
            )}
            <button className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-text hover:bg-brand-surfaceAlt rounded-lg transition-colors">
              <span className="text-lg opacity-60">⚙️</span> Settings
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-text hover:bg-brand-surfaceAlt rounded-lg transition-colors">
              <span className="text-lg opacity-60">🎨</span> Theme Setup
            </button>
          </div>

          <div className="p-2 border-t border-brand-border bg-brand-surfaceAlt/20">
             <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-text hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-brand-border">
                <div className="w-6 h-6 rounded-full border border-brand-border flex items-center justify-center bg-white text-[10px]">
                  +
                </div>
                Sign in with a different account
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
