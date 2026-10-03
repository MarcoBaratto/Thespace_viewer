'use client';

import React from 'react';
import { format } from 'date-fns';
import { MonitorPlay } from 'lucide-react';
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
        <div key={session.sessionId} className="bg-[#141414] rounded-2xl shadow-lg border border-white/5 p-4 sm:p-5 flex items-center gap-4 sm:gap-6 hover:border-white/10 transition-colors group">
          <div className="text-center min-w-[70px] sm:min-w-[90px]">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 leading-none tracking-tighter">{format(new Date(session.startTime), 'HH:mm')}</div>
            {session.endTime ? (
              <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 mt-2 uppercase tracking-widest">- {format(new Date(session.endTime), 'HH:mm')}</div>
            ) : (
              <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 mt-2 uppercase tracking-widest">Inizio</div>
            )}
          </div>
          
          <div 
            className="w-14 h-20 sm:w-16 sm:h-24 relative rounded-lg overflow-hidden shrink-0 hidden sm:block cursor-pointer shadow-md"
            onClick={() => onSelectMovie(session.movieId)}
          >
            <Image src={session.poster} alt={session.movieTitle} fill sizes="64px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="font-black text-lg sm:text-xl text-white leading-tight cursor-pointer hover:text-amber-400 transition-colors truncate"
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
            className={`ml-auto px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shrink-0 uppercase tracking-widest flex items-center justify-center
              ${session.isSoldOut ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]'}`}
            onClick={(e) => {
              if (session.isSoldOut) e.preventDefault();
            }}
          >
            Acquista
          </a>
        </div>
      ))}
    </div>
  );
}
