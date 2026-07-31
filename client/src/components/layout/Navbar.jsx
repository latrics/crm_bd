import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useCRM from '../../hooks/useCRM.js';
import UserMenu from './UserMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { state } = useCRM();
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleUnreadUpdate = (e) => {
      setUnreadCount(e.detail || 0);
    };
    window.addEventListener('notifications-unread-count', handleUnreadUpdate);
    return () => {
      window.removeEventListener('notifications-unread-count', handleUnreadUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Enforcing standard 64px (px-6 sm:px-12 lg:px-16) side padding globally
  const paddingClass = settings.paddingX === '32px' 
    ? 'px-4 sm:px-8' 
    : settings.paddingX === '48px' 
    ? 'px-6 sm:px-12' 
    : settings.paddingX === '80px' 
    ? 'px-8 sm:px-20' 
    : 'px-6 sm:px-12 lg:px-16'; // Standard 64px (px-16) default

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-1 pb-4 pt-5 font-bold text-xs uppercase tracking-widest ${isActive ? 'text-brand-red border-b-2 border-brand-red' : 'text-brand-silver hover:text-brand-text'} transition-all`;
  
  const badgeClass = (isActive) =>
    `px-2 py-0.5 rounded-full text-[10px] ml-1 ${isActive ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt text-brand-silver'}`;

  return (
    <nav className="border-b border-brand-border bg-white fixed top-0 left-0 w-full z-50 shadow-sm transition-all duration-150">
      <div className={`w-full ${paddingClass} flex justify-between items-center h-16`}>
        <div className="flex items-center gap-8 md:gap-12 h-full">
          <div 
            onClick={() => navigate('/dashboard')}
            className="font-serif text-xl font-black text-brand-red tracking-wide flex items-center border-r-2 border-brand-red pr-6 h-8 cursor-pointer select-none"
          >
            LATRICS
          </div>
          <div className="flex items-center gap-6 h-full overflow-x-auto scrollbar-none">
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/leads" className={navClass}>
              {({ isActive }) => (
                <>
                  <span>Leads</span>
                  <span className={badgeClass(isActive)}>{(state.leads || []).filter(l => l && l.status !== 'Converted').length}</span>
                </>
              )}
            </NavLink>
            <NavLink to="/deals" className={navClass}>
              {({ isActive }) => (
                <>
                  <span>Deals</span>
                  <span className={badgeClass(isActive)}>{state.deals.length}</span>
                </>
              )}
            </NavLink>
            <NavLink to="/tenders" className={navClass}>
              {({ isActive }) => (
                <>
                  <span>Tenders</span>
                  <span className={badgeClass(isActive)}>{state.tenders.length}</span>
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* User Menu & Profile Dropdown */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => updateSetting('mode', settings.mode === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-brand-border hover:bg-brand-surfaceAlt transition-colors shadow-sm cursor-pointer text-brand-silver bg-transparent"
            title={settings.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {settings.mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 shrink-0" />
            )}
          </button>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-notifications'))}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-brand-border hover:bg-brand-surfaceAlt transition-colors shadow-sm relative cursor-pointer"
            title="Notifications"
          >
            <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-red rounded-full border border-white animate-pulse" />
            )}
          </button>
          <UserMenu unreadCount={unreadCount} />
        </div>
      </div>
    </nav>
  );
}
