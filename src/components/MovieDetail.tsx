'use client';

import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Clock, Globe, ArrowLeft, Calendar, MonitorPlay, Star } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '../types';
import { isSessionOriginalLanguage, getLanguageBadge } from '../utils/helpers';

interface MovieDetailProps {
  movie: Movie;
  onBack: () => void;
  onSelectSala: (sala: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export default function MovieDetail({ movie, onBack, onSelectSala, isFavorite, onToggleFavorite }: MovieDetailProps) {
  return (
    <>
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shadow-lg px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-semibold transition-colors"
          >
            <ArrowLeft size={20} /> Torna alla programmazione
          </button>
          
          <button 
            onClick={(e) => onToggleFavorite(movie.filmId, e)}
            className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold transition-colors"
          >
            <Star size={20} className={isFavorite ? "text-amber-500 fill-amber-500" : ""} /> 
            <span className="hidden sm:inline">{isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/5 overflow-hidden flex flex-col sm:flex-row mb-12">
          <div className="w-full sm:w-1/3 aspect-[2/3] sm:aspect-auto relative bg-black shrink-0">
            <Image 
              src={movie.posterImageSrc} 
              alt={movie.filmTitle}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent sm:bg-gradient-to-r pointer-events-none"></div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center relative z-10">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3 tracking-tight">{movie.filmTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 font-medium">
              <span className="flex items-center gap-1.5"><Clock size={16} className="text-amber-500"/> {movie.runningTime} min</span>
              {movie.showingGroups?.some(g => g.sessions.some(s => isSessionOriginalLanguage(s.attributes))) && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[11px] px-2.5 py-1 rounded uppercase tracking-wider font-semibold border border-emerald-500/30">
                  <Globe size={12} /> Versione Originale
                </span>
              )}
            </div>
            <p className="text-base text-gray-300 leading-relaxed mb-6">
              {movie.synopsisShort || "Nessuna trama disponibile."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Calendar className="text-amber-500" size={24} />
          <h2 className="text-2xl font-bold text-white tracking-tight">Programmazione Completa</h2>
        </div>
        
        <div className="space-y-6">
          {movie.showingGroups?.filter(g => g.sessions.length > 0).map(group => (
            <div key={group.date} className="bg-[#141414] rounded-2xl shadow-lg border border-white/5 p-6">
              <h3 className="font-bold text-xl text-white border-b border-white/10 pb-4 mb-6 capitalize tracking-wide flex items-center">
                {format(new Date(group.date), 'EEEE dd MMMM', { locale: it })}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {group.sessions.map(session => (
                  <a 
                    key={session.sessionId} 
                    href={session.isBookingAvailable && session.bookingUrl && !session.isSoldOut ? `https://www.thespacecinema.it${session.bookingUrl}` : undefined}
                    target={session.isBookingAvailable && session.bookingUrl && !session.isSoldOut ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`border rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300
                      ${session.isSoldOut ? 'opacity-40 cursor-not-allowed bg-white/5 border-transparent' : 'border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1'}`}
                    onClick={(e) => {
                      if (session.isSoldOut) e.preventDefault();
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-white tracking-tighter">{format(new Date(session.startTime), 'HH:mm')}</span>
                      {session.endTime && (
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">fine {format(new Date(session.endTime), 'HH:mm')}</span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectSala(session.screenName); }}
                      className="text-[11px] font-semibold text-gray-400 hover:text-amber-400 flex items-center gap-1 mt-3 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      <MonitorPlay size={12} /> {session.screenName.replace('Sala ', '')}
                    </button>
                    <div className="mt-3">
                      {getLanguageBadge(session.attributes)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
          {(!movie.showingGroups || movie.showingGroups.length === 0) && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center text-gray-500 font-medium">
              Nessuno spettacolo in programma attualmente.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
