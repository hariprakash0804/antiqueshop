import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const DEFAULT_HERO_SLIDES = [
  {
    title: 'TEMPORAL RELIC ACQUISITIONS',
    subtitle: 'NEXUS ARCHIVES',
    description: 'Declassification of ancient terrestrial matrices, encrypted via digital certificates & secure orbital delivery.',
    price: '₹45,000.00',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    color: 'border-cyber-cyan text-cyber-cyan'
  },
  {
    title: 'HOLOGRAPHIC EMERALD REGISTRY',
    subtitle: 'VAULTED JEWELRY',
    description: 'Securing premium, dense-carat structural assets from rare physical lineages mapped dynamically to local ledgers.',
    price: '₹1,25,000.00',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop',
    color: 'border-cyber-gold text-cyber-gold'
  },
  {
    title: 'VINTAGE CHRONOGRAPH TELEMETRY',
    subtitle: 'TEMPORAL CHRONOMETERS',
    description: 'Caliber precision watch designs that survived standard time dilation loops, fully restored and authenticated.',
    price: '₹2,90,000.00',
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=1200&auto=format&fit=crop',
    color: 'border-amber-500 text-amber-500'
  }
];

export function Hero({ onExploreClick }) {
  const [slides, setSlides] = useState(DEFAULT_HERO_SLIDES);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=3`);
        const data = await res.json();
        const prods = data.products || data;
        if (prods && prods.length > 0) {
          const formatted = prods.slice(0, 3).map((p, idx) => {
            const productImages = p.imageUrl ? p.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
            const mainImg = productImages[0] || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200';
            
            // Map colors based on index
            const colors = [
              'border-cyber-cyan text-cyber-cyan',
              'border-cyber-gold text-cyber-gold',
              'border-amber-500 text-amber-500'
            ];
            
            return {
              title: p.title.toUpperCase(),
              subtitle: `${p.category.toUpperCase()} CORE ASSET`,
              description: p.description,
              price: `₹${parseFloat(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              image: mainImg,
              color: colors[idx % 3]
            };
          });
          setSlides(formatted);
        }
      } catch (err) {
        console.error('Failed to load dynamic hero slides, using defaults:', err);
      }
    };

    fetchFeatured();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [slides]);

  const slide = slides[activeSlide] || DEFAULT_HERO_SLIDES[0];

  return (
    <div className="relative h-[480px] md:h-[550px] w-full overflow-hidden bg-black border-b border-zinc-900 flex items-center">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-40"></div>
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-gold/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Cybernetic Scanline Scan */}
      <div className="scanline"></div>

      {/* Background Slide Image */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out opacity-25">
        <img 
          src={slide.image} 
          alt={slide.title}
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark via-cyber-dark/80 to-transparent"></div>
      </div>

      {/* Content Console */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        <div className="space-y-6 animate-fade-in holo-flicker">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyber-gold animate-ping"></span>
            <span className="text-[10px] font-display tracking-[0.3em] text-cyber-gold">{slide.subtitle}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-black tracking-wider leading-tight">
            {slide.title}
          </h1>

          <p className="text-sm md:text-base text-gray-400 font-sans max-w-lg leading-relaxed line-clamp-3">
            {slide.description}
          </p>

          <div className="flex items-baseline gap-4 pt-2">
            <span className="text-xs text-gray-500 font-display">VALUATION:</span>
            <span className="text-2xl font-display font-extrabold text-cyber-gold">{slide.price}</span>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={onExploreClick}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyber-gold to-yellow-600 hover:from-yellow-600 hover:to-cyber-gold text-black font-display font-bold tracking-widest text-xs transition-all duration-300 transform active:scale-95 shadow-gold-glow"
            >
              LAUNCH EXPLORER
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeSlide ? 'w-8 bg-cyber-gold' : 'w-2.5 bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Display Side (Holographic Projection Mock) */}
        <div className="hidden md:flex justify-center items-center">
          <div className="relative w-80 h-80 rounded-full border border-zinc-800/80 flex items-center justify-center p-4">
            <div className="absolute inset-0 rounded-full border border-cyber-cyan/10 animate-spin" style={{ animationDuration: '30s' }}></div>
            <div className="absolute inset-4 rounded-full border border-cyber-gold/10 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}></div>

            <div className="relative w-full h-full rounded-full overflow-hidden border border-zinc-800 p-2 bg-black/60 pulse-gold-glow animate-pulse">
              <img 
                src={slide.image} 
                alt="Holo Projection"
                className="w-full h-full object-cover rounded-full filter sepia-[0.3] hue-rotate-15 saturate-150 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-cyan-950/15 pointer-events-none mix-blend-color-dodge"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
