'use client';

import React from 'react';
import { format } from 'date-fns';
import { MonitorPlay, Ticket } from 'lucide-react';
import Image from 'next/image';
import { Session } from '../types';
import { getLanguageBadge } from '../utils/helpers';

interface ExtendedSession extends Session {
  movieId: string;
  movieTitle: string;
  poster: string;
  duration: number;
}

interface MovieTimelineProps {
  sessions: ExtendedSession[];
  onSelectMovie: (id: string) => void;
  onSelectSala: (sala: string) => void;
}

export default function MovieTimeline({ sessions, onSelectMovie, onSelectSala }: MovieTimelineProps) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {sessions.map(session => (
        <div key={session.sessionId} className="relative isolate overflow-hidden bg-[#141414] rounded-2xl shadow-lg border border-white/5 p-4 sm:p-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 sm:flex sm:gap-4 sm:gap-x-6 hover:border-white/10 transition-colors group">
          <div className="absolute inset-y-0 right-0 w-36 sm:w-48 overflow-hidden pointer-events-none" aria-hidden="true">
            <Image
              src={session.poster}
              alt=""
              fill
              sizes="192px"
              className="object-cover scale-110 opacity-100"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 14%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 14%)',
              }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="relative z-10 flex items-baseline justify-start sm:justify-center gap-1 min-w-0 sm:min-w-[120px] whitespace-nowrap">
            <span className="text-2xl sm:text-3xl font-black text-amber-500 leading-none tracking-tighter">{format(new Date(session.startTime), 'HH:mm')}</span>
            {session.endTime ? (
              <span className="text-[10px] sm:text-xs font-bold text-gray-500">- {format(new Date(session.endTime), 'HH:mm')}</span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">Inizio</span>
            )}
          </div>
          
          <div className="relative z-10 -translate-y-1 col-span-2 sm:col-span-1 sm:flex-1 min-w-0 pr-32 sm:pr-[10.75rem]">
            <h3 
              className="font-black text-lg sm:text-xl text-white leading-tight cursor-pointer hover:text-amber-400 transition-colors break-words"
              onClick={() => onSelectMovie(session.movieId)}
            >
              {session.movieTitle}
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 items-center">
              <button 
                onClick={() => onSelectSala(session.screenName)}
                className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer uppercase tracking-wider border border-white/5"
              >
                <MonitorPlay size={12} /> {session.screenName}
              </button>
              {getLanguageBadge(session.attributes)}
            </div>
          </div>

          <a 
            href={session.isBookingAvailable && session.bookingUrl && !session.isSoldOut ? `https://www.thespacecinema.it${session.bookingUrl}` : undefined}
            target={session.isBookingAvailable && session.bookingUrl && !session.isSoldOut ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-label={session.isSoldOut ? `${session.movieTitle}: non disponibile` : `Acquista i biglietti per ${session.movieTitle}`}
            title={session.isSoldOut ? 'Non disponibile' : 'Acquista i biglietti'}
            className={`relative z-10 col-start-2 row-start-1 ml-auto size-11 rounded-xl transition-all duration-300 shrink-0 flex items-center justify-center sm:static
              ${session.isSoldOut ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-black/45 border border-white/10 text-gray-200 hover:bg-black/65 hover:text-white hover:border-white/20'}`}
            onClick={(e) => {
              if (session.isSoldOut) e.preventDefault();
            }}
          >
            <Ticket size={15} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
      ))}
    </div>
  );
}
