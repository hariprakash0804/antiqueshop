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
      const res = await fetch('http://localhost:5000/api/auth/profile', {
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
    <div className="max-w-2xl mx-auto py-12 px-6 animate-fade-in">
      {/* Back button */}
      <button 
        onClick={() => setView('dashboard')}
        className="mb-6 text-[10px] font-display tracking-widest text-gray-400 hover:text-cyber-gold transition-colors"
      >
        ← BACK TO CONTROL PANEL
      </button>

      <div className="glass-panel-neon-gold rounded-3xl p-8 space-y-8">
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
      </div>
    </div>
  );
}
