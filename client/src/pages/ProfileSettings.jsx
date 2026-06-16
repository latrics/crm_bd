import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updatePassword } from '../api/authApi.js';
import { useNavigate } from 'react-router-dom';

export default function ProfileSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);
    try {
      const res = await updatePassword(currentPassword, newPassword);
      setMessage(res.message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-brand-border">
      <h1 className="text-2xl font-serif font-black mb-6">Profile Settings</h1>
      
      <div className="mb-8 p-4 bg-brand-surfaceAlt rounded-lg border border-brand-border">
        <h2 className="text-lg font-bold mb-4 border-b border-brand-border pb-2">Account Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-brand-silver font-bold uppercase">Name</p>
            <p className="font-medium text-brand-text">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-brand-silver font-bold uppercase">Email</p>
            <p className="font-medium text-brand-text">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-brand-silver font-bold uppercase">Role</p>
            <p className="font-medium mt-1 uppercase bg-brand-redLight text-brand-red px-2 py-0.5 rounded inline-block text-[10px] font-black">{user.role}</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4 border-b border-brand-border pb-2">Update Password</h2>
      {message && <div className="p-3 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg">{message}</div>}
      {error && <div className="p-3 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-brand-text mb-1">Current Password</label>
          <input
            type="password"
            className="w-full p-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-brand-surfaceAlt/50"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-text mb-1">New Password</label>
          <input
            type="password"
            className="w-full p-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-brand-surfaceAlt/50"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-text mb-1">Confirm New Password</label>
          <input
            type="password"
            className="w-full p-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none bg-brand-surfaceAlt/50"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-text hover:bg-brand-red text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save New Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
