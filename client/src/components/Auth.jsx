import React, { useState } from 'react';
import { API_BASE } from '../config';

export function Auth({ onAuthSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('customer'); // Default to customer
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { name, email, password, role };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-panel-neon-gold rounded-3xl p-5 sm:p-8 pulse-gold-glow animate-fade-in">
        {/* Futuristic Scanline */}
        <div className="scanline"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cyber-gold transition-colors font-display text-lg"
        >
          [X]
        </button>

        {/* Brand Console */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-display font-extrabold tracking-widest text-cyber-gold">
            NEXUS // CORE
          </h2>
          <p className="text-xs text-cyber-cyan font-display tracking-widest mt-1">
            {isLogin ? 'SECURE IDENTITY LINK' : 'INITIALIZE NEW LINK'}
          </p>
        </div>

        {/* Sliding Navigation Controls */}
        <div className="relative flex justify-around items-center h-12 bg-black/50 border border-zinc-800 rounded-full mb-8 p-1">
          {/* Active Slider Indicator */}
          <div 
            className={`absolute top-1 bottom-1 w-[48%] rounded-full bg-gradient-to-r from-cyber-gold to-yellow-600 transition-all duration-500 ease-in-out ${
              isLogin ? 'left-1' : 'left-[50%]'
            }`}
          />
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`relative z-10 w-1/2 text-sm font-display tracking-widest transition-colors duration-300 ${
              isLogin ? 'text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            LOGIN
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`relative z-10 w-1/2 text-sm font-display tracking-widest transition-colors duration-300 ${
              !isLogin ? 'text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            SIGNUP
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-400 text-xs rounded-lg font-mono text-center">
              ERROR: {error.toUpperCase()}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-xs font-display tracking-wider text-gray-400">OPERATOR NAME</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-display tracking-wider text-gray-400">OPERATOR EMAIL</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@nexus.com"
              className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-display tracking-wider text-gray-400">PASSPHRASE</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/60 border border-zinc-800 focus:border-cyber-gold focus:outline-none rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold tracking-widest text-sm transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'SYNCHRONIZING...' : isLogin ? 'INITIATE CONNECTION' : 'ESTABLISH LINK'}
          </button>
        </form>
      </div>
    </div>
  );
}
