import React, { useState } from 'react';
import { API_BASE } from '../config';

export function Auth({ onAuthSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState('customer'); // Default to customer
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  // Password strength calculation
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

  // Client-side validation helper
  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!isLogin) {
      if (!name.trim()) {
        errs.name = 'Operator name is required';
      } else if (name.trim().length < 2) {
        errs.name = 'Name must be at least 2 characters';
      } else if (name.trim().length > 50) {
        errs.name = 'Name cannot exceed 50 characters';
      }
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim().toLowerCase())) {
      errs.email = 'Please provide a valid email format (e.g. name@nexus.com)';
    }

    if (!password) {
      errs.password = 'Passphrase is required';
    } else if (password.length < 6) {
      errs.password = 'Passphrase must be at least 6 characters in length';
    }

    if (!isLogin) {
      if (!confirmPassword) {
        errs.confirmPassword = 'Please confirm your passphrase';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = 'Passphrase confirmation does not match';
      }
    }

    return errs;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validate();
    setFieldErrors(errs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all touched
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const errs = validate();
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email: email.trim().toLowerCase(), password }
      : { name: name.trim(), email: email.trim().toLowerCase(), password, role };

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

  const switchMode = (mode) => {
    setIsLogin(mode);
    setError('');
    setFieldErrors({});
    setTouched({});
  };

  const pwStrength = getPasswordStrength(password);

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
            onClick={() => switchMode(true)}
            className={`relative z-10 w-1/2 text-sm font-display tracking-widest transition-colors duration-300 ${
              isLogin ? 'text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            LOGIN
          </button>
          <button 
            type="button"
            onClick={() => switchMode(false)}
            className={`relative z-10 w-1/2 text-sm font-display tracking-widest transition-colors duration-300 ${
              !isLogin ? 'text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            SIGNUP
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-400 text-xs rounded-lg font-mono text-center animate-shake">
              ERROR: {error.toUpperCase()}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-xs font-display tracking-wider text-gray-400">
                OPERATOR NAME <span className="text-cyber-gold">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    setFieldErrors(prev => ({ ...prev, name: e.target.value.trim().length < 2 ? 'Name must be at least 2 characters' : undefined }));
                  }
                }}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. John Doe"
                className={`w-full bg-black/60 border rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all ${
                  touched.name && fieldErrors.name 
                    ? 'border-red-500/80 focus:border-red-500 bg-red-950/20' 
                    : 'border-zinc-800 focus:border-cyber-gold'
                } focus:outline-none`}
              />
              {touched.name && fieldErrors.name && (
                <p className="text-[10px] text-red-400 font-mono mt-1 flex items-center gap-1">
                  <span>✕</span> {fieldErrors.name}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-display tracking-wider text-gray-400">
              OPERATOR EMAIL <span className="text-cyber-gold">*</span>
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value.trim());
                  setFieldErrors(prev => ({ ...prev, email: !isValid ? 'Invalid email format' : undefined }));
                }
              }}
              onBlur={() => handleBlur('email')}
              placeholder="e.g. operator@nexus.com"
              className={`w-full bg-black/60 border rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all ${
                touched.email && fieldErrors.email 
                  ? 'border-red-500/80 focus:border-red-500 bg-red-950/20' 
                  : 'border-zinc-800 focus:border-cyber-gold'
              } focus:outline-none`}
            />
            {touched.email && fieldErrors.email && (
              <p className="text-[10px] text-red-400 font-mono mt-1 flex items-center gap-1">
                <span>✕</span> {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-display tracking-wider text-gray-400">
              PASSPHRASE <span className="text-cyber-gold">*</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) {
                  setFieldErrors(prev => ({ ...prev, password: e.target.value.length < 6 ? 'Passphrase must be at least 6 characters' : undefined }));
                }
              }}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={`w-full bg-black/60 border rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all ${
                touched.password && fieldErrors.password 
                  ? 'border-red-500/80 focus:border-red-500 bg-red-950/20' 
                  : 'border-zinc-800 focus:border-cyber-gold'
              } focus:outline-none`}
            />
            {touched.password && fieldErrors.password && (
              <p className="text-[10px] text-red-400 font-mono mt-1 flex items-center gap-1">
                <span>✕</span> {fieldErrors.password}
              </p>
            )}

            {!isLogin && password.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex justify-between text-[9px] font-mono">
                  <span className="text-zinc-500">STRENGTH:</span>
                  <span className={pwStrength.color.split(' ')[1] || 'text-zinc-400'}>{pwStrength.label}</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 transition-all ${pwStrength.score >= 1 ? pwStrength.color.split(' ')[0] : 'bg-zinc-800'}`} />
                  <div className={`h-full flex-1 transition-all ${pwStrength.score >= 2 ? pwStrength.color.split(' ')[0] : 'bg-zinc-800'}`} />
                  <div className={`h-full flex-1 transition-all ${pwStrength.score >= 3 ? pwStrength.color.split(' ')[0] : 'bg-zinc-800'}`} />
                </div>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-xs font-display tracking-wider text-gray-400">
                CONFIRM PASSPHRASE <span className="text-cyber-gold">*</span>
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touched.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: e.target.value !== password ? 'Passphrases do not match' : undefined }));
                  }
                }}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="••••••••"
                className={`w-full bg-black/60 border rounded-xl p-3 text-sm font-mono placeholder-zinc-700 transition-all ${
                  touched.confirmPassword && fieldErrors.confirmPassword 
                    ? 'border-red-500/80 focus:border-red-500 bg-red-950/20' 
                    : 'border-zinc-800 focus:border-cyber-gold'
                } focus:outline-none`}
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="text-[10px] text-red-400 font-mono mt-1 flex items-center gap-1">
                  <span>✕</span> {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold tracking-widest text-sm transition-all transform active:scale-95 disabled:opacity-50 shadow-gold-glow"
          >
            {loading ? 'SYNCHRONIZING...' : isLogin ? 'INITIATE CONNECTION' : 'ESTABLISH LINK'}
          </button>
        </form>
      </div>
    </div>
  );
}
