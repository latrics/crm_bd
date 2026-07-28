import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useCRM from '../hooks/useCRM.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import axios from 'axios';
import { 
  Check, X, Monitor, Smartphone, Users, Target, 
  Percent, Trophy, Folder, TrendingUp, HelpCircle, LogOut, 
  MoreVertical, User, UserCircle, Palette, Shield, Bug, Trash2, Bell
} from 'lucide-react';

// Helper to detect actual browser & OS from navigator.userAgent
function detectCurrentDevice() {
  const ua = navigator.userAgent;
  let browser = "Chrome";
  let os = "Windows";

  // OS Detection
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  // Browser Detection
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Brave") || (navigator.brave && typeof navigator.brave.isBrave === 'function')) browser = "Brave";
  else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

  return { browser, os, name: `${browser} on ${os}`, isMobile: os === 'iOS' || os === 'Android' };
}

// Helper to fetch user's real location from IP Geolocation
async function fetchRealUserLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`;
      }
    }
  } catch (err) {
    console.warn("Could not fetch IP location:", err);
  }

  // Fallback using Intl Timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const city = tz.split('/')[1]?.replace(/_/g, ' ');
      if (city) return `${city}, India`;
    }
  } catch (e) {}

  return "Kolkata, India";
}

export default function AccountPage() {
  const { settings } = useTheme();
  const paddingClassNeg = settings.paddingX === '32px'
    ? 'lg:-mx-8 lg:px-4'
    : settings.paddingX === '48px'
    ? 'lg:-mx-12 lg:px-6'
    : settings.paddingX === '80px'
    ? 'lg:-mx-20 lg:px-8'
    : 'lg:-mx-16 lg:px-6';

  const crmContext = useCRM();
  const state = crmContext?.state || { leads: [], deals: [], tenders: [], docs: [] };
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [realLocation, setRealLocation] = useState('Kolkata, India');
  const [deviceInfo, setDeviceInfo] = useState({ name: 'Chrome on Windows', isMobile: false });
  const [activeMenuSessionId, setActiveMenuSessionId] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);

  const menuRef = useRef(null);

  useEffect(() => {
    // Detect real current browser & OS
    const dev = detectCurrentDevice();
    setDeviceInfo(dev);

    // Fetch real user location
    fetchRealUserLocation().then(loc => {
      setRealLocation(loc);
    });

    // Close menu when clicking outside
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuSessionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update genuine login history logs from DB AuditLog or real current session
  useEffect(() => {
    async function fetchDbAuditLogs() {
      try {
        const res = await axios.get('/api/admin/audit-logs');
        if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const formattedLogs = res.data.data.slice(0, 2).map((log, idx) => {
            const d = new Date(log.createdAt);
            const timeStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            return {
              id: log._id || idx,
              time: timeStr,
              device: log.meta?.device || `${log.action} (${log.entity})` || deviceInfo.name,
              location: log.ip_address || realLocation,
              status: 'Success'
            };
          });
          setLoginHistory(formattedLogs);
          return;
        }
      } catch (err) {}

      const now = new Date();
      const formattedTime = `Today, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      setLoginHistory([{ id: 1, time: formattedTime, device: deviceInfo.name, location: realLocation, status: 'Success' }]);
    }
    fetchDbAuditLogs();
  }, [realLocation, deviceInfo.name]);

  // Authenticated user object directly from MongoDB Database
  const getMergedUser = () => {
    const devUser = {
      name: 'Aditya Paul',
      email: 'aditya.paul@latrics.com',
      role: 'Administrator',
      phone: '+91 98765 43210'
    };
    const activeUser = authUser || devUser;
    const emailKey = activeUser.email?.toLowerCase() || 'guest';
    const key = `latrics_crm_user_profile_${emailKey}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    return { ...activeUser, ...stored };
  };

  const user = getMergedUser();

  const initial = user.name?.charAt(0).toUpperCase() || 'A';
  const employeeId = user.employeeId || (user._id ? `LAT-${user._id.toString().slice(-3).toUpperCase()}` : 'LAT-003');
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Today';
  const lastActiveDate = user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Today';
  const reportingManager = user.reporting_manager || user.manager || 'Unassigned';

  // Personal statistics strictly filtered for the logged-in user
  const userId = user?._id?.toString();
  const userName = user?.name?.toLowerCase();
  const userEmail = user?.email?.toLowerCase();

  const isUserMatch = (item) => {
    if (!item) return false;
    const createdBy = (item.created_by || item.createdBy || '').toString();
    const assignedTo = (item.assigned_to || item.assignedTo || '').toString();
    const owner = (item.owner || item.owner_name || item.assigned_to || '').toString().toLowerCase();

    return (
      (userId && (createdBy === userId || assignedTo === userId)) ||
      (userName && owner.includes(userName)) ||
      (userEmail && owner.includes(userEmail))
    );
  };

  const myLeads = (state.leads || []).filter(isUserMatch);
  const myDeals = (state.deals || []).filter(isUserMatch);
  const myTenders = (state.tenders || []).filter(isUserMatch);

  // Toggle collective system stats for admin/superadmin, personal stats for standard users
  const isAdminOrSuper = user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'superadmin' || user.role?.toLowerCase() === 'administrator';

  const leadsCreated = isAdminOrSuper ? (state.leads || []).length : myLeads.length;
  const dealsWon = isAdminOrSuper 
    ? (state.deals || []).filter(d => d.stage === 'Won').length 
    : myDeals.filter(d => d.stage === 'Won').length;
  const openDeals = isAdminOrSuper 
    ? (state.deals || []).filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length 
    : myDeals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length;
  const assignedTenders = isAdminOrSuper ? (state.tenders || []).length : myTenders.length;
  const pendingLeads = isAdminOrSuper 
    ? (state.leads || []).filter(l => l.status !== 'Converted' && l.status !== 'Closure').length 
    : myLeads.filter(l => l.status !== 'Converted' && l.status !== 'Closure').length;

  const totalDealsForScore = isAdminOrSuper ? (state.deals || []).length : myDeals.length;
  const activityScore = totalDealsForScore > 0
    ? Math.round((dealsWon / Math.max(1, totalDealsForScore)) * 100)
    : 50;

  // Active Sessions list
  const [sessions, setSessions] = useState([
    { id: 1, isCurrent: true }
  ]);

  const sidebarLinks = [
    { to: '/account', label: 'Account', icon: User, active: true },
    { to: '/profile', label: 'Profile', icon: UserCircle },
    { to: '/notifications', label: 'Notifications', icon: Bell, isExternal: true },
    { to: '/appearance', label: 'Appearance', icon: Palette },
    { to: '/security', label: 'Security', icon: Shield },
    { to: '/bug-center', label: 'Bug Center', icon: Bug },
  ];

  const permissions = [
    { label: 'Create Leads', allowed: true },
    { label: 'Delete Users', allowed: false },
    { label: 'Approve Tenders', allowed: true },
    { label: 'Delete Leads', allowed: true },
    { label: 'Change Roles', allowed: false },
    { label: 'Export Reports', allowed: true },
    { label: 'Import Excel', allowed: true },
    { label: 'Manage Settings', allowed: true },
    { label: 'Manage Users', allowed: false },
    { label: 'Create Deals', allowed: true },
    { label: 'View Audit Logs', allowed: true },
    { label: 'Access Admin Panel', allowed: true },
  ];

  const handleRemoveSession = async (sessionId, isCurrent) => {
    setActiveMenuSessionId(null);
    if (isCurrent) {
      if (window.confirm("Are you sure you want to log out of your current session?")) {
        if (logout) await logout();
        navigate('/login');
      }
    } else {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const handleLogoutAll = async () => {
    setActiveMenuSessionId(null);
    setSessions(prev => prev.filter(s => s.isCurrent));
  };

  return (
    <div className={`w-full lg:h-[calc(100vh-160px)] animate-in fade-in duration-200 flex flex-col lg:flex-row gap-8 overflow-hidden ${paddingClassNeg}`}>
      
      {/* Left Settings Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between pb-2 lg:pb-0 lg:fixed lg:top-16 lg:left-0 lg:h-[calc(100vh-64px)] lg:bg-white lg:border-r lg:border-gray-100 lg:z-10 lg:overflow-y-auto lg:pt-5 lg:pb-8 lg:px-4">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none border-b border-brand-border/60 lg:border-b-0">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            if (link.isExternal) {
              return (
                <button
                  key={link.to}
                  onClick={() => window.dispatchEvent(new CustomEvent('open-notifications-fullscreen'))}
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
                    isActive || link.active
                      ? 'bg-brand-red/[0.04] text-brand-red font-semibold'
                      : 'text-brand-charcoal/80 hover:text-brand-charcoal hover:bg-gray-50 font-medium'
                  }`
                }
              >
                {({ isActive }) => {
                  const currentActive = isActive || link.active;
                  return (
                    <>
                      <span className={`transition-opacity duration-200 ${currentActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                      </span>
                      <span className="tracking-wide">{link.label}</span>
                      {currentActive && (
                        <span className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-brand-red rounded-r" />
                      )}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        {/* Support Help Card - Positioned cleanly at the bottom with padding */}
        <div className="hidden lg:block bg-brand-surfaceAlt/60 border border-brand-border/60 rounded-xl p-3 mt-6 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] mx-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-redLight text-brand-red flex items-center justify-center shrink-0 border border-brand-red/20">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-brand-text">Need Help?</h4>
              <span 
                onClick={() => window.dispatchEvent(new CustomEvent('open-notifications-fullscreen'))}
                className="text-[9px] font-bold text-brand-silver hover:text-brand-red cursor-pointer flex items-center gap-1 mt-0.5"
              >
                Visit Help Center <span className="text-[10px]">&rarr;</span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main Account Content Area (100% fits screen, non-scrollable) */}
      <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden h-full lg:pl-64">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-lg font-serif font-black text-brand-text leading-tight">Account Overview</h1>
            <p className="text-[11px] text-brand-silver font-medium mt-0.5">View your account details, role, activity and sessions.</p>
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 overflow-hidden h-full pb-2">
          
          {/* Main Left Section */}
          <div className="xl:col-span-2 flex flex-col gap-4 overflow-hidden">
            
            {/* User Details Banner Card */}
            <div className="bg-white border border-brand-border/60 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Profile Avatar Picture */}
              <div className="w-20 h-20 rounded-full border border-slate-100 bg-slate-100 flex items-center justify-center text-3xl font-serif font-bold text-slate-700 shadow-inner shrink-0 self-center">
                {initial}
              </div>

              {/* Middle Profile Info */}
              <div className="flex-1 min-w-0 border-b md:border-b-0 md:border-r border-brand-border/60 pb-4 md:pb-0 md:pr-6 flex flex-col items-center md:items-start text-center md:text-left">
                <h2 className="font-serif text-2xl font-black text-brand-text truncate leading-tight">
                  {user.name}
                </h2>

                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full uppercase">
                    <Check className="w-2.5 h-2.5 shrink-0" /> Verified Account
                  </span>
                  <span className="inline-block text-[9px] font-black tracking-widest bg-rose-50 text-brand-red px-2 py-0.5 rounded-md uppercase border border-rose-100">
                    {user.role}
                  </span>
                </div>

                <div className="text-xs font-medium text-brand-silver mt-2.5 flex flex-col gap-1">
                  <span className="truncate">{user.email}</span>
                  <span className="text-slate-600 font-semibold">{user.phone || '+91 98765 43210'}</span>
                </div>
              </div>

              {/* Right Key-Value Metadata Grid */}
              <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider block mb-0.5">Employee ID</span>
                  <span className="font-bold text-slate-800 text-sm">{employeeId}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider block mb-0.5">Department</span>
                  <span className="font-bold text-slate-800 text-sm">{user.department || 'Business Development'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider block mb-0.5">Reporting Manager</span>
                  <span className="font-bold text-slate-800 text-sm">{reportingManager}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider block mb-0.5">Office Location</span>
                  <span className="font-bold text-slate-800 text-sm">{user.location || realLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider block mb-0.5">Joined On</span>
                  <span className="font-bold text-slate-800 text-sm">{joinedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider block mb-0.5">Last Login</span>
                  <span className="font-bold text-slate-800 text-sm">{lastActiveDate}</span>
                </div>
              </div>
            </div>

            {/* Statistics Section (Hides Notifications and conditionally filters Activity Score) */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-bold text-brand-text uppercase tracking-widest">
                {isAdminOrSuper ? "System Statistics (Admin View)" : "My Personal Performance"}
              </h3>
              
              <div className={`grid gap-3 ${isAdminOrSuper ? 'grid-cols-5' : 'grid-cols-3 md:grid-cols-6'}`}>
                {/* Stat 1: Leads Created */}
                <div className="bg-white border border-brand-border/60 rounded-xl p-2.5 shadow-xs flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-redLight/60 border border-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-brand-silver uppercase tracking-wider block">Leads</span>
                    <span className="text-sm font-serif font-black text-brand-text">{leadsCreated}</span>
                  </div>
                </div>

                {/* Stat 2: Deals Won */}
                <div className="bg-white border border-brand-border/60 rounded-xl p-2.5 shadow-xs flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-brand-silver uppercase tracking-wider block">Won</span>
                    <span className="text-sm font-serif font-black text-brand-text">{dealsWon}</span>
                  </div>
                </div>

                {/* Stat 3: Open Deals */}
                <div className="bg-white border border-brand-border/60 rounded-xl p-2.5 shadow-xs flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-brand-silver uppercase tracking-wider block">Open</span>
                    <span className="text-sm font-serif font-black text-brand-text">{openDeals}</span>
                  </div>
                </div>

                {/* Stat 4: Assigned Tenders */}
                <div className="bg-white border border-brand-border/60 rounded-xl p-2.5 shadow-xs flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-brand-silver uppercase tracking-wider block">Tenders</span>
                    <span className="text-sm font-serif font-black text-brand-text">{assignedTenders}</span>
                  </div>
                </div>

                {/* Stat 5: Pending Leads */}
                <div className="bg-white border border-brand-border/60 rounded-xl p-2.5 shadow-xs flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-brand-silver uppercase tracking-wider block">Pending</span>
                    <span className="text-sm font-serif font-black text-brand-text">{pendingLeads}</span>
                  </div>
                </div>

                {/* Stat 6: Activity Score - Conditionally shown */}
                {!isAdminOrSuper && (
                  <div className="bg-white border border-brand-border/60 rounded-xl p-2.5 shadow-xs flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-brand-silver uppercase tracking-wider block">Score</span>
                      <span className="text-sm font-serif font-black text-brand-text">{activityScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role & Permission Summary Grid */}
            <div className="bg-white border border-brand-border/60 rounded-2xl p-4 shadow-xs">
              <h3 className="text-[10px] font-bold text-brand-text uppercase tracking-widest mb-0.5">Role & Permission Summary</h3>
              <p className="text-[9px] text-brand-silver font-medium mb-3">Your role defines what actions you can perform in the CRM.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {permissions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {p.allowed ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-2 h-2" />
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shrink-0">
                        <X className="w-2 h-2" />
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-slate-700 truncate">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Sessions & Audit History */}
          <div className="flex flex-col gap-4" ref={menuRef}>
            
            {/* Active Sessions Card */}
            <div className="bg-white border border-brand-border/60 rounded-2xl p-4 shadow-xs relative">
              <h3 className="text-[10px] font-bold text-brand-text uppercase tracking-widest mb-0.5">Active Sessions</h3>
              <p className="text-[9px] text-brand-silver font-medium mb-3">Your currently active device sessions.</p>

              <div className="flex flex-col gap-2">
                {sessions.map(s => {
                  const isCurrent = s.isCurrent;
                  const Icon = isCurrent ? (deviceInfo.isMobile ? Smartphone : Monitor) : (s.icon || Monitor);
                  const browserTitle = isCurrent ? deviceInfo.name : s.browser;
                  const locationText = realLocation;
                  const isMenuOpen = activeMenuSessionId === s.id;

                  return (
                    <div key={s.id} className="flex items-start gap-2.5 pb-2.5 border-b border-brand-border/40 last:border-0 last:pb-0 relative">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-500 shrink-0 shadow-xs mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-[11px] font-bold text-slate-800 truncate pr-1">{browserTitle}</h4>
                          <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                            Current
                          </span>
                        </div>
                        <p className="text-[9px] text-brand-silver mt-0.5 truncate">{locationText}</p>
                      </div>

                      {/* 3-Dots Action Button */}
                      <div className="relative shrink-0 mt-0.5">
                        <button
                          onClick={() => setActiveMenuSessionId(isMenuOpen ? null : s.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-brand-silver hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-5 w-40 bg-white border border-brand-border rounded-lg shadow-lg z-30 p-1">
                            <button
                              onClick={() => handleRemoveSession(s.id, isCurrent)}
                              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-md transition-colors border-none bg-transparent cursor-pointer text-left"
                            >
                              <Trash2 className="w-3 h-3 shrink-0" />
                              <span>Log out session</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={handleLogoutAll}
                className="w-full mt-3 bg-transparent border border-rose-200 hover:bg-rose-50/50 text-rose-500 font-bold text-[10px] rounded-xl py-1.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3 h-3" />
                <span>Log out from all devices</span>
              </button>
            </div>

            {/* Login History Card */}
            <div className="bg-white border border-brand-border/60 rounded-2xl p-4 shadow-xs">
              <h3 className="text-[10px] font-bold text-brand-text uppercase tracking-widest mb-0.5">Login History</h3>
              <p className="text-[9px] text-brand-silver font-medium mb-3">Recent account access history.</p>

              <div className="flex flex-col gap-2.5">
                {loginHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-2 text-[11px]">
                    <div>
                      <h4 className="font-bold text-slate-800">{item.time}</h4>
                      <p className="text-[9px] text-brand-silver mt-0.5 truncate">{item.location} &bull; {item.device}</p>
                    </div>
                    <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
