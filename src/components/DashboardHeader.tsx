'use client';

import React, { useRef } from 'react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardHeaderProps {
  dates: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  viewMode: 'movie' | 'time' | 'catalog';
  onChangeViewMode: (mode: 'movie' | 'time' | 'catalog') => void;
}

export default function DashboardHeader({ dates, selectedDate, onSelectDate, viewMode, onChangeViewMode }: DashboardHeaderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3">
            <div className="bg-amber-500 text-black p-1.5 rounded-lg"><Film size={24} /></div>
            THE SPACE <span className="text-gray-500 font-medium text-lg md:text-xl">| Cerro Maggiore</span>
          </h1>
          
          {viewMode !== 'catalog' && (
            <div className="flex items-center gap-2 max-w-[calc(100vw-32px)] md:max-w-2xl">
              <button 
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white hidden sm:flex items-center justify-center shrink-0 border border-white/10 transition-colors"
                aria-label="Scroll dates left"
              >
                <ChevronLeft size={20} />
              </button>
              <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-2 max-w-full no-scrollbar scroll-smooth snap-x">
                {dates.map(d => {
                  const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => onSelectDate(d)}
                      className={`flex flex-col items-center min-w-[76px] px-3 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap snap-start border
                        ${isSelected ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105' : 'bg-[#18181b] border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>{format(d, 'EEE', { locale: it })}</span>
                      <span className="text-2xl font-black leading-none my-1">{format(d, 'dd')}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>{format(d, 'MMM', { locale: it })}</span>
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white hidden sm:flex items-center justify-center shrink-0 border border-white/10 transition-colors"
                aria-label="Scroll dates right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="max-w-6xl mx-auto px-4 pb-4 flex justify-center md:justify-start">
        <div className="inline-flex bg-[#18181b] p-1.5 rounded-xl border border-white/5 shadow-inner">
          <button
            onClick={() => onChangeViewMode('movie')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'movie' ? 'bg-[#2a2a2e] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Vista per Film
          </button>
          <button
            onClick={() => onChangeViewMode('time')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'time' ? 'bg-[#2a2a2e] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Vista Oraria
          </button>
          <button
            onClick={() => onChangeViewMode('catalog')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'catalog' ? 'bg-[#2a2a2e] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Catalogo
          </button>
        </div>
      </div>
    </div>
  );
}
