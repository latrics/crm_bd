import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  AlertTriangle, 
  User, 
  Folder, 
  Check, 
  Trash2, 
  MoreVertical, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

import { useLocation } from 'react-router-dom';

// Pre-seeded fallback notification items to match the user's screenshot exactly
const initialNotifications = [
  {
    id: 'notif-1',
    title: 'Your deletion request for LTR-TND-000003 was Rejected',
    message: 'Your deletion request for Tender LTR-TND-000003, originally submitted by end-user Aditya Paul (Tender Executive), has been reviewed and rejected by head-user Snigdha Kundu (Administrator) due to missing supporting logs.',
    category: 'System',
    time: '5d ago',
    read: false,
    iconType: 'warning'
  },
  {
    id: 'notif-2',
    title: 'Lead updated: SECON Pvt. Ltd.',
    message: 'The lead info for SECON Pvt. Ltd., owned by end-user Aditya Paul (Sales Representative), has been updated with the latest activity details and reviewed by head-user Snigdha Kundu (Sales Head).',
    category: 'Leads',
    time: '6d ago',
    read: false,
    iconType: 'user'
  },
  {
    id: 'notif-3',
    title: 'Lead updated: Mythri Infrastructure and Mining India Private Limited',
    message: 'The lead profile for Mythri Infrastructure and Mining India Private Limited, managed by end-user Aditya Paul (Lead Owner), was updated with status change logs by head-user Snigdha Kundu (Sales Manager).',
    category: 'Leads',
    time: '6d ago',
    read: false,
    iconType: 'user'
  },
  {
    id: 'notif-4',
    title: 'Lead updated: Binani Industries Ltd. (Braj Binani Group)',
    message: 'The lead details for Binani Industries Ltd. (Braj Binani Group), assigned to end-user Aditya Paul (Account Manager), were successfully modified and verified by head-user Snigdha Kundu (Sales Admin).',
    category: 'Deals',
    time: '6d ago',
    read: false,
    iconType: 'user'
  },
  {
    id: 'notif-5',
    title: 'Tender LTR-TND-000015 status changed to "Submitted"',
    message: 'The bidding status of Tender LTR-TND-000015, prepared by end-user Snigdha Kundu (Bid Planner), has been changed to "Submitted" and finalized by head-user Aditya Paul (Operations Director).',
    category: 'Tenders',
    time: '1w ago',
    read: true,
    iconType: 'tender'
  }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('All');
  const [expandedNotifId, setExpandedNotifId] = useState(null);

  // Sync activeTab from location state (for navigation from sidebar)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const menuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Toggle single read status
  const handleToggleRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: !n.read } : n
    ));
    setActiveMenuId(null);
  };

  // Delete notification
  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setActiveMenuId(null);
  };

  // Filters notifications based on active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.read;
    return n.category.toLowerCase() === activeTab.toLowerCase();
  });

  // Pagination logic
  const totalItems = filteredNotifications.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Dynamic counts for tab badges
  const counts = {
    All: notifications.length,
    Unread: notifications.filter(n => !n.read).length,
    Leads: notifications.filter(n => n.category === 'Leads').length,
    Deals: notifications.filter(n => n.category === 'Deals').length,
    Tenders: notifications.filter(n => n.category === 'Tenders').length,
    System: notifications.filter(n => n.category === 'System').length
  };

  const tabs = ['All', 'Unread', 'Leads', 'Deals', 'Tenders', 'System'];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Tabs / Pills & Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/20 pb-4">
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            const count = counts[tab] || 0;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  isActive 
                    ? 'bg-brand-redLight border-brand-red/10 text-brand-red font-bold shadow-xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>{tab}</span>
                <span className={`min-w-[20px] h-5 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Check className="w-3.5 h-3.5 text-slate-600" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Notifications List Container */}
      <div className="bg-white border border-brand-border/60 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs" ref={menuRef}>
        {paginatedNotifications.length > 0 ? (
          paginatedNotifications.map((n) => {
            // Icon assignment based on category / type
            let Icon = User;
            let iconClass = 'bg-blue-50 border-blue-100 text-blue-500';
            if (n.iconType === 'warning') {
              Icon = AlertTriangle;
              iconClass = 'bg-rose-50 border-rose-100 text-rose-500';
            } else if (n.iconType === 'tender') {
              Icon = Folder;
              iconClass = 'bg-emerald-50 border-emerald-100 text-emerald-500';
            }

            const isExpanded = expandedNotifId === n.id;
            const isMenuOpen = activeMenuId === n.id;

            return (
              <div 
                key={n.id} 
                className="p-3.5 flex flex-col gap-2 transition-all duration-150 hover:bg-slate-50/50 relative cursor-pointer"
                onClick={() => {
                  setExpandedNotifId(isExpanded ? null : n.id);
                  if (!n.read) {
                    setNotifications(prev => prev.map(item => 
                      item.id === n.id ? { ...item, read: true } : item
                    ));
                  }
                }}
                onMouseLeave={() => setExpandedNotifId(null)}
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconClass}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 leading-snug flex items-center gap-1.5 flex-wrap">
                        <span>{n.title}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-brand-red rounded-full inline-block shrink-0" title="Unread" />
                        )}
                      </h4>
                      <span className="text-[10px] text-brand-silver font-semibold mt-0.5 block">
                        {n.time}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: 3-Dots actions menu */}
                  <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Context menu for delete/read toggle */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : n.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-brand-silver hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-6 w-44 bg-white border border-brand-border rounded-xl shadow-lg z-30 p-1">
                          <button
                            onClick={() => handleToggleRead(n.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>{n.read ? 'Mark as unread' : 'Mark as read'}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                            <span>Delete notification</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown detailed message */}
                <div 
                  className="grid transition-all duration-200 ease-in-out overflow-hidden"
                  style={{
                    gridTemplateRows: isExpanded ? '1fr' : '0fr',
                    opacity: isExpanded ? 1 : 0,
                    marginTop: isExpanded ? '4px' : '0px'
                  }}
                >
                  <div className="overflow-hidden pl-13 pr-4">
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <Folder className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No notifications found</h3>
            <p className="text-xs text-brand-silver mt-1">There are no activities matching this filter.</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-brand-border/40 pt-4 text-xs text-slate-500">
          
          {/* Rows Per Page */}
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <div className="relative inline-block">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-red/50 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Range Info */}
          <div className="font-semibold">
            Showing {startIndex + 1} to {endIndex} of {totalItems}
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-slate-200 bg-white text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-slate-200 bg-white text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
