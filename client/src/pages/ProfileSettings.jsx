import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updatePassword } from '../api/authApi.js';
import { getUsers } from '../api/adminApi.js';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();

  // Personal Information State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [designation, setDesignation] = useState(user?.designation || user?.role || 'Sales Executive');
  const [department, setDepartment] = useState(user?.department || 'Business Development');
  const [employeeId, setEmployeeId] = useState(user?.employeeId || (user?._id ? `LAT-${user._id.toString().slice(-3).toUpperCase()}` : 'LAT-003'));
  const [officeLocation, setOfficeLocation] = useState(user?.location || 'Kolkata, India');
  const [reportingManager, setReportingManager] = useState(user?.reporting_manager || user?.manager || 'Unassigned');

  // Dynamic DB Manager List
  const [managerList, setManagerList] = useState([]);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status Alerts
  const [infoMessage, setInfoMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadManagers() {
      try {
        const res = await getUsers();
        const usersArr = Array.isArray(res) ? res : (res?.data || res?.users || []);
        if (usersArr.length > 0) {
          setManagerList(usersArr);
        }
      } catch (err) {
        // Silent fallback
      }
    }
    loadManagers();
  }, []);

  const handleSaveInfo = (e) => {
    e.preventDefault();
    setError('');
    if (updateProfile) {
      updateProfile({
        name: fullName,
        phone,
        designation,
        department,
        employeeId,
        location: officeLocation,
        reporting_manager: reportingManager
      });
    }
    setInfoMessage('Profile information saved successfully.');
    setTimeout(() => setInfoMessage(''), 4000);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await updatePassword({ currentPassword, newPassword });
      setPasswordMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Alert Messages */}
      {infoMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-700 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}
      {passwordMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-700 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{passwordMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveInfo} className="flex flex-col gap-6">
        
        {/* Card 1: Personal Information */}
        <div className="bg-white border border-brand-border/60 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
          <h2 className="text-xs font-bold text-brand-text uppercase tracking-widest">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="Enter phone number"
              />
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-400 bg-slate-50/80 cursor-not-allowed"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="Enter designation"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="Enter department"
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="Enter employee ID"
              />
            </div>

            {/* Office Location */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Office Location</label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="e.g. Kolkata, India"
              />
            </div>

            {/* Reporting Manager */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Reporting Manager</label>
              <input
                type="text"
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all bg-white"
                placeholder="Enter reporting manager"
              />
            </div>

          </div>
        </div>

        {/* Card 2: Change Password */}
        <div className="bg-white border border-brand-border/60 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
          <h2 className="text-xs font-bold text-brand-text uppercase tracking-widest">Change Password</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Current Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 rounded-xl text-sm font-medium text-slate-800 transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={loading}
              className="bg-transparent border border-brand-red/20 hover:bg-brand-redLight/20 active:bg-brand-redLight/40 text-brand-red font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="bg-[#DA291C] hover:bg-[#C22419] active:bg-[#DA291C] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(218,41,28,0.15)]"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
