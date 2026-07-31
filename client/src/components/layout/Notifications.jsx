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
import { LEAD_STAGES, SOURCES, FLAT_SOURCES, OWNERS, SECTORS, STG_COLORS, BUSINESS_MODELS } from '../../constants/index.js';
import { updateLead, deleteLead } from '../../api/leadsApi.js';
import { getNotifications, markNotificationAsRead } from '../../api/notificationsApi.js';
import useToast from '../../hooks/useToast.js';
import { AlertTriangle, Hourglass, User, CheckCircle2, Bell, BarChart2, Clock, Sparkles } from 'lucide-react';



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
        if (l.status !== 'Leads') return false;
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
  
  // Urgent leads: deadline within 7 days (or overdue) and status is 'Leads'
  const urgentLeads = assignedLeads.filter(l => {
    if (l.status !== 'Leads') return false;
    if (!l.deadline) return false;
    const timeLeft = new Date(l.deadline) - new Date();
    return timeLeft < 7 * 24 * 60 * 60 * 1000;
  });

  // Action Item - Urgent Leads:
  // For Admins/Superadmins: all urgent leads in state.leads
  // For normal users: only assigned urgent leads
  const actionUrgentLeads = isAdminOrSuperAdmin
    ? (state.leads?.filter(l => {
        if (l.status !== 'Leads') return false;
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
          icon: <Hourglass className="w-4 h-4" />,
          colorBg: 'bg-amber-50 text-amber-600 border border-amber-100/50'
        };
      })
    : [];

  // Map DB notifications to UI format
  const allNotifications = apiNotifications.map(n => {
    let icon = <Bell className="w-4.5 h-4.5" />;
    let color = 'text-blue-500 bg-blue-50';
    if (n.type === 'urgent' || n.type === 'warning') { icon = <AlertTriangle className="w-4.5 h-4.5" />; color = 'text-red-500 bg-red-50 border-l-4 border-red-500'; }
    else if (n.type === 'info' || n.type === 'assignment') { icon = <User className="w-4.5 h-4.5" />; color = 'text-blue-500 bg-blue-50'; }
    else if (n.type === 'success') { icon = <CheckCircle2 className="w-4.5 h-4.5" />; color = 'text-green-500 bg-green-50'; }

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
          if (l.status !== 'Leads') return false;
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
      setIsOpen(false);
      navigate('/notifications');
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
    setIsOpen(false);
    let targetTab = 'All';
    if (filter === 'urgent') targetTab = 'Unread';
    else if (filter === 'pending') targetTab = 'Unread';
    else if (filter === 'assigned') targetTab = 'Leads';
    else if (filter === 'all') targetTab = 'All';
    else {
      targetTab = filter.charAt(0).toUpperCase() + filter.slice(1);
    }
    navigate('/notifications', { state: { activeTab: targetTab } });
  };

  const closeFullscreen = () => {
    setIsExpanded(false);
  };

  // Notification Row Click Handler
  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setIsOpen(false);
    let targetTab = 'All';
    if (n.type === 'urgent' || n.type === 'warning') {
      targetTab = 'System';
    } else if (n.type === 'info' || n.type === 'assignment') {
      targetTab = 'Leads';
    } else if (n.type === 'success') {
      targetTab = 'Tenders';
    }
    navigate('/notifications', { state: { activeTab: targetTab } });
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
        
        <div className="p-4 sm:p-5 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Lead ID Badge replacing Avatar Circle */}
              <div className="px-3 py-2 bg-brand-red/[0.03] border border-brand-red/10 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[90px] shadow-[inset_0_1px_2px_rgba(218,41,28,0.02)]">
                <span className="text-[8px] font-black text-brand-red/60 uppercase tracking-widest leading-none mb-1">Lead ID</span>
                <span className="text-xs font-mono font-black text-brand-red leading-none">{lead.leadId || 'N/A'}</span>
              </div>

              <div className="min-w-0">
                <h4 className="font-serif text-base font-bold text-brand-text leading-tight truncate">
                  {lead.company || 'Unnamed Company'}
                </h4>
                <div className="text-[10px] text-brand-silver font-bold mt-1.5 flex items-center gap-2 flex-wrap">
                  <span>Added: {formatDate(lead.createdAt)}</span>
                  {lead.deadline && lead.status === 'Leads' && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        new Date(lead.deadline) - new Date() <= 24 * 60 * 60 * 1000
                          ? 'bg-brand-redLight text-brand-red animate-pulse'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        <Clock className="w-3 h-3 shrink-0" /> {formatTimeLeft(lead.deadline)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {lead.owner && (
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full py-1 pl-1 pr-3 shadow-sm">
                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brand-red select-none">
                      <span>{lead.owner.charAt(0)}</span>
                   </div>
                   <span className="text-xs text-brand-charcoal font-bold">{getShortName(lead.owner)}</span>
                </div>
              )}
              
              <div className="flex gap-1.5">
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

          {/* Lead Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3.5 px-5 bg-gray-50/50 border border-gray-100 rounded-xl">
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Decision Maker</span>
              <span className="text-xs font-bold text-brand-text">{lead.decisionMaker || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Industry</span>
              <span className="text-xs font-bold text-brand-text">{lead.industry || '--'}</span>
            </div>
            <div>
              <span className="text-[8px] font-black text-brand-silver uppercase tracking-widest block mb-0.5">Business Model</span>
              <span className="text-xs font-bold text-brand-text">{lead.businessModel || '--'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-3">
             <div className="flex-1 mr-4">
                 <div className="flex gap-1 h-1.5 w-full">
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
                <div className="text-[9px] font-black text-brand-silver mt-2 tracking-widest uppercase">
                   Stage: <span className="text-brand-red font-black">{lead.status}</span>
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
  // Full Screen expanded page layout has been removed. `/notifications` route is the only notification page. }

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
          <div className="flex items-center gap-2 text-brand-text">
            <BarChart2 className="w-5 h-5 opacity-80" />
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
                  <AlertTriangle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
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
                  <AlertTriangle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
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
                      openFullscreen('assigned');
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
              <div className="bg-white border border-brand-border/60 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                {allNotifications.slice(0, 5).length > 0 ? (
                  allNotifications.slice(0, 5).map(n => {
                    const isUnread = !n.isRead;
                    return (
                      <div 
                        key={n.id}
                        onClick={() => {
                          handleNotificationClick(n);
                        }}
                        className="p-3 hover:bg-slate-50/50 transition-all cursor-pointer flex gap-3 items-center relative"
                      >
                        <div className="text-base leading-none shrink-0">{n.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-normal flex items-center gap-1.5 flex-wrap ${isUnread ? 'font-black text-brand-text' : 'font-bold text-brand-silver'}`}>
                            <span>{n.message}</span>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                            )}
                          </p>
                          <span className="text-[9px] text-brand-silver font-bold block mt-0.5">{n.time}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white p-4 text-center text-brand-silver text-xs">
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
