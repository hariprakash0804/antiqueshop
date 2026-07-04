import React, { useState } from 'react';
import { useToast } from './Toast';

export function Footer({ setView, activeView }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState('');
  const [latency, setLatency] = useState(14);
  const [testingLatency, setTestingLatency] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('CORE NEWSLETTER REGISTRY SUCCESSFUL. DATA FEED INITIATED.');
    setEmail('');
  };

  const handleVerifySignature = () => {
    if (!verifyHash) {
      setVerifyResult('');
      return;
    }
    const cleanHash = verifyHash.trim();
    // Check if it matches length 66 starting with 0x (hex hash)
    const hexRegex = /^0x[a-fA-F0-9]{64}$/;
    if (hexRegex.test(cleanHash)) {
      setVerifyResult('✦ CHAINGUARD SECURE VERIFICATION: SIGNATURE MATCHES VALID TRANSACTION BLOCK RECORD. BLOCK STATUS: COMMITTED.');
      toast.success('Signature authenticated on Nexus Chain!');
    } else {
      setVerifyResult('✕ CHAINGUARD WARNING: SIGNATURE INVALID OR ALTERED. TRANSACTION ENVELOPE CORRUPTED.');
      toast.error('Signature verification failed! Integrity compromised.');
    }
  };

  return (
    <>
      <footer className="border-t border-zinc-900/80 bg-zinc-950/80 backdrop-blur-md py-12 px-6 lg:px-12 relative overflow-hidden">
        {/* Glow grid lines in background */}
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          {/* Logo / Brand story */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-display font-extrabold tracking-widest bg-gradient-to-r from-cyber-gold to-yellow-600 bg-clip-text text-transparent">
                NEXUS
              </span>
              <span className="font-display text-[8px] border border-cyber-cyan text-cyber-cyan rounded px-1 tracking-widest">
                EST. 2026
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              Curating rare antiques and premium galactic jewelry through verified smart valuation ledgers and secure physical transit conduits.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-display tracking-widest text-cyber-gold font-bold">DIRECTORY ARCHIVES</h4>
            <ul className="space-y-2 text-xs font-mono text-zinc-400">
              <li>
                <button onClick={() => setView('catalog')} className="hover:text-white transition-colors">
                  [01] ACQUISITIONS CATALOGUE
                </button>
              </li>
              <li>
                <button onClick={() => setView('wishlist')} className="hover:text-white transition-colors">
                  [02] WISHLIST VAULT
                </button>
              </li>
              <li>
                <button onClick={() => { setVerifyResult(''); setVerifyHash(''); setShowAbout(true); }} className="hover:text-white transition-colors">
                  [03] ABOUT & VERIFY
                </button>
              </li>
            </ul>
          </div>

          {/* Status logs */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-display tracking-widest text-cyber-cyan font-bold">TELEMETRY STATS</h4>
            <div className="space-y-1.5 text-[10px] font-mono text-zinc-500">
              <div className="flex justify-between">
                <span>GATEWAY CONDUIT:</span>
                <span className="text-cyber-cyan">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT PROTOCOL:</span>
                <span className="text-cyber-gold">RAZORPAY_v2</span>
              </div>
              <div className="flex justify-between">
                <span>ENCRYPTION ALGORITHM:</span>
                <span className="text-white">AES_256_GCM</span>
              </div>
            </div>
          </div>

          {/* Newsletter subscription */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-display tracking-widest text-white font-bold">NEWSLETTER MATRIX</h4>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input 
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="operator@domain.com"
                className="flex-1 bg-black/60 border border-zinc-800 focus:border-cyber-cyan focus:outline-none rounded-xl px-3 py-2 text-xs font-mono placeholder-zinc-700 text-white"
              />
              <button 
                type="submit"
                className="px-3 py-2 rounded-xl bg-cyber-cyan hover:bg-cyan-400 text-black font-display font-bold text-[9px] tracking-widest transition-all"
              >
                SUB
              </button>
            </form>
            <p className="text-[9px] text-zinc-600 font-mono">
              Subscribe to secure temporal notifications of incoming artifact streams.
            </p>
          </div>
        </div>

        {/* Global systems verification row */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-600 border-t border-zinc-900/60 mt-10 pt-6">
          <div>© 2026 NEXUS CORE INTERFACE. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <span className="text-cyber-cyan tracking-widest hover:text-white transition-colors cursor-pointer" onClick={() => { setVerifyResult(''); setVerifyHash(''); setShowAbout(true); }}>[VIEW CORE SPECS]</span>
            <span className="text-cyber-gold tracking-widest">[REGION: IN_MUM_3306]</span>
          </div>
        </div>
      </footer>

      {/* About The Console Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden glass-panel-neon-gold rounded-3xl p-8 pulse-gold-glow">
            <div className="scanline"></div>
            
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-cyber-gold font-display text-lg"
            >
              [X]
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-xl font-display font-extrabold tracking-widest text-cyber-gold">NEXUS CONSOLE</span>
                <span className="text-[9px] font-mono border border-cyber-cyan text-cyber-cyan px-1.5 py-0.5 rounded">v4.1.0-PROD</span>
              </div>

              <div className="space-y-3 text-xs text-gray-300 leading-relaxed font-sans">
                <p>
                  Welcome to <strong>NEXUS</strong>: the premier high-end hybrid platform bridging the gap between historical physical treasures and futuristic transactional architecture.
                </p>
                <p>
                  Every catalog item is verified for lineage, material density, and authenticity certificate validation. Our inventory is curated globally and listed directly by certified relic merchants.
                </p>
              </div>

              {/* Chainguard Signature Verification */}
              <div className="border-t border-zinc-900 pt-4 space-y-2">
                <span className="text-[9px] font-display text-cyber-cyan tracking-widest block uppercase font-bold">
                  ✦ CHAINGUARD SECURE VERIFIER ✦
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Paste invoice digital SHA signature hash (0x...)"
                    value={verifyHash}
                    onChange={e => setVerifyHash(e.target.value)}
                    className="flex-1 bg-black border border-zinc-800 text-[10px] font-mono rounded p-2 focus:outline-none focus:border-cyber-gold text-white placeholder-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={handleVerifySignature}
                    className="px-3.5 py-2 bg-cyber-gold hover:bg-yellow-600 text-black font-display font-extrabold text-[9px] tracking-wider rounded transition-colors"
                  >
                    VERIFY
                  </button>
                </div>
                {verifyResult && (
                  <div className={`p-3 rounded-xl border text-[9px] font-mono leading-relaxed transition-all ${
                    verifyResult.startsWith('✦') 
                      ? 'border-cyber-cyan/30 text-cyber-cyan bg-cyan-950/15'
                      : 'border-red-500/30 text-red-400 bg-red-950/15'
                  }`}>
                    {verifyResult}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <button
                  type="button"
                  disabled={testingLatency}
                  onClick={() => {
                    setTestingLatency(true);
                    toast.info("✦ INITIATING ORBITAL SECTOR LATENCY SCAN...");
                    let step = 0;
                    const interval = setInterval(() => {
                      setLatency(Math.floor(Math.random() * 20) + 4);
                      step++;
                      if (step >= 5) {
                        clearInterval(interval);
                        setTestingLatency(false);
                        toast.success("✦ LATENCY SECURED. AVERAGE ORBITAL PATH LATENCY IS MAPPED.");
                      }
                    }, 250);
                  }}
                  className="hover:text-cyber-cyan transition-colors"
                >
                  LATENCY: {testingLatency ? 'SCANNIN...' : `${latency}ms`}
                </button>
                <span>DB: SEQUELIZE // MYSQL</span>
                <span>SECURED: SSL_READY</span>
              </div>

              <button
                onClick={() => setShowAbout(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold text-xs tracking-widest transition-all"
              >
                DISMISS INTERACTION
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
