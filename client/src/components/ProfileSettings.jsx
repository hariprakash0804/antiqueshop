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
  const [profileErrors, setProfileErrors] = useState({});

  // Role Request states
  const [roleRequests, setRoleRequests] = useState([]);
  const [requestRole, setRequestRole] = useState('seller');
  const [requestReason, setRequestReason] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Password change states
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

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

  // Password strength calculator
  const getPasswordStrength = (pw) => {
    if (!pw) return { label: 'EMPTY', score: 0, color: 'bg-zinc-800' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (pw.length < 6 || score <= 1) return { label: 'WEAK', score: 1, color: 'bg-red-500 text-red-400' };
    if (score <= 3) return { label: 'MODERATE', score: 2, color: 'bg-yellow-500 text-yellow-400' };
    return { label: 'STRONG', score: 3, color: 'bg-green-500 text-green-400' };
  };

  const validateProfile = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Display name cannot be blank';
    } else if (name.trim().length < 2) {
      errs.name = 'Display name must be at least 2 characters';
    } else if (name.trim().length > 60) {
      errs.name = 'Display name cannot exceed 60 characters';
    }

    if (phone.trim()) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,14}$/;
      if (!phoneRegex.test(phone.trim())) {
        errs.phone = 'Please enter a valid phone number format (e.g. +91 9876543210)';
      }
    }

    if (address.trim() && address.trim().length < 8) {
      errs.address = 'Address must be at least 8 characters';
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          phone: phone.trim() || null, 
          address: address.trim() || null, 
          avatar 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
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

  const validatePasswordChange = () => {
    const errs = {};
    if (!currentPw) {
      errs.currentPw = 'Current password is required';
    }
    if (!newPw) {
      errs.newPw = 'New password is required';
    } else if (newPw.length < 6) {
      errs.newPw = 'New password must be at least 6 characters';
    } else if (newPw === currentPw) {
      errs.newPw = 'New password must be different from current password';
    }

    if (!confirmPw) {
      errs.confirmPw = 'Please confirm your new password';
    } else if (newPw !== confirmPw) {
      errs.confirmPw = 'Passwords do not match';
    }

    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;

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
      
      // Update local storage token if server returned fresh session token
      if (data.token) {
        onProfileUpdate({ ...user, token: data.token });
      }

      toast.success('Password changed successfully. Active session refreshed.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwErrors({});
      setShowPwChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleRoleRequestSubmit = async (e) => {
    e.preventDefault();
    setRoleError('');

    if (!requestReason.trim() || requestReason.trim().length < 15) {
      setRoleError('Please provide a detailed justification (minimum 15 characters).');
      return;
    }
    if (requestReason.trim().length > 500) {
      setRoleError('Justification cannot exceed 500 characters.');
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
        body: JSON.stringify({ requestedRole: requestRole, reason: requestReason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Clearance request logged with Admin Overlord.');
        setRequestReason('');
        setRoleError('');
        fetchMyRoleRequests();
      } else {
        setRoleError(data.message || 'Failed to submit clearance request.');
        toast.error(data.message || 'Failed to submit clearance request.');
      }
    } catch (err) {
      setRoleError('Network connection to auth core lost.');
      toast.error('Network connection to auth core lost.');
    } finally {
      setRoleLoading(false);
    }
  };

  const AVATAR_PRESETS = [
    { label: 'Voyager', emoji: '🚀', style: 'border-blue-500/30 hover:border-blue-500 bg-blue-500/10' },
    { label: 'Hunter', emoji: '💎', style: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10' },
    { label: 'Scavenger', emoji: '🏺', style: 'border-amber-500/30 hover:border-amber-500 bg-amber-500/10' },
    { label: 'Archivist', emoji: '📜', style: 'border-cyber-gold/30 hover:border-cyber-gold bg-cyber-gold/10' },
    { label: 'AI Overlord', emoji: '🤖', style: 'border-purple-500/30 hover:border-purple-500 bg-purple-500/10' }
  ];

  const inputClass = "w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-700 text-white transition-all";
  const pwStrength = getPasswordStrength(newPw);

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
        <form onSubmit={handleProfileSave} noValidate className="space-y-6">
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
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">
              DISPLAY NAME <span className="text-cyber-gold">*</span>
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => {
                setName(e.target.value);
                if (profileErrors.name && e.target.value.trim().length >= 2) {
                  setProfileErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              className={`${inputClass} ${profileErrors.name ? 'border-red-500/80 bg-red-950/20' : ''}`}
            />
            {profileErrors.name && (
              <p className="text-[10px] text-red-400 font-mono">✕ {profileErrors.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">EMAIL ADDRESS</label>
            <input 
              type="email" disabled value={user?.email || ''}
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
            <p className="text-[9px] text-zinc-600 font-mono">Email is locked to primary ledger record</p>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">PHONE NUMBER</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => {
                setPhone(e.target.value);
                if (profileErrors.phone) setProfileErrors(prev => ({ ...prev, phone: undefined }));
              }}
              placeholder="+91 9876543210"
              className={`${inputClass} ${profileErrors.phone ? 'border-red-500/80 bg-red-950/20' : ''}`}
            />
            {profileErrors.phone && (
              <p className="text-[10px] text-red-400 font-mono">✕ {profileErrors.phone}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-display text-gray-400 tracking-wider">DEFAULT SHIPPING ADDRESS</label>
            <textarea 
              rows={3} 
              value={address} 
              onChange={e => {
                setAddress(e.target.value);
                if (profileErrors.address) setProfileErrors(prev => ({ ...prev, address: undefined }));
              }}
              placeholder="Full address, City, State, PIN"
              className={`${inputClass} ${profileErrors.address ? 'border-red-500/80 bg-red-950/20' : ''}`}
            />
            {profileErrors.address && (
              <p className="text-[10px] text-red-400 font-mono">✕ {profileErrors.address}</p>
            )}
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
            onClick={() => {
              setShowPwChange(!showPwChange);
              setPwErrors({});
            }}
            className="text-xs font-display tracking-widest text-cyber-cyan hover:text-white transition-colors"
          >
            {showPwChange ? '▼ HIDE' : '▶ CHANGE'} PASSPHRASE
          </button>

          {showPwChange && (
            <form onSubmit={handlePasswordChange} noValidate className="mt-4 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="block text-[10px] font-display text-gray-400 tracking-wider">
                  CURRENT PASSPHRASE <span className="text-cyber-gold">*</span>
                </label>
                <input 
                  type="password" 
                  value={currentPw} 
                  onChange={e => {
                    setCurrentPw(e.target.value);
                    if (pwErrors.currentPw) setPwErrors(prev => ({ ...prev, currentPw: undefined }));
                  }}
                  className={`${inputClass} ${pwErrors.currentPw ? 'border-red-500/80 bg-red-950/20' : ''}`}
                />
                {pwErrors.currentPw && (
                  <p className="text-[10px] text-red-400 font-mono">✕ {pwErrors.currentPw}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400 tracking-wider">
                    NEW PASSPHRASE <span className="text-cyber-gold">*</span>
                  </label>
                  <input 
                    type="password" 
                    value={newPw} 
                    onChange={e => {
                      setNewPw(e.target.value);
                      if (pwErrors.newPw) setPwErrors(prev => ({ ...prev, newPw: undefined }));
                    }}
                    placeholder="Min 6 characters"
                    className={`${inputClass} ${pwErrors.newPw ? 'border-red-500/80 bg-red-950/20' : ''}`}
                  />
                  {pwErrors.newPw && (
                    <p className="text-[10px] text-red-400 font-mono">✕ {pwErrors.newPw}</p>
                  )}
                  {newPw.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-zinc-500">STRENGTH:</span>
                        <span className={pwStrength.color.split(' ')[1]}>{pwStrength.label}</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 ${pwStrength.score >= 1 ? pwStrength.color.split(' ')[0] : 'bg-zinc-800'}`} />
                        <div className={`h-full flex-1 ${pwStrength.score >= 2 ? pwStrength.color.split(' ')[0] : 'bg-zinc-800'}`} />
                        <div className={`h-full flex-1 ${pwStrength.score >= 3 ? pwStrength.color.split(' ')[0] : 'bg-zinc-800'}`} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-display text-gray-400 tracking-wider">
                    CONFIRM NEW PASSPHRASE <span className="text-cyber-gold">*</span>
                  </label>
                  <input 
                    type="password" 
                    value={confirmPw} 
                    onChange={e => {
                      setConfirmPw(e.target.value);
                      if (pwErrors.confirmPw) setPwErrors(prev => ({ ...prev, confirmPw: undefined }));
                    }}
                    className={`${inputClass} ${pwErrors.confirmPw ? 'border-red-500/80 bg-red-950/20' : ''}`}
                  />
                  {pwErrors.confirmPw && (
                    <p className="text-[10px] text-red-400 font-mono">✕ {pwErrors.confirmPw}</p>
                  )}
                </div>
              </div>

              <button 
                type="submit" disabled={pwLoading}
                className="w-full py-3 rounded-xl border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 font-display font-bold text-xs tracking-widest transition-all"
              >
                {pwLoading ? 'PROCESSING...' : 'UPDATE PASSPHRASE'}
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
              <form onSubmit={handleRoleRequestSubmit} noValidate className="space-y-4">
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
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-display text-gray-400 tracking-wider">
                      UPGRADE JUSTIFICATION / EXPLANATION <span className="text-cyber-gold">*</span>
                    </label>
                    <span className={`text-[9px] font-mono ${requestReason.length < 15 ? 'text-yellow-500' : 'text-zinc-500'}`}>
                      {requestReason.length}/500 chars (min 15)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={e => {
                      setRequestReason(e.target.value.slice(0, 500));
                      if (roleError && e.target.value.trim().length >= 15) setRoleError('');
                    }}
                    placeholder="Provide your reason or clearance details for upgrading (minimum 15 characters)..."
                    className={`${inputClass} ${roleError ? 'border-red-500/80 bg-red-950/20' : ''}`}
                  />
                  {roleError && (
                    <p className="text-[10px] text-red-400 font-mono">✕ {roleError}</p>
                  )}
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
