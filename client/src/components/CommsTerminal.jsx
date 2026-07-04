import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

export function CommsTerminal({ isOpen, onClose, user }) {
  const toast = useToast();
  const [activeChannel, setActiveChannel] = useState('Valuation Expert');
  const [messageText, setMessageText] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Default greetings mapped by channel
  const greetings = {
    'Valuation Expert': [
      { sender: 'AI', text: '✦ VALUATION PROTOCOL ACTIVE. Scan relic or quote details for instant Smart Valuation estimation.', time: new Date() }
    ],
    'Logistics Officer': [
      { sender: 'AI', text: '✦ LOGISTICS CHANNEL LINKED. Quote Order/Invoice ID for drop coordinates and reentry pod status.', time: new Date() }
    ],
    'Vault Overseer': [
      { sender: 'AI', text: '✦ OVERSEER PROTOCOL ATTACHED. I monitor system roles, database seed integrity, and security latencies.', time: new Date() }
    ]
  };

  // State mapping message logs for each channel
  const [logs, setLogs] = useState({
    'Valuation Expert': greetings['Valuation Expert'],
    'Logistics Officer': greetings['Logistics Officer'],
    'Vault Overseer': greetings['Vault Overseer']
  });

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeChannel, typing]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const userMessage = {
      sender: 'USER',
      text: messageText,
      time: new Date()
    };

    // Update active logs
    const updatedChannelLogs = [...logs[activeChannel], userMessage];
    setLogs(prev => ({
      ...prev,
      [activeChannel]: updatedChannelLogs
    }));

    const query = messageText.toLowerCase();
    setMessageText('');
    setTyping(true);

    // Simulated reply trigger
    setTimeout(() => {
      let aiText = '';
      if (activeChannel === 'Valuation Expert') {
        if (query.includes('ring') || query.includes('emerald')) {
          aiText = '✦ ANALYSIS COMPLETE: Victorian Royal Emerald Ring reserve is calculated at ₹1,25,000.00. Current bid projection exhibits high interest (+12.4% over reserve).';
        } else if (query.includes('watch') || query.includes('chronometer')) {
          aiText = '✦ ANALYSIS COMPLETE: Astral Chronometer Pocket Watch Swiss lever mechanism maintains active sync. Reserve: ₹45,000.00. Valuation stable.';
        } else if (query.includes('bust') || query.includes('roman')) {
          aiText = '✦ ANALYSIS COMPLETE: Imperial Roman Bronze Bust maintains authentic 2nd-century molecular signature. Preserved under levitation. Est. Valuation: ₹2,90,000.00.';
        } else if (query.includes('how much') || query.includes('worth') || query.includes('price')) {
          aiText = '✦ REGISTRY LOOKUP: Standard valuation fluctuates based on verified historical density and certificate validation. Use [INSPECT] inside the catalogue for exact valuation specs.';
        } else {
          aiText = '✦ VALUATION QUERY RECEIVED: Relic specs parsed. Initial evaluation projects stable transaction values. Please verify certificate indices for detailed line verification.';
        }
      } else if (activeChannel === 'Logistics Officer') {
        if (query.includes('track') || query.includes('where') || query.includes('order') || query.includes('invoice')) {
          aiText = '✦ SCANNING ORBITAL SECTOR: Active shipment timeline indicates transit. Standard Drones are unencrypted, while Priority Orbital Drop is tracked under pressurized reentry coordinates.';
        } else if (query.includes('shipping') || query.includes('fee') || query.includes('cost')) {
          aiText = '✦ PROTOCOL DETAILS: Standard Drone delivery is Free. Priority Orbital Dropship costs ₹2,500. Secured Armed Convoy is calculated at ₹9,500.';
        } else {
          aiText = '✦ LOGISTICS TELEMETRY: System link verified. Please monitor the visual order tracking timeline under [MY ACQUISITION CONSOLE] for shipping log notes updates.';
        }
      } else { // Vault Overseer
        if (query.includes('reset') || query.includes('maintenance') || query.includes('seed')) {
          aiText = '✦ VAULT INSTRUCTIONS: Administrators can reset the live database directly from the Overlord dashboard maintenance console, automatically re-syncing Sequelize schemas.';
        } else if (query.includes('role') || query.includes('credentials')) {
          aiText = '✦ SECURITY LEVEL: Platform access roles mapped: Customer, Seller, Logistics Manager, and Admin. Override keys reside under central Admin controls.';
        } else {
          aiText = '✦ SYSTEM OVERSEER: Status link active. Latency: 14ms. Database: Sequelize/MySQL. Security locks: Aes-256-Gcm enabled.';
        }
      }

      const aiMessage = {
        sender: 'AI',
        text: aiText,
        time: new Date()
      };

      setLogs(prev => ({
        ...prev,
        [activeChannel]: [...prev[activeChannel], aiMessage]
      }));
      setTyping(false);
      toast.info('Incoming neural transmission received.');
    }, 1500);
  };

  const currentMessages = logs[activeChannel] || [];

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-black/95 backdrop-blur-md border-l border-zinc-900 shadow-2xl transition-transform duration-500 flex flex-col ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Scanline overlay */}
      <div className="scanline pointer-events-none"></div>

      {/* Header */}
      <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/40">
        <div>
          <h3 className="text-sm font-display font-extrabold text-cyber-gold tracking-widest flex items-center gap-2">
            NEURAL COMMS TERMINAL
          </h3>
          <p className="text-[8px] font-mono text-cyber-cyan tracking-wider flex items-center gap-1.5 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-pulse"></span>
            ENCRYPTED LINK // ACTIVE
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-cyber-gold font-display text-sm hover:rotate-90 transition-all duration-300"
        >
          [CLOSE]
        </button>
      </div>

      {/* Active Channels selection */}
      <div className="grid grid-cols-3 border-b border-zinc-900 text-[9px] font-display font-bold tracking-wider uppercase text-center bg-zinc-950/40">
        {Object.keys(logs).map(channel => (
          <button
            key={channel}
            onClick={() => setActiveChannel(channel)}
            className={`py-3.5 border-r border-zinc-900/60 last:border-0 transition-all ${
              activeChannel === channel 
                ? 'text-cyber-cyan bg-cyan-950/10 border-b border-b-cyber-cyan' 
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {channel.split(' ')[0]} AGENT
          </button>
        ))}
      </div>

      {/* Messages Logs Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {currentMessages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'USER' ? 'ml-auto items-end animate-slide-in-right' : 'items-start animate-fade-in'
            }`}
          >
            {/* Header */}
            <span className="text-[8px] font-mono text-zinc-500 mb-1">
              {msg.sender === 'USER' ? user?.name?.toUpperCase() : `${activeChannel.toUpperCase()} // SYS`} • {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Body bubble */}
            <div className={`p-3 rounded-2xl text-xs leading-relaxed font-mono ${
              msg.sender === 'USER' 
                ? 'bg-cyber-cyan/10 border border-cyber-cyan/35 text-white' 
                : 'bg-zinc-900/50 border border-zinc-850 text-gray-300'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex flex-col items-start max-w-[85%] animate-pulse">
            <span className="text-[8px] font-mono text-zinc-500 mb-1">{activeChannel.toUpperCase()} is writing...</span>
            <div className="p-3 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-[10px] font-mono text-cyber-cyan">
              DECRYPTING NEURAL DATA TRANSMISSION...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Submit */}
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-900 bg-black/40 flex gap-2">
        <input 
          type="text"
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          placeholder={`Broadcast query to ${activeChannel}...`}
          className="flex-1 bg-black border border-zinc-800 focus:border-cyber-cyan text-xs font-mono rounded-xl p-3 focus:outline-none placeholder-zinc-800 text-white"
        />
        <button
          type="submit"
          disabled={!messageText.trim() || typing}
          className="px-5 py-3 bg-cyber-cyan hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyber-cyan text-black font-display font-extrabold text-[10px] tracking-widest rounded-xl transition-all"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
