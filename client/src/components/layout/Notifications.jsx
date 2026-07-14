import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCRM from '../../hooks/useCRM.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Badge from '../common/Badge.jsx';
import DocsPanel from '../docs/DocsPanel.jsx';
import Modal from '../common/Modal.jsx';
import Field from '../common/Field.jsx';
import UserMenu from './UserMenu.jsx';
import BANTSection from '../leads/BANTSection.jsx';
import { LEAD_STAGES, SOURCES, FLAT_SOURCES, OWNERS, SECTORS, STG_COLORS } from '../../constants/index.js';
import { updateLead, deleteLead } from '../../api/leadsApi.js';
import { getNotifications, markNotificationAsRead } from '../../api/notificationsApi.js';
import useToast from '../../hooks/useToast.js';



const formatTimeLeft = (deadlineString) => {
  if (!deadlineString) return '';
  const diffMs = new Date(deadlineString) - new Date();
  if (diffMs <= 0) return 'Overdue';
  const diffHours = Math.round(diffMs / 3600000);
  if (diffHours < 24) {
    if (diffHours <= 0) return 'Due now';
    return `${diffHours}h left`;
  }
  const diffDays = Math.round(diffMs / 86400000);
  return `${diffDays} days left`;
};

const formatNotificationTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - new Date(date);
  if (diffMs < 0) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showBanner, setShowBanner] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [apiNotifications, setApiNotifications] = useState([]);
  
  // Local Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [highlightedLeadId, setHighlightedLeadId] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState('');
  
  const { state, dispatch } = useCRM();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Initialize selectedOwner on load or change
  useEffect(() => {
    if (user) {
      if (isAdminOrSuperAdmin && OWNERS && OWNERS.length > 0) {
        setSelectedOwner(OWNERS[0]);
      } else {
        setSelectedOwner(user.name);
      }
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      if (user?.name) {
        await markNotificationAsRead(id, user.name);
        setApiNotifications(prev => prev.map(n => 
          n._id === id 
            ? { ...n, readBy: [...(n.readBy || []), user.name] } 
            : n
        ));
      }
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await getNotifications(user?.role, user?.name);
        if (res.success) {
          setApiNotifications(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    if (user) {
      fetchNotifs();
    }
  }, [user, isOpen, state.leads]);

  // Case-insensitive name comparison helper to match different formats (e.g. snigdha.kundu vs Snigdha Kundu)
  const isMatch = (owner, userName) => {
    if (!owner || !userName) return false;
    const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(owner) === clean(userName);
  };

  // Helper to format owner names in short form (e.g. Snigdha Kundu -> Snigdha K.)
  const getShortName = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      if (lastName.length === 1) return `${firstName} ${lastName}`;
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    return name;
  };

  // Calculate owner workload statistics (Admins / Super Admins only)
  const ownerStats = {};
  if (isAdminOrSuperAdmin && state.leads && OWNERS) {
    OWNERS.forEach(owner => {
      const ownerLeads = state.leads.filter(l => isMatch(l.owner, owner)) || [];
      const pending = ownerLeads.filter(l => l.status === 'Leads').length;
      const urgent = ownerLeads.filter(l => {
        if (l.status === 'Closure' || l.status === 'Converted') return false;
        if (!l.deadline) return false;
        const timeLeft = new Date(l.deadline) - new Date();
        return timeLeft <= 7 * 24 * 60 * 60 * 1000;
      }).length;

      ownerStats[owner] = {
        assigned: ownerLeads.length,
        pending,
        urgent
      };
    });
  }

  // Filter lists based on ownership
  const targetOwnerName = isAdminOrSuperAdmin ? selectedOwner : user?.name;
  const assignedLeads = state.leads?.filter(l => isMatch(l.owner, targetOwnerName)) || [];
  
  // Yet to contact: status is 'Leads'
  const yetToContactLeads = assignedLeads.filter(l => l.status === 'Leads');
  
  // Contacted: status is Communicated, Discussion, Pricing / Quote, or Demo
  const contactedLeads = assignedLeads.filter(l => 
    ['Communicated', 'Discussion', 'Pricing / Quote', 'Demo'].includes(l.status)
  );
  
  // Urgent leads: deadline within 7 days (or overdue) and not closed/converted
  const urgentLeads = assignedLeads.filter(l => {
    if (l.status === 'Closure' || l.status === 'Converted') return false;
    if (!l.deadline) return false;
    const timeLeft = new Date(l.deadline) - new Date();
    return timeLeft < 7 * 24 * 60 * 60 * 1000;
  });

  // Action Item - Urgent Leads:
  // For Admins/Superadmins: all urgent leads in state.leads
  // For normal users: only assigned urgent leads
  const actionUrgentLeads = isAdminOrSuperAdmin
    ? (state.leads?.filter(l => {
        if (l.status === 'Closure' || l.status === 'Converted') return false;
        if (!l.deadline) return false;
        const timeLeft = new Date(l.deadline) - new Date();
        return timeLeft < 7 * 24 * 60 * 60 * 1000;
      }) || [])
    : urgentLeads;

  // Action Item - Uncontacted Overdue Leads:
  // For Admins/Superadmins: all leads with status 'Leads' (Yet to Contact) where deadline is in the past
  // For normal users: only assigned leads with status 'Leads' where deadline is in the past
  const actionOverdueContactLeads = isAdminOrSuperAdmin
    ? (state.leads?.filter(l => {
        if (l.status !== 'Leads') return false;
        if (!l.deadline) return false;
        return new Date(l.deadline) - new Date() <= 0;
      }) || [])
    : assignedLeads.filter(l => l.status === 'Leads' && l.deadline && new Date(l.deadline) - new Date() <= 0);

  // Detailed Action Cards for Admins/Superadmins mapping overdue and uncontacted leads
  const adminActionCards = isAdminOrSuperAdmin
    ? (state.leads?.filter(l => {
        if (l.status !== 'Leads') return false;
        if (!l.deadline) return false;
        const timeLeft = new Date(l.deadline) - new Date();
        return timeLeft <= 0;
      }) || []).map(l => {
        const ownerName = l.owner ? getShortName(l.owner) : 'Unassigned';
        return {
          id: l._id,
          title: 'Overdue Contact',
          message: `${ownerName} failed to contact ${l.company} in time.`,
          leadDbId: l._id,
          owner: l.owner,
          icon: '⏳',
          colorBg: 'bg-amber-50 text-amber-600 border border-amber-100/50'
        };
      })
    : [];

  // Map DB notifications to UI format
  const allNotifications = apiNotifications.map(n => {
    let icon = '🔔';
    let color = 'text-blue-500 bg-blue-50';
    if (n.type === 'urgent' || n.type === 'warning') { icon = '⚠️'; color = 'text-red-500 bg-red-50 border-l-4 border-red-500'; }
    else if (n.type === 'info' || n.type === 'assignment') { icon = '👤'; color = 'text-blue-500 bg-blue-50'; }
    else if (n.type === 'success') { icon = '✅'; color = 'text-green-500 bg-green-50'; }

    return {
      id: n._id,
      leadDbId: n.relatedId,
      type: n.type,
      message: n.message,
      time: formatNotificationTime(n.createdAt),
      timestamp: new Date(n.createdAt).getTime(),
      icon,
      color,
      isRead: (n.readBy && user?.name) ? n.readBy.includes(user.name) : n.isRead
    };
  });

  // Calculate unread notifications count
  const unreadNotifications = allNotifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('notifications-unread-count', { detail: unreadCount }));
  }, [unreadCount]);

  // Get banner content to display conditionally
  const getBannerContent = () => {
    if (isAdminOrSuperAdmin) {
      if (!OWNERS || !state.leads) return null;
      const ownersWithUrgent = [];
      OWNERS.forEach(owner => {
        const ownerLeads = state.leads.filter(l => isMatch(l.owner, owner)) || [];
        const hasUrgent = ownerLeads.some(l => {
          if (l.status === 'Closure' || l.status === 'Converted') return false;
          if (!l.deadline) return false;
          const timeLeft = new Date(l.deadline) - new Date();
          return timeLeft <= 24 * 60 * 60 * 1000;
        });
        if (hasUrgent) {
          ownersWithUrgent.push(getShortName(owner));
        }
      });

      if (ownersWithUrgent.length === 0) return null;
      const listText = ownersWithUrgent.length === 1 
        ? `${ownersWithUrgent[0]} has` 
        : `${ownersWithUrgent.join(' & ')} have`;
      return {
        title: 'ALERT NOTIFICATION',
        message: `${listText} pending leads with deadlines less than 24 hours.`
      };
    } else {
      const hasLess24hDeadline = urgentLeads.some(l => {
        if (!l.deadline) return false;
        const timeLeft = new Date(l.deadline) - new Date();
        return timeLeft <= 24 * 60 * 60 * 1000;
      });
      if (!hasLess24hDeadline) return null;
      return {
        title: 'REMINDER',
        message: 'Please update the statuses of your pending leads for this week.'
      };
    }
  };

  const bannerContent = getBannerContent();

  // Get active items (leads or notifications) based on filter selection
  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'assigned': return assignedLeads;
      case 'pending': return yetToContactLeads;
      case 'contacted': return contactedLeads;
      case 'urgent': return urgentLeads;
      default: return allNotifications;
    }
  };

  const filteredItems = getFilteredItems();
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleOpenFullscreen = () => {
      setActiveFilter('all');
      setIsExpanded(true);
      setIsOpen(false);
    };

    window.addEventListener('toggle-notifications', handleToggle);
    window.addEventListener('open-notifications', handleOpen);
    window.addEventListener('close-notifications', handleClose);
    window.addEventListener('open-notifications-fullscreen', handleOpenFullscreen);

    return () => {
      window.removeEventListener('toggle-notifications', handleToggle);
      window.removeEventListener('open-notifications', handleOpen);
      window.removeEventListener('close-notifications', handleClose);
      window.removeEventListener('open-notifications-fullscreen', handleOpenFullscreen);
    };
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, rowsPerPage]);

  // Disable body scroll when expanded to prevent double/clumsy scrollbars
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  // Scroll to highlighted lead card inside notifications page list
  useEffect(() => {
    if (highlightedLeadId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`lead-card-${highlightedLeadId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const clearTimer = setTimeout(() => {
        setHighlightedLeadId(null);
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedLeadId]);

  const openFullscreen = (filter) => {
    setActiveFilter(filter);
    setIsExpanded(true);
    setIsOpen(false);
  };

  const closeFullscreen = () => {
    setIsExpanded(false);
  };

  // Notification Row Click Handler
  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setActiveFilter('assigned');
    if (n.leadDbId) {
      const index = assignedLeads.findIndex(l => l._id === n.leadDbId);
      if (index !== -1) {
        const targetPage = Math.floor(index / rowsPerPage) + 1;
        setCurrentPage(targetPage);
      }
      setHighlightedLeadId(n.leadDbId);
    }
  };

  // Lead Card Actions
  const toggleDocs = (id) => {
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Edit action now opens local modal inside notifications, keeping the user in notifications page
  const handleLeadEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({ ...lead });
    setErrors({});
    setModalOpen(true);
  };

  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company?.trim()) newErrors.company = 'Company is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let finalData = { ...formData };


      const res = await updateLead(selectedLead._id, finalData);
      if (res.success) {
        dispatch({ type: 'UPDATE_LEAD', payload: res.data });
        addToast({ type: 'success', message: 'Lead updated successfully' });
        setModalOpen(false);
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'An error occurred' });
    }
  };

  const handleStageUpdate = async (lead, stage) => {
    try {
      const res = await updateLead(lead._id, { status: stage });
      if (res.success) {
        dispatch({ type: 'UPDATE_LEAD', payload: res.data });
        addToast({ type: 'success', message: 'Lead stage updated successfully' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Error updating stage' });
    }
  };

  const handleLeadDelete = async (lead) => {
    if (window.confirm(`Are you sure you want to delete lead for ${lead.company}?`)) {
      try {
        const res = await deleteLead(lead._id);
        if (res.success) {
          dispatch({ type: 'DELETE_LEAD', payload: lead._id });
          addToast({ type: 'success', message: 'Lead deleted successfully' });
        }
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Error deleting lead' });
      }
    }
  };

  // Lead Card Renderer similar to LeadsView.jsx (matching the sketch/image provided)
  const renderLeadCard = (lead) => {
    if (!lead) return null;
    const stgColor = STG_COLORS[lead.status] || '#8A8D8F';
    const currentStageIdx = LEAD_STAGES.indexOf(lead.status);
    const nextStage = currentStageIdx < LEAD_STAGES.length - 1 ? LEAD_STAGES[currentStageIdx + 1] : null;

    const formatDate = (dateString) => {
      if (!dateString) return '--';
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isHighlighted = lead._id === highlightedLeadId;

    return (
      <div 
        key={lead._id} 
        id={`lead-card-${lead._id}`}
        className={`bg-white border rounded-crm shadow-sm relative overflow-hidden my-3 mx-3 first:mt-0 ${
          isHighlighted 
            ? 'ring-2 ring-brand-red border-brand-red shadow-[0_0_15px_rgba(218,41,28,0.3)] scale-[1.01] transition-all duration-300 z-10' 
            : 'border-brand-border'
        }`}
      >
        {lead.status === 'Closure' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-redLight border-b border-brand-red/20" />
        )}
        
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm bg-brand-surfaceAlt text-brand-text border border-brand-border select-none">
                {(lead.decisionMaker || 'U').charAt(0)}{(lead.company || 'C').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-sm font-bold text-brand-text leading-tight flex items-center gap-2">
                  <span className="truncate">{lead.decisionMaker || 'Unnamed Lead'}</span>
                  {lead.leadId && <span className="bg-brand-surfaceAlt border border-brand-border text-brand-text px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ml-1">#{lead.leadId}</span>}
                </h4>
                <p className="text-xs text-brand-silver font-bold tracking-wider mt-0.5 truncate">{lead.company}</p>
                <div className="text-[9px] text-brand-silver mt-1 flex items-center gap-2 flex-wrap">
                  <span>Added: {formatDate(lead.createdAt)}</span>
                  {lead.deadline && lead.status === 'Leads' && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        new Date(lead.deadline) - new Date() <= 24 * 60 * 60 * 1000
                          ? 'bg-brand-redLight text-brand-red animate-pulse'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        ⏰ {formatTimeLeft(lead.deadline)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {lead.owner && (
                <div className="flex items-center gap-1.5">
                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brand-redLight select-none">
                      <span className="text-brand-red">{lead.owner.charAt(0)}</span>
                   </div>
                   <span className="text-xs text-brand-silver font-bold">{getShortName(lead.owner)}</span>
                </div>
              )}
              
              <div className="flex gap-1.5 ml-2">
                <button 
                  onClick={() => toggleDocs(lead._id)}
                  className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${expandedDocs[lead._id] ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt border border-brand-border text-brand-text hover:bg-brand-border'}`}
                >
                  Docs
                </button>
                <button 
                  onClick={() => handleLeadEdit(lead)}
                  className="px-3 py-1 bg-brand-surfaceAlt border border-brand-border text-brand-silver rounded text-[11px] font-bold hover:bg-brand-border transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleLeadDelete(lead)}
                  className="px-3 py-1 bg-brand-surfaceAlt border border-brand-border text-brand-red rounded text-[11px] font-bold hover:bg-red-50 transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-3">
             <div className="flex-1 mr-4">
                <div className="flex gap-1 h-1 rounded-full overflow-hidden w-full">
                  {LEAD_STAGES.map((stage, idx) => (
                    <div 
                      key={stage}
                      onClick={(e) => { e.stopPropagation(); handleStageUpdate(lead, stage); }}
                      className="h-full rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                      title={`Move to ${stage}`}
                      style={{
                        flex: 1,
                        backgroundColor: idx <= currentStageIdx ? '#8A8D8F' : '#f3f4f6', 
                      }}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-brand-silver mt-1.5 tracking-widest">
                   Stage: <span className="text-brand-text font-black">{lead.status}</span>
                </div>
             </div>
             
             {nextStage && (
               <button
                 onClick={() => handleStageUpdate(lead, nextStage)}
                 className="px-3 py-1 bg-brand-surfaceAlt border border-brand-border text-brand-text rounded text-[11px] font-bold hover:bg-brand-border transition-colors whitespace-nowrap"
               >
                 Move to {nextStage}
               </button>
             )}
          </div>
        </div>

        {expandedDocs[lead._id] && (
          <div className="border-t border-brand-border p-4 bg-brand-surfaceAlt/30">
            <DocsPanel entityId={lead._id} entityType="lead" />
          </div>
        )}
      </div>
    );
  };

  // Full Screen expanded page layout matching the sketch
  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-brand-bg z-[9999] overflow-auto flex flex-col font-sans">
        {/* Top Header */}
        <header className="border-b border-brand-border bg-white h-16 shrink-0 sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-6 h-full flex justify-between items-center">
            {/* Left Brand and Breadcrumb (Click logo to reload page) */}
            <div className="flex items-center gap-6">
              <div 
                onClick={() => window.location.reload()}
                className="font-serif text-xl font-black text-brand-red tracking-wide flex items-center border-r-2 border-brand-red pr-6 h-8 cursor-pointer select-none"
              >
                LATRICS <span className="font-sans text-[10px] font-bold text-brand-silver tracking-normal ml-2">CRM</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-silver uppercase tracking-wider">
                <span onClick={closeFullscreen} className="cursor-pointer hover:text-brand-text transition-colors">CRM</span>
                <span className="text-gray-300">/</span>
                <span className="text-brand-text">notification</span>
              </div>
            </div>
            
            {/* Right Profile & Back button */}
            <div className="flex items-center gap-4">
              <button 
                onClick={closeFullscreen}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-brand-border text-brand-silver text-xs font-bold hover:bg-brand-surfaceAlt hover:text-brand-text transition-all shadow-sm cursor-pointer"
              >
                Back to CRM
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 flex flex-col gap-6">
          {/* Changed layout grid from 3-6-3 to 2-7-3 as requested (smaller left column, original size right column) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Columns (width: 2/12) */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {/* All Notifications Button with Count Badge */}
              <button
                onClick={() => setActiveFilter('all')}
                className={`w-full border rounded-crm p-3 flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm ${
                  activeFilter === 'all' 
                    ? 'bg-brand-charcoal text-white border-brand-charcoal' 
                    : 'bg-white border-brand-border text-brand-text hover:border-brand-silver'
                }`}
              >
                <span>All Notifications</span>
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeFilter === 'all' ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt text-brand-silver'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Card 1: Assigned Leads */}
              {isAdminOrSuperAdmin ? (
                <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1 sleek-scrollbar">
                  <div className="text-[10px] text-brand-silver uppercase tracking-widest font-black mb-1 ml-1">Select Owner</div>
                  {OWNERS.map(owner => (
                    <button
                      key={owner}
                      onClick={() => {
                        setSelectedOwner(owner);
                        setActiveFilter('assigned');
                      }}
                      className={`w-full border rounded-crm p-3 flex flex-col gap-2 text-left transition-all ${
                        selectedOwner === owner 
                          ? 'border-brand-red ring-2 ring-brand-red/10 bg-brand-redLight/10' 
                          : 'border-brand-border bg-white hover:border-brand-silver'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-surfaceAlt flex items-center justify-center font-bold text-[10px] border border-brand-border text-brand-text shrink-0">
                          {owner.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black text-brand-text truncate">{getShortName(owner)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[8px] font-bold text-center">
                        <div className="bg-blue-50 text-blue-600 py-0.5 rounded" title="Assigned">
                          A:{ownerStats[owner]?.assigned || 0}
                        </div>
                        <div className="bg-amber-50 text-amber-600 py-0.5 rounded" title="Pending">
                          P:{ownerStats[owner]?.pending || 0}
                        </div>
                        <div className="bg-red-50 text-brand-red py-0.5 rounded" title="Urgent">
                          U:{ownerStats[owner]?.urgent || 0}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setActiveFilter('assigned')}
                    className={`bg-white border rounded-crm p-3.5 shadow-sm text-center cursor-pointer transition-all hover:shadow-md ${
                      activeFilter === 'assigned' ? 'border-brand-red ring-2 ring-brand-red/10' : 'border-brand-border'
                    }`}
                  >
                    <div className="font-serif text-2xl font-black text-brand-charcoal mb-1">
                      {assignedLeads.length}
                    </div>
                    <div className="text-[9px] font-bold text-brand-silver uppercase tracking-wider">Assigned Leads</div>
                  </div>

                  {/* Card 2: Yet to Contact */}
                  <div 
                    onClick={() => setActiveFilter('pending')}
                    className={`bg-white border rounded-crm p-3.5 shadow-sm text-center cursor-pointer transition-all hover:shadow-md ${
                      activeFilter === 'pending' ? 'border-brand-red ring-2 ring-brand-red/10' : 'border-brand-border'
                    }`}
                  >
                    <div className="font-serif text-2xl font-black text-brand-blue mb-1">
                      {yetToContactLeads.length}
                    </div>
                    <div className="text-[9px] font-bold text-brand-silver uppercase tracking-wider">Yet to contact</div>
                  </div>

                  {/* Card 3: Contacted */}
                  <div 
                    onClick={() => setActiveFilter('contacted')}
                    className={`bg-white border rounded-crm p-3.5 shadow-sm text-center cursor-pointer transition-all hover:shadow-md ${
                      activeFilter === 'contacted' ? 'border-brand-red ring-2 ring-brand-red/10' : 'border-brand-border'
                    }`}
                  >
                    <div className="font-serif text-2xl font-black text-brand-charcoal mb-1">
                      {contactedLeads.length}
                    </div>
                    <div className="text-[9px] font-bold text-brand-silver uppercase tracking-wider">Contacted</div>
                  </div>

                  {/* Card 4: Urgent This Week */}
                  <div 
                    onClick={() => setActiveFilter('urgent')}
                    className={`bg-white border rounded-crm p-3.5 shadow-sm text-center cursor-pointer transition-all hover:shadow-md relative ${
                      activeFilter === 'urgent' ? 'border-brand-red ring-2 ring-brand-red/10' : 'border-brand-border'
                    }`}
                  >
                    {urgentLeads.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-red rounded-full border-2 border-white shadow-md animate-pulse z-10" />
                    )}
                    <div className="font-serif text-2xl font-black text-brand-red mb-1">
                      {urgentLeads.length}
                    </div>
                    <div className="text-[9px] font-bold text-brand-silver uppercase tracking-wider">Urgent this week</div>
                  </div>
                </>
              )}
            </div>

            {/* Center Column - Notifications / Leads List (width: 7/12) */}
            <div className="lg:col-span-7 bg-white border border-brand-border rounded-crm p-6 shadow-sm flex flex-col h-[480px]">
              <div className="border-b border-brand-border pb-4 mb-4 shrink-0">
                <h2 className="font-serif text-xl font-black text-brand-text capitalize">
                  {activeFilter === 'all' ? 'All Notifications' : activeFilter === 'assigned' ? 'Assigned Leads' : activeFilter === 'pending' ? 'Yet to contact' : activeFilter === 'contacted' ? 'Contacted' : 'Urgent this week'}
                </h2>
                {isAdminOrSuperAdmin && (
                  <div className="flex gap-1.5 mt-3 overflow-x-auto sleek-scrollbar pb-1">
                    {[
                      { key: 'all', label: `All Alerts (${unreadCount})` },
                      { key: 'assigned', label: `Assigned (${assignedLeads.length})` },
                      { key: 'pending', label: `Pending (${yetToContactLeads.length})` },
                      { key: 'contacted', label: `Contacted (${contactedLeads.length})` },
                      { key: 'urgent', label: `Urgent (${urgentLeads.length})` }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                          activeFilter === tab.key
                            ? 'bg-brand-charcoal text-white border-brand-charcoal'
                            : 'bg-brand-surfaceAlt text-brand-text border-brand-border hover:border-brand-silver'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 divide-y divide-brand-border sleek-scrollbar">
                {paginatedItems.length > 0 ? (
                  activeFilter === 'all' ? (
                    paginatedItems.map((n) => {
                      const isUnread = !n.isRead;
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`py-4 flex gap-4 items-start hover:bg-brand-surfaceAlt/30 px-3 rounded-xl transition-colors cursor-pointer border-b border-brand-border/40 last:border-b-0 relative group`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${n.color}`}>
                            {n.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed flex items-center gap-2 ${isUnread ? 'font-black text-brand-text' : 'font-bold text-brand-silver'}`}>
                              <span className="truncate">{n.message}</span>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" title="Unread"></span>
                              )}
                            </p>
                            <span className="text-[9px] text-brand-silver mt-1 block font-bold">{n.time}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    paginatedItems.map((lead) => renderLeadCard(lead))
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-brand-silver">
                    <div className="text-3xl mb-2">✨</div>
                    <p className="text-xs font-bold uppercase tracking-wider">No records found</p>
                    <p className="text-[10px] mt-1">Everything is caught up!</p>
                  </div>
                )}
              </div>

              {/* Pagination Section */}
              {totalItems > 0 && (
                <div className="border-t border-brand-border pt-4 mt-6 flex justify-between items-center text-xs text-brand-silver font-bold shrink-0">
                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select 
                      value={rowsPerPage} 
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="border border-brand-border rounded px-2 py-1 text-xs text-brand-text cursor-pointer focus:outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>

                  {/* Range and counts */}
                  <div>
                    Showing {Math.min(totalItems, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(totalItems, currentPage * rowsPerPage)} of {totalItems}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-brand-border rounded hover:border-brand-silver disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-brand-border rounded hover:border-brand-silver disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Assigned Member Details (width: 3/12) */}
            <div className="lg:col-span-3 bg-white border border-brand-border rounded-crm p-6 shadow-sm flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-brand-silver uppercase tracking-widest mb-6">Assigned Member</span>
              
              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-full bg-brand-redLight border border-brand-red/20 text-brand-red flex items-center justify-center font-serif text-3xl font-black mb-4 shadow-sm select-none">
                {(user?.name || 'A').substring(0, 1).toUpperCase()}
              </div>

              {/* Info */}
              <h3 className="font-serif text-lg font-black text-brand-text mb-1">{user?.name || 'Anonymous User'}</h3>
              <p className="text-xs text-brand-silver">{user?.email || 'no-email@latrics.com'}</p>
              <span className="text-[9px] font-bold text-brand-silver uppercase tracking-wider bg-brand-surfaceAlt px-2 py-0.5 rounded-full mt-2">
                {user?.role || 'User'}
              </span>

              {/* Status and Last Active */}
              <div className="w-full border-t border-brand-border my-6 pt-4 flex flex-col gap-2.5 text-xs text-left">
                <div className="flex justify-between items-center">
                  <span className="text-brand-silver font-semibold">Status</span>
                  <span className="flex items-center text-green-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-silver font-semibold">Last active</span>
                  <span className="text-brand-text font-bold">Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full flex flex-col gap-2">
                <button 
                  onClick={() => { setIsExpanded(false); navigate('/profile'); }}
                  className="w-full bg-brand-surfaceAlt border border-brand-border hover:bg-brand-lightGrey text-brand-text text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  View profile
                </button>
                <button className="w-full bg-brand-surfaceAlt border border-brand-border hover:bg-brand-lightGrey text-brand-text text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer">
                  View activity
                </button>
                <button 
                  onClick={() => { setIsExpanded(false); navigate('/profile'); }}
                  className="w-full bg-brand-surfaceAlt border border-brand-border hover:bg-brand-lightGrey text-brand-text text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Panel - Stats */}
          <div className="bg-white border border-brand-border rounded-crm p-6 shadow-sm">
            <h3 className="text-xs font-bold text-brand-silver uppercase tracking-widest mb-4">Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Stat 1 */}
              <div className="bg-brand-surfaceAlt/40 rounded-xl p-4 border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">Total Leads</span>
                <div className="font-serif text-2xl font-black text-brand-charcoal mt-1">
                  {state.leads?.length || 0}
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-brand-surfaceAlt/40 rounded-xl p-4 border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">Pending Tasks</span>
                <div className="font-serif text-2xl font-black text-brand-blue mt-1">
                  {yetToContactLeads.length}
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-brand-surfaceAlt/40 rounded-xl p-4 border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">Urgent Alerts</span>
                <div className="font-serif text-2xl font-black text-brand-red mt-1">
                  {urgentLeads.length}
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-brand-surfaceAlt/40 rounded-xl p-4 border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">Lead converted to deals</span>
                <div className="font-serif text-2xl font-black text-green-600 mt-1">
                  {state.leads?.filter(l => l.status === 'Converted').length || 0}
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* Local Edit Lead Modal inside Notifications Page Overlay */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif font-bold text-brand-text">Edit Lead</h2>
          </div>

          <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Decision Maker" value={formData.decisionMaker} onChange={e => handleFormChange('decisionMaker', e.target.value)} error={errors.decisionMaker} />
              <Field label="Title / Designation" value={formData.designation} onChange={e => handleFormChange('designation', e.target.value)} />
              <Field label="Company" value={formData.company} onChange={e => handleFormChange('company', e.target.value)} error={errors.company} required />
              <Field label="Email" value={formData.email} onChange={e => handleFormChange('email', e.target.value)} error={errors.email} required />
              <Field label="Phone" value={formData.phone} onChange={e => handleFormChange('phone', e.target.value)} />
              <Field label="City" value={formData.city} onChange={e => handleFormChange('city', e.target.value)} />
              <Field label="State" value={formData.state} onChange={e => handleFormChange('state', e.target.value)} />
              <Field label="Value (Rs.)" type="number" value={formData.value} onChange={e => handleFormChange('value', e.target.value)} />
              <Field label="Status" type="select" options={LEAD_STAGES} value={formData.status} onChange={e => handleFormChange('status', e.target.value)} />
              <div className="flex flex-col gap-2">
                <Field label="Lead Source" type="select" options={SOURCES} value={FLAT_SOURCES.includes(formData.outbound) || !formData.outbound ? formData.outbound : 'Others'} onChange={e => handleFormChange('outbound', e.target.value)} />
                {(formData.outbound === 'Others' || (formData.outbound && !FLAT_SOURCES.includes(formData.outbound))) && (
                  <Field label="Custom Source" value={formData.outbound === 'Others' ? '' : formData.outbound} onChange={e => handleFormChange('outbound', e.target.value)} placeholder="Type custom source..." />
                )}
              </div>
              <Field label="Owner" type="select" options={OWNERS} value={formData.owner} onChange={e => handleFormChange('owner', e.target.value)} />
              <Field label="Industry" type="select" options={SECTORS} value={formData.industry} onChange={e => handleFormChange('industry', e.target.value)} />
              <div className="flex flex-col gap-1">
                <Field 
                  label="Deadline" 
                  type="date" 
                  value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''} 
                  onChange={e => handleFormChange('deadline', e.target.value)} 
                />
                {formData.deadline && (
                  <span className="text-[9px] font-bold text-brand-silver ml-1">
                    Current: {new Date(formData.deadline).toLocaleDateString()} ({formatTimeLeft(formData.deadline)})
                  </span>
                )}
              </div>
            </div>
            <Field label="Remarks" type="textarea" value={formData.remarks} onChange={e => handleFormChange('remarks', e.target.value)} />

            <BANTSection lead={formData} onChange={handleFormChange} />

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="bg-brand-surfaceAlt border border-brand-border text-brand-silver text-sm rounded-xl px-4 py-2">Cancel</button>
              <button type="submit" className="bg-brand-red text-white font-bold text-sm rounded-xl px-5 py-2 hover:bg-red-700 transition-colors">Save Lead</button>
            </div>
          </form>
        </Modal>

      </div>
    );
  }

  // Sidebar Drawer View
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-[9998] transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 right-0 w-96 max-w-full bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-brand-border bg-brand-surfaceAlt/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="font-serif font-black text-brand-text text-lg tracking-wide">Your Stats & Alerts</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-brand-silver hover:text-brand-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 sleek-scrollbar">
          {/* Banner */}
          {showBanner && bannerContent && (
            <div className="bg-brand-surfaceAlt border border-brand-border rounded-xl p-3 mb-6 flex justify-between items-start relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red"></div>
              <div>
                <p className="text-[10px] font-bold text-brand-silver uppercase tracking-widest mb-1">{bannerContent.title}</p>
                <p className="text-xs text-brand-text font-bold leading-normal">{bannerContent.message}</p>
              </div>
              <button onClick={() => setShowBanner(false)} className="text-brand-silver hover:text-brand-text">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          )}

          {/* Overdue Notification Banner */}
          {!isAdminOrSuperAdmin && (() => {
            const overdueCount = assignedLeads.filter(l => {
              if (l.status !== 'Leads') return false;
              if (!l.deadline) return false;
              const timeLeft = new Date(l.deadline) - new Date();
              return timeLeft <= 0;
            }).length;

            return overdueCount > 0 ? (
              <div className="bg-red-50 border border-brand-red/20 rounded-xl p-3.5 mb-5 flex justify-between items-start relative overflow-hidden shadow-sm animate-pulse">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-red"></div>
                <div className="flex gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-[10px] font-extrabold text-brand-red uppercase tracking-widest mb-0.5">Overdue Action Required</p>
                    <p className="text-xs text-brand-text font-bold leading-normal">
                      You have <span className="text-brand-red">{overdueCount} overdue {overdueCount === 1 ? 'lead' : 'leads'}</span> that missed their deadline. Please update their status.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => openFullscreen('urgent')} 
                  className="text-[10px] font-bold text-brand-red hover:underline shrink-0 ml-2 mt-0.5 cursor-pointer"
                >
                  View Leads
                </button>
              </div>
            ) : null;
          })()}

          {isAdminOrSuperAdmin && (() => {
            const totalOverdue = (state.leads?.filter(l => {
              if (l.status !== 'Leads') return false;
              if (!l.deadline) return false;
              const timeLeft = new Date(l.deadline) - new Date();
              return timeLeft <= 0;
            }) || []).length;

            return totalOverdue > 0 ? (
              <div className="bg-red-50 border border-brand-red/20 rounded-xl p-3.5 mb-5 flex justify-between items-start relative overflow-hidden shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-red"></div>
                <div className="flex gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-[10px] font-extrabold text-brand-red uppercase tracking-widest mb-0.5">Overdue Action Required</p>
                    <p className="text-xs text-brand-text font-bold leading-normal">
                      There are <span className="text-brand-red">{totalOverdue} overdue {totalOverdue === 1 ? 'lead' : 'leads'}</span> across the team.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => openFullscreen('assigned')} 
                  className="text-[10px] font-bold text-brand-red hover:underline shrink-0 ml-2 mt-0.5 cursor-pointer"
                >
                  View Workload
                </button>
              </div>
            ) : null;
          })()}

          <div className="text-center mb-6">
            <h3 className="font-serif font-black text-xl text-brand-text mb-2">
              {isAdminOrSuperAdmin ? 'Owners Workload' : 'Weekly Overview'}
            </h3>
            <p className="text-xs text-brand-silver">
              {isAdminOrSuperAdmin ? 'Select an owner to view their alerts and leads.' : 'Here is your current workload.'}
            </p>
          </div>

          {/* Stats Row */}
          {isAdminOrSuperAdmin ? (
            <div className="flex flex-col gap-2.5 mb-6">
              {OWNERS.map(owner => (
                <button
                  key={owner}
                  onClick={() => {
                    setSelectedOwner(owner);
                    openFullscreen('assigned');
                  }}
                  className={`w-full border rounded-crm p-3.5 flex items-center justify-between text-left transition-all ${
                    selectedOwner === owner 
                      ? 'border-brand-red ring-2 ring-brand-red/10 bg-brand-redLight/10' 
                      : 'border-brand-border bg-white hover:border-brand-silver'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-surfaceAlt flex items-center justify-center font-bold text-xs border border-brand-border text-brand-text shrink-0">
                      {owner.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-text">{getShortName(owner)}</div>
                      <div className="text-[10px] text-brand-silver font-bold">Owner</div>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold shrink-0">
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded" title="Assigned">
                      A: {ownerStats[owner]?.assigned || 0}
                    </span>
                    <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded" title="Pending">
                      P: {ownerStats[owner]?.pending || 0}
                    </span>
                    <span className="bg-red-50 text-brand-red px-1.5 py-0.5 rounded" title="Urgent">
                      U: {ownerStats[owner]?.urgent || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div 
                onClick={() => openFullscreen('assigned')}
                className="bg-white border border-brand-border rounded-xl p-3 text-center shadow-sm cursor-pointer hover:border-brand-silver hover:shadow-md transition-all"
              >
                <div className="text-2xl font-black text-brand-charcoal mb-1">{assignedLeads.length}</div>
                <div className="text-[10px] font-bold text-brand-silver uppercase tracking-widest leading-tight">Assigned<br/>Leads</div>
              </div>
              
              <div 
                onClick={() => openFullscreen('pending')}
                className="bg-white border border-brand-border rounded-xl p-3 text-center shadow-sm cursor-pointer hover:border-brand-silver hover:shadow-md transition-all"
              >
                <div className="text-2xl font-black text-blue-600 mb-1">{yetToContactLeads.length}</div>
                <div className="text-[10px] font-bold text-brand-silver uppercase tracking-widest leading-tight">Yet to<br/>Contact</div>
              </div>
              
              <div 
                onClick={() => openFullscreen('urgent')}
                className="bg-white border border-brand-border rounded-xl p-3 text-center shadow-sm relative cursor-pointer hover:border-brand-silver hover:shadow-md transition-all"
              >
                {urgentLeads.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-red rounded-full border-2 border-white shadow-md animate-pulse z-10" />
                )}
                <div className="text-2xl font-black text-brand-red mb-1">{urgentLeads.length}</div>
                <div className="text-[10px] font-bold text-brand-silver uppercase tracking-widest leading-tight">Urgent<br/>This Week</div>
              </div>
            </div>
          )}

          {/* Action Items Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-brand-border flex-1"></div>
            <span className="text-[10px] text-brand-silver uppercase tracking-widest font-bold">Action Items</span>
            <div className="h-px bg-brand-border flex-1"></div>
          </div>

          {isAdminOrSuperAdmin ? (
            adminActionCards.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {adminActionCards.map((card, idx) => (
                  <div 
                    key={`${card.id}-${idx}`}
                    onClick={() => {
                      if (card.owner) {
                        setSelectedOwner(card.owner);
                      }
                      setActiveFilter('assigned');
                      setIsExpanded(true);
                      setIsOpen(false);
                      if (card.leadDbId) {
                        setHighlightedLeadId(card.leadDbId);
                      }
                    }}
                    className="bg-white border border-brand-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${card.colorBg} group-hover:scale-110 transition-transform shrink-0`}>
                        {card.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-text">{card.title}</h4>
                        <p className="text-xs text-brand-silver mt-0.5">{card.message}</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-silver group-hover:text-brand-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                ))}
              </div>
            ) : (
               <div className="bg-white border border-brand-border rounded-xl p-4 text-center text-brand-silver text-sm">
                 No action items at the moment. Great job!
               </div>
            )
          ) : (
            (actionUrgentLeads.length > 0 || actionOverdueContactLeads.length > 0) ? (
              <div className="flex flex-col gap-2.5">
                {/* Urgent Leads Card */}
                {actionUrgentLeads.length > 0 && (
                  <div 
                    onClick={() => openFullscreen('urgent')}
                    className="bg-white border border-brand-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-brand-red group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-text">Review Urgent Leads</h4>
                        <p className="text-xs text-brand-silver mt-0.5">
                          {actionUrgentLeads.length} leads require immediate action
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-silver group-hover:text-brand-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                )}

                {/* Overdue Contact Alert Card */}
                {actionOverdueContactLeads.length > 0 && (
                  <div 
                    onClick={() => openFullscreen('pending')}
                    className="bg-white border border-brand-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-text">Overdue Contact Alert</h4>
                        <p className="text-xs text-brand-silver mt-0.5">
                          {actionOverdueContactLeads.length} assigned leads were not contacted within their deadline
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-silver group-hover:text-brand-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                )}
              </div>
            ) : (
               <div className="bg-white border border-brand-border rounded-xl p-4 text-center text-brand-silver text-sm">
                 No action items at the moment. Great job!
               </div>
            )
          )}

              {/* Recent Notifications (Last 5) */}
              <div className="flex items-center gap-4 my-4">
                <div className="h-px bg-brand-border flex-1"></div>
                <span className="text-[10px] text-brand-silver uppercase tracking-widest font-bold">Recent Notifications</span>
                <div className="h-px bg-brand-border flex-1"></div>
              </div>

              <div className="flex flex-col gap-2">
                {allNotifications.slice(0, 5).length > 0 ? (
                  allNotifications.slice(0, 5).map(n => {
                    const isUnread = !n.isRead;
                    return (
                      <div 
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsOpen(false);
                          setIsExpanded(true);
                          setActiveFilter('assigned');
                          if (n.leadDbId) {
                            const index = assignedLeads.findIndex(l => l._id === n.leadDbId);
                            if (index !== -1) {
                              const targetPage = Math.floor(index / rowsPerPage) + 1;
                              setCurrentPage(targetPage);
                            }
                            setHighlightedLeadId(n.leadDbId);
                          }
                        }}
                        className={`bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-3 items-start border-brand-border relative ${
                          isUnread ? 'border-l-4 border-l-brand-red' : ''
                        }`}
                      >
                        <div className="text-base leading-none pt-0.5">{n.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-normal ${isUnread ? 'font-black text-brand-text' : 'font-bold text-brand-silver'}`}>
                            {n.message}
                          </p>
                          <span className="text-[9px] text-brand-silver font-bold block mt-1">{n.time}</span>
                        </div>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0 self-center"></span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-brand-border rounded-xl p-4 text-center text-brand-silver text-xs">
                    No recent notifications.
                  </div>
                )}
              </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-brand-border bg-white text-center shrink-0">
          <button 
            onClick={() => openFullscreen('all')}
            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            View detailed report
          </button>
        </div>
      </div>
    </>
  );
}
