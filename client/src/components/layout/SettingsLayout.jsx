import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, UserCircle, Bell, Palette, Shield, Bug, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function SettingsLayout({ children }) {
  const navigate = useNavigate();
  const { settings } = useTheme();
  const sidebarLinks = [
    { to: '/account', label: 'Account', icon: User },
    { to: '/profile', label: 'Profile', icon: UserCircle },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/security', label: 'Security', icon: Shield },
    { to: '/bug-center', label: 'Bug Center', icon: Bug },
  ];

  const paddingClassNeg = settings.paddingX === '32px'
    ? 'lg:-ml-8'
    : settings.paddingX === '48px'
    ? 'lg:-ml-12'
    : settings.paddingX === '80px'
    ? 'lg:-ml-20'
    : 'lg:-ml-16';

  return (
    <div className={`flex flex-col lg:block animate-in fade-in duration-200 ${paddingClassNeg}`}>
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between pb-2 lg:pb-0 lg:fixed lg:top-16 lg:left-0 lg:h-[calc(100vh-64px)] lg:bg-white lg:border-r lg:border-gray-100 lg:z-10 lg:overflow-y-auto lg:pt-5 lg:pb-8 lg:px-4">
        {/* Navigation list */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none border-b border-brand-border/60 lg:border-b-0">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            
            if (link.isExternal) {
              return (
                <button
                  key={link.to}
                  onClick={() => {
                    // Open notifications drawer/fullscreen
                    window.dispatchEvent(new CustomEvent('open-notifications-fullscreen'));
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-charcoal/80 hover:text-brand-charcoal hover:bg-gray-50 rounded-lg transition-all shrink-0 border-none bg-transparent cursor-pointer text-left w-full group"
                >
                  <span className="opacity-40 group-hover:opacity-75 transition-opacity duration-200">
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                  </span>
                  <span className="tracking-wide">{link.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group w-full ${
                    isActive
                      ? 'bg-brand-red/[0.04] text-brand-red font-semibold'
                      : 'text-brand-charcoal/80 hover:text-brand-charcoal hover:bg-gray-50 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                    </span>
                    <span className="tracking-wide">{link.label}</span>
                    {isActive && (
                      <span className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-brand-red rounded-r" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Support Help Card - Entire Card is Clickable & Interactive */}
        <button 
          type="button"
          onClick={() => navigate('/help-center')}
          className="hidden lg:flex w-full text-left items-center gap-2.5 bg-brand-surfaceAlt/60 hover:bg-white border border-brand-border/60 hover:border-brand-red/30 rounded-xl p-3 mt-6 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-200 cursor-pointer group border-none active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-full bg-brand-redLight group-hover:bg-brand-red group-hover:text-white text-brand-red flex items-center justify-center shrink-0 border border-brand-red/20 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-[11px] font-bold text-brand-text group-hover:text-brand-red transition-colors">Need Help?</h4>
            <span className="text-[9px] font-bold text-brand-silver group-hover:text-brand-red flex items-center gap-1 mt-0.5 transition-colors">
              Visit Help Center <span className="text-[10px] transition-transform group-hover:translate-x-1">&rarr;</span>
            </span>
          </div>
        </button>
      </aside>

      <main className="w-full flex flex-col justify-start lg:pl-[280px]">
        {children || <Outlet />}
      </main>
    </div>
  );
}
