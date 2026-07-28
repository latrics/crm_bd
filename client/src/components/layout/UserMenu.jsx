import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Bell, Shield, HelpCircle, Bug, LogOut } from 'lucide-react';

export default function UserMenu({ unreadCount: propUnreadCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const organization = 'LATRICS INDIA PRIVATE LIMITED';
  const displayUnread = propUnreadCount || localUnreadCount || 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for dynamic unread notifications updates
  useEffect(() => {
    const handleUnreadUpdate = (e) => {
      setLocalUnreadCount(e.detail || 0);
    };
    window.addEventListener('notifications-unread-count', handleUnreadUpdate);
    return () => window.removeEventListener('notifications-unread-count', handleUnreadUpdate);
  }, []);

  if (!user) return null;

  return (
    <div className="relative flex items-center gap-3.5" ref={menuRef}>
      
      {/* Role Badge - Replicating admin dashboard style */}
      <span className="hidden sm:inline-block text-[10px] font-black tracking-widest text-brand-red bg-brand-redLight/40 px-2.5 py-1.5 rounded-md uppercase border border-brand-red/10">
        {user.role || 'Member'}
      </span>

      {/* Red Circular Profile Initial Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-xs cursor-pointer shadow-sm hover:scale-105 transition-transform active:scale-95 outline-none border-none"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 mt-1 w-[260px] bg-white border border-brand-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Profile Section */}
          <div className="p-4 border-b border-brand-border/60">
            <span className="text-[9px] font-bold text-brand-silver uppercase tracking-wider block mb-2.5">{organization}</span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-brand-border/50 bg-white flex items-center justify-center text-lg font-bold text-slate-700 shadow-inner shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-brand-text truncate leading-tight">
                  {user.name?.toLowerCase().replace(/\s+/g, '.') || user.name}
                </h4>
                <p className="text-[10px] text-brand-silver truncate mt-0.5">{user.email}</p>
                <div className="mt-1.5">
                  <span className="inline-block text-[8px] font-black tracking-widest bg-brand-redLight text-brand-red px-1.5 py-0.5 rounded-md uppercase border border-brand-red/10">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items Section 1 */}
          <div className="p-1.5 flex flex-col gap-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/account');
              }}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-surfaceAlt/80 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
            >
              <User className="w-4 h-4 text-brand-silver shrink-0" />
              <span>Account</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-surfaceAlt/80 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
            >
              <Settings className="w-4 h-4 text-brand-silver shrink-0" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('toggle-notifications'));
              }}
              className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-surfaceAlt/80 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-brand-silver shrink-0" />
                <span>Notifications</span>
              </div>
              {displayUnread > 0 && (
                <span className="bg-brand-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none mr-1">
                  {displayUnread}
                </span>
              )}
            </button>

            {['admin', 'superadmin', 'super_admin', 'administrator'].includes((user.role || '').toLowerCase()) && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/overview');
                }}
                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-surfaceAlt/80 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
              >
                <Shield className="w-4 h-4 text-brand-silver shrink-0" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </div>

          <div className="border-t border-brand-border/40 my-0.5"></div>

          {/* Menu Items Section 2 */}
          <div className="p-1.5 flex flex-col gap-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('open-notifications-fullscreen'));
              }}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-surfaceAlt/80 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
            >
              <HelpCircle className="w-4 h-4 text-brand-silver shrink-0" />
              <span>Help Center</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('open-bug-report-modal'));
              }}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-surfaceAlt/80 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
            >
              <Bug className="w-4 h-4 text-brand-silver shrink-0" />
              <span>Report Bug</span>
            </button>
          </div>

          {/* Footer Sign Out */}
          <div className="p-1.5 border-t border-brand-border/60 bg-slate-50/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-left w-full"
            >
              <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
