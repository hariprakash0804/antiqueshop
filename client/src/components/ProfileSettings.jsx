import React, { useState } from 'react';
import { useToast } from './Toast';
import { API_BASE } from '../config';

export function ProfileSettings({ user, onProfileUpdate, setView }) {
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🚀');
  const [loading, setLoading] = useState(false);

  // Role Request states
  const [roleRequests, setRoleRequests] = useState([]);
  const [requestRole, setRequestRole] = useState('seller');
  const [requestReason, setRequestReason] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  React.useEffect(() => {
    if (user?.role === 'customer') {
      fetchMyRoleRequests();
    }
  }, [user]);

  const fetchMyRoleRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/role-request`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoleRequests(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch role requests:', err);
    }
  };

  const handleRoleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestReason.trim() || requestReason.trim().length < 5) {
      toast.error('A valid justification is required (minimum 5 characters).');
      return;
    }
    setRoleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/role-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ requestedRole: requestRole, reason: requestReason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Clearance request logged with Admin Overlord.');
        setRequestReason('');
        fetchMyRoleRequests();
      } else {
        toast.error(data.message || 'Failed to submit clearance request.');
      }
    } catch (err) {
      toast.error('Network connection to auth core lost.');
    } finally {
      setRoleLoading(false);
    }
  };

  // Password change
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const AVATAR_PRESETS = [
    { label: 'Voyager', emoji: '🚀', style: 'border-blue-500/30 hover:border-blue-500 bg-blue-500/10' },
    { label: 'Hunter', emoji: '💎', style: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10' },
    { label: 'Scavenger', emoji: '🏺', style: 'border-amber-500/30 hover:border-amber-500 bg-amber-500/10' },
    { label: 'Archivist', emoji: '📜', style: 'border-cyber-gold/30 hover:border-cyber-gold bg-cyber-gold/10' },
    { label: 'AI Overlord', emoji: '🤖', style: 'border-purple-500/30 hover:border-purple-500 bg-purple-500/10' }
  ];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name, phone, address, avatar })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
      // Update local storage with new data
      const updatedUser = { 
        ...user, 
        name: data.name, 
        phone: data.phone, 
        address: data.address, 
        avatar: data.avatar 
      };
      onProfileUpdate(updatedUser);
      toast.success('Holographic matrix updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password change failed');
      toast.success('Password changed successfully');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setShowPwChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const inputClass = "w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-700 text-white transition-all";

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
      {/* Back button */}
      <button 
        onClick={() => setView('dashboard')}
        className="mb-6 text-[10px] font-display tracking-widest text-gray-400 hover:text-cyber-gold transition-colors"
      >
        ← BACK TO CONTROL PANEL
      </button>

      <div className="glass-panel-neon-gold rounded-3xl p-5 sm:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-900">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-gold/20 to-cyber-cyan/20 border border-zinc-800 flex items-center justify-center text-3xl font-display font-black text-cyber-gold">
            {avatar}
          </div>
          <div>
            <h2 className="text-lg font-display font-extrabold text-white tracking-widest">
              IDENTITY SETTINGS
            </h2>
            <div className="text-[10px] font-mono text-zinc-500 mt-1">
              USER ID: #NX_USER_{user?.id} | ROLE: {user?.role?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSave} className="space-y-6">
          {/* Avatar selector */}
          <div className="space-y-2">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">HOLOGRAPHIC AVATAR SPEC</label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAvatar(preset.emoji)}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl transition-all ${preset.style} ${
                    avatar === preset.emoji ? 'border-cyber-cyan bg-cyan-500/20 scale-110 shadow-cyan-glow' : 'opacity-60'
                  }`}
                  title={preset.label}
                >
                  {preset.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">DISPLAY NAME</label>
            <input 
              type="text" required value={name} onChange={e => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">EMAIL ADDRESS</label>
            <input 
              type="email" disabled value={user?.email || ''}
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
            <p className="text-[9px] text-zinc-600 font-mono">Email cannot be changed</p>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">PHONE NUMBER</label>
            <input 
              type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">DEFAULT SHIPPING ADDRESS</label>
            <textarea 
              rows={3} value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Full address, City, State, PIN"
              className={inputClass}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold tracking-widest text-xs transition-all transform active:scale-95 shadow-gold-glow"
          >
            {loading ? 'UPDATING...' : 'SAVE PROFILE CHANGES'}
          </button>
        </form>

        {/* Password Section */}
        <div className="pt-6 border-t border-zinc-900">
          <button 
            onClick={() => setShowPwChange(!showPwChange)}
            className="text-xs font-display tracking-widest text-cyber-cyan hover:text-white transition-colors"
          >
            {showPwChange ? '▼ HIDE' : '▶ CHANGE'} PASSWORD
          </button>

          {showPwChange && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="block text-[10px] font-display text-gray-400 tracking-wider">CURRENT PASSWORD</label>
                <input 
                  type="password" required value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400 tracking-wider">NEW PASSWORD</label>
                  <input 
                    type="password" required value={newPw} onChange={e => setNewPw(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400 tracking-wider">CONFIRM NEW PASSWORD</label>
                  <input 
                    type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={pwLoading}
                className="w-full py-3 rounded-xl border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 font-display font-bold text-xs tracking-widest transition-all"
              >
                {pwLoading ? 'PROCESSING...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          )}
        </div>

        {/* Role Upgrade Request Section */}
        {user?.role === 'customer' && (
          <div className="pt-6 border-t border-zinc-900 space-y-4">
            <h3 className="text-xs font-display font-extrabold text-cyber-gold tracking-widest uppercase">
              ✦ REQUEST PRIVILEGE CLEARANCE UPGRADE ✦
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Newly registered accounts default to customer (client) authorization. If you require seller or order manager clearance, submit an application below.
            </p>

            {/* Check for active pending request */}
            {roleRequests.some(r => r.status === 'pending') ? (
              <div className="p-4 rounded-xl border border-yellow-500/30 text-yellow-500 bg-yellow-500/10 font-mono text-xs space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <span className="animate-pulse">●</span> STATUS: PENDING ADMIN APPROVAL
                </div>
                {roleRequests.filter(r => r.status === 'pending').map(req => (
                  <div key={req.id} className="text-[10px] text-zinc-400 space-y-1">
                    <div>Requested Clearance: <span className="text-white font-bold">{req.requestedRole === 'seller' ? 'SELLER' : 'ORDER MANAGER'}</span></div>
                    <div>Justification: <span className="italic">"{req.reason}"</span></div>
                    <div>Logged At: <span>{new Date(req.createdAt).toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleRoleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-display text-gray-400 tracking-wider">TARGET SECURITY LEVEL</label>
                    <select
                      value={requestRole}
                      onChange={e => setRequestRole(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono text-white"
                    >
                      <option value="seller">SELLER (Clearance: List & Trade relics)</option>
                      <option value="order_manager">LOGISTICS OFFICER (Clearance: Manage Shipments)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400 tracking-wider">UPGRADE JUSTIFICATION / EXPLANATION</label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={e => setRequestReason(e.target.value)}
                    placeholder="Provide your reason or clearance details for upgrading..."
                    required
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={roleLoading}
                  className="w-full py-3 rounded-xl border border-cyber-gold text-cyber-gold hover:bg-cyber-gold/10 font-display font-bold text-xs tracking-widest transition-all"
                >
                  {roleLoading ? 'TRANSMITTING REQUEST...' : 'TRANSMIT CLEARANCE REQUEST'}
                </button>
              </form>
            )}

            {/* Display historical requests if any resolved */}
            {roleRequests.some(r => r.status !== 'pending') && (
              <div className="space-y-2 pt-2">
                <div className="text-[9px] font-display text-gray-500 tracking-wider">HISTORICAL REQUEST LOGS</div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {roleRequests.filter(r => r.status !== 'pending').map(req => (
                    <div key={req.id} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-900 flex justify-between items-center text-[10px] font-mono">
                      <div>
                        <div>Clearance: <span className="text-white font-bold">{req.requestedRole === 'seller' ? 'SELLER' : 'ORDER MANAGER'}</span></div>
                        <div className="text-zinc-500 truncate max-w-xs">{req.reason}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          req.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {req.status}
                        </span>
                        <div className="text-[8px] text-zinc-600 mt-1">{new Date(req.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
