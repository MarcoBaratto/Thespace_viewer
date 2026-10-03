'use client';

import React from 'react';
import { format } from 'date-fns';
import { Clock, MonitorPlay, Globe } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '../types';
import { getLanguageBadge, isSessionOriginalLanguage } from '../utils/helpers';

interface MovieGridProps {
  movies: Movie[];
  onSelectMovie: (id: string) => void;
  onSelectSala: (sala: string) => void;
}

export default function MovieGrid({ movies, onSelectMovie, onSelectSala }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500 bg-[#141414] rounded-3xl border border-white/5">
        <MonitorPlay size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Nessuna programmazione trovata per la data selezionata.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {movies.map(movie => (
        <div key={movie.filmId} className="bg-[#141414] rounded-2xl shadow-xl border border-white/5 overflow-hidden flex flex-row hover:border-white/10 transition-colors group">
          <div className="w-[120px] sm:w-[160px] relative bg-black shrink-0 overflow-hidden cursor-pointer" onClick={() => onSelectMovie(movie.filmId)}>
            <Image 
              src={movie.posterImageSrc} 
              alt={movie.filmTitle}
              fill
              sizes="(max-width: 640px) 120px, 160px"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#141414] pointer-events-none"></div>
          </div>
          <div className="p-5 sm:p-6 flex-1 flex flex-col z-10 -ml-2">
            <h2 
              className="text-xl font-black text-white leading-tight mb-2 cursor-pointer hover:text-amber-400 transition-colors line-clamp-2"
              onClick={() => onSelectMovie(movie.filmId)}
            >
              {movie.filmTitle}
            </h2>
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} className="text-amber-500/70" /> {movie.runningTime} MIN
              </p>
              {movie.showingGroups[0].sessions.some(s => isSessionOriginalLanguage(s.attributes)) && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-emerald-500/30">
                  <Globe size={10} /> V.O.
                </span>
              )}
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-3 content-start">
              {movie.showingGroups[0].sessions.map(session => (
                <a 
                  key={session.sessionId} 
                  href={session.isBookingAvailable && session.bookingUrl ? `https://www.thespacecinema.it${session.bookingUrl}` : undefined}
                  target={session.isBookingAvailable && session.bookingUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`border rounded-xl p-2.5 flex flex-col items-center justify-center transition-all duration-300
                    ${session.isSoldOut ? 'opacity-40 cursor-not-allowed bg-white/5 border-transparent' : 'border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer hover:-translate-y-0.5 shadow-sm'}`}
                  onClick={(e) => {
                    if (session.isSoldOut) e.preventDefault();
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-white tracking-tighter">{format(new Date(session.startTime), 'HH:mm')}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectSala(session.screenName); }}
                    className="text-[10px] font-bold text-gray-400 hover:text-amber-400 flex items-center gap-1 mt-2 transition-colors cursor-pointer uppercase tracking-wider"
                    aria-label={`View map for ${session.screenName}`}
                  >
                    <MonitorPlay size={10} /> {session.screenName.replace('Sala ', '')}
                  </button>
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
