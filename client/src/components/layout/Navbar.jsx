import { NavLink, useNavigate } from 'react-router-dom';
import useCRM from '../../hooks/useCRM.js';
import UserMenu from './UserMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { state } = useCRM();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const exportData = (type) => {
    let dataStr = '';
    const data = { leads: state.leads, deals: state.deals, tenders: state.tenders };
    if (type === 'json') {
      dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    } else {
      const rows = [
        ["ID", "Name", "Company", "Stage"],
        ...state.leads.map(l => [l._id, l.name, l.company, l.status])
      ];
      const csvContent = rows.map(e => e.join(",")).join("\n");
      dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    }
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `latrics_export.${type}`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-1 pb-4 pt-5 font-bold text-xs uppercase tracking-widest ${isActive ? 'text-brand-red border-b-2 border-brand-red' : 'text-brand-silver hover:text-brand-text'} transition-all`;
  
  const badgeClass = (isActive) =>
    `px-2 py-0.5 rounded-full text-[10px] ml-1 ${isActive ? 'bg-brand-red text-white' : 'bg-brand-surfaceAlt text-brand-silver'}`;

  return (
    <nav className="border-b border-brand-border bg-white sticky top-0 z-50 shadow-sm mb-8">
      <div className="max-w-[1250px] mx-auto px-6 flex justify-between items-center h-16">
        <div className="flex items-center gap-12 h-full">
          <div className="font-serif text-xl font-black text-brand-red tracking-wide flex items-center border-r-2 border-brand-red pr-6 h-8">
            LATRICS <span className="font-sans text-[10px] font-bold text-brand-silver tracking-normal ml-2">CRM</span>
          </div>
          <div className="flex items-center gap-8 self-end -mb-[1px] h-full">
            <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
            <NavLink to="/leads" className={navClass}>
              {({ isActive }) => (
                <>Leads <span className={badgeClass(isActive)}>{state.leads.length}</span></>
              )}
            </NavLink>
            <NavLink to="/deals" className={navClass}>
              {({ isActive }) => (
                <>Deals <span className={badgeClass(isActive)}>{state.deals.length}</span></>
              )}
            </NavLink>
            <NavLink to="/tenders" className={navClass}>
              {({ isActive }) => (
                <>Tender <span className={badgeClass(isActive)}>{state.tenders.length}</span></>
              )}
            </NavLink>
            {user && ['superadmin', 'admin', 'super_admin'].includes(user.role?.toLowerCase()) && (
              <NavLink to="/admin/overview" className={navClass}>Admin Panel</NavLink>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-50 text-brand-green border border-green-200 px-3 py-1 rounded-full text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Auto-Saved
          </div>
          
          <button onClick={() => exportData('json')} className="bg-brand-charcoal text-white font-bold text-[10px] rounded px-4 py-1.5 cursor-pointer hover:opacity-90 uppercase tracking-wider shadow-sm">Export JSON</button>
          <button onClick={() => exportData('csv')} className="bg-brand-green text-white font-bold text-[10px] rounded px-4 py-1.5 cursor-pointer hover:opacity-90 uppercase tracking-wider shadow-sm">Export CSV</button>
          
          <div className="flex items-center gap-1.5 bg-brand-surfaceAlt text-brand-silver border border-brand-border px-3 py-1 rounded-full text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-silver"></div> Saved
          </div>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
