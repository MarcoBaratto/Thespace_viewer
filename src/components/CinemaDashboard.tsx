'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, Clock, Film, MonitorPlay, Globe, ArrowLeft, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface SessionAttribute {
  name: string;
  value: string;
  attributeType: string;
}

interface Session {
  sessionId: string;
  startTime: string;
  endTime: string;
  screenName: string;
  attributes: SessionAttribute[];
  isSoldOut: boolean;
  bookingUrl: string;
  isBookingAvailable: boolean;
}

interface ShowingGroup {
  date: string;
  sessions: Session[];
}

interface Movie {
  filmId: string;
  filmTitle: string;
  posterImageSrc: string;
  synopsisShort: string;
  runningTime: number;
  showingGroups: ShowingGroup[];
}

const isSessionOriginalLanguage = (attributes: SessionAttribute[]) => {
  const langAttr = attributes?.find(a => a.attributeType === 'Language');
  return !!(langAttr?.value?.toLowerCase().includes('original') || langAttr?.name?.toLowerCase().includes('v.o.'));
};

export default function CinemaDashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'movie' | 'time' | 'catalog'>('movie');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectMovie = (id: string | null) => {
    if (id) {
      window.history.pushState(null, '', `#${id}`);
      setSelectedMovieId(id);
    } else {
      window.history.pushState(null, '', window.location.pathname);
      setSelectedMovieId(null);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setSelectedMovieId(hash || null);
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/schedule`);
        const data = await res.json();
        if (data && Array.isArray(data.result)) {
          setAllMovies(data.result);
        } else if (Array.isArray(data)) {
          setAllMovies(data);
        } else {
          setAllMovies([]);
        }
      } catch (err) {
        console.error('Failed to fetch schedule', err);
        setAllMovies([]);
      }
      setLoading(false);
    };

    fetchSchedule();
  }, []);

  // Filter movies for the currently selected date
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const moviesForSelectedDate = allMovies.map(movie => {
    // Find the showing group for the selected date
    const groupForDate = movie.showingGroups?.find(g => g.date.startsWith(dateStr));
    if (groupForDate && groupForDate.sessions.length > 0) {
      return {
        ...movie,
        showingGroups: [groupForDate] // Only keep this date's group for rendering
      };
    }
    return null;
  }).filter(Boolean) as Movie[];

  // Extract all unique dates from the API data, fallback to today if empty
  const dateSet = new Set<string>();
  allMovies.forEach(m => {
    m.showingGroups?.forEach(g => {
      if (g.sessions && g.sessions.length > 0) {
        dateSet.add(g.date);
      }
    });
  });
  
  let dates = Array.from(dateSet).sort().map(dStr => new Date(dStr));
  if (dates.length === 0) {
    dates = [new Date()];
  }

  // Extract all sessions for timeline view
  const allSessions = moviesForSelectedDate.flatMap(movie => 
    movie.showingGroups.flatMap(group => 
      group.sessions.map(session => ({
        ...session,
        movieId: movie.filmId,
        movieTitle: movie.filmTitle,
        poster: movie.posterImageSrc,
        duration: movie.runningTime,
      }))
    )
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const getLanguageBadge = (attributes: SessionAttribute[]) => {
    if (isSessionOriginalLanguage(attributes)) {
      return <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-emerald-500/30"><Globe size={10} /> V.O.</span>;
    }
    const langAttr = attributes?.find(a => a.attributeType === 'Language');
    return <span className="inline-flex items-center gap-1 bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-white/10">{langAttr?.value || 'ITA'}</span>;
  };

  const selectedMovie = selectedMovieId ? allMovies.find(m => m.filmId === selectedMovieId) : null;

  const renderModal = () => {
    if (!selectedSala) return null;
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedSala(null)}>
        <div className="bg-[#18181b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
            <h2 className="font-bold text-lg text-white">Mappa: {selectedSala}</h2>
            <button onClick={() => setSelectedSala(null)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-black p-4 flex justify-center items-center">
            <img src={`/seats/${selectedSala.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png?v=3`} alt={`Mappa ${selectedSala}`} className="max-w-full h-auto rounded-lg shadow-2xl border border-white/5" />
          </div>
        </div>
      </div>
    );
  };

  if (selectedMovie) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-12 font-sans selection:bg-amber-500/30">
        {renderModal()}
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shadow-lg px-4 py-4">
          <div className="max-w-5xl mx-auto flex items-center">
            <button 
              onClick={() => handleSelectMovie(null)}
              className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              <ArrowLeft size={20} /> Torna alla programmazione
            </button>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/5 overflow-hidden flex flex-col sm:flex-row mb-12">
            <div className="w-full sm:w-1/3 aspect-[2/3] sm:aspect-auto relative bg-black shrink-0">
              <img 
                src={selectedMovie.posterImageSrc} 
                alt={selectedMovie.filmTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent sm:bg-gradient-to-r"></div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-center relative z-10">
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3 tracking-tight">{selectedMovie.filmTitle}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 font-medium">
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-amber-500"/> {selectedMovie.runningTime} min</span>
                {selectedMovie.showingGroups?.some(g => g.sessions.some(s => isSessionOriginalLanguage(s.attributes))) && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[11px] px-2.5 py-1 rounded uppercase tracking-wider font-semibold border border-emerald-500/30">
                    <Globe size={12} /> Versione Originale
                  </span>
                )}
              </div>
              <p className="text-base text-gray-300 leading-relaxed mb-6">
                {selectedMovie.synopsisShort || "Nessuna trama disponibile."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <Calendar className="text-amber-500" size={24} />
            <h2 className="text-2xl font-bold text-white tracking-tight">Programmazione Completa</h2>
          </div>
          
          <div className="space-y-6">
            {selectedMovie.showingGroups?.filter(g => g.sessions.length > 0).map(group => (
              <div key={group.date} className="bg-[#141414] rounded-2xl shadow-lg border border-white/5 p-6">
                <h3 className="font-bold text-xl text-white border-b border-white/10 pb-4 mb-6 capitalize tracking-wide flex items-center">
                  {format(new Date(group.date), 'EEEE dd MMMM', { locale: it })}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {group.sessions.map(session => (
                    <a 
                      key={session.sessionId} 
                      href={session.isBookingAvailable && session.bookingUrl ? `https://www.thespacecinema.it${session.bookingUrl}` : '#'}
                      target={session.isBookingAvailable && session.bookingUrl ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300
                        ${session.isSoldOut ? 'opacity-40 cursor-not-allowed bg-white/5 border-transparent' : 'border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1'}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-white tracking-tighter">{format(new Date(session.startTime), 'HH:mm')}</span>
                        {session.endTime && (
                          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">fine {format(new Date(session.endTime), 'HH:mm')}</span>
                        )}
                      </div>
                      <div 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSala(session.screenName); }}
                        className="text-[11px] font-semibold text-gray-400 hover:text-amber-400 flex items-center gap-1 mt-3 transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        <MonitorPlay size={12} /> {session.screenName.replace('Sala ', '')}
                      </div>
                      <div className="mt-3">
                        {getLanguageBadge(session.attributes)}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            {(!selectedMovie.showingGroups || selectedMovie.showingGroups.length === 0) && (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center text-gray-500 font-medium">
                Nessuno spettacolo in programma attualmente.
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-12 font-sans selection:bg-amber-500/30">
      {renderModal()}
      {/* Header & Date Selector (Sticky) */}
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
                >
                  <ChevronLeft size={20} />
                </button>
                <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-2 max-w-full no-scrollbar scroll-smooth snap-x">
                  {dates.map(d => {
                    const isSelected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => setDate(d)}
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
              onClick={() => setViewMode('movie')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'movie' ? 'bg-[#2a2a2e] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Vista per Film
            </button>
            <button
              onClick={() => setViewMode('time')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'time' ? 'bg-[#2a2a2e] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Vista Oraria
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'catalog' ? 'bg-[#2a2a2e] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Catalogo
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-amber-500"></div>
            <p className="text-amber-500/80 font-medium tracking-widest uppercase text-sm animate-pulse">Caricamento...</p>
          </div>
        ) : viewMode === 'catalog' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {allMovies.map(movie => {
              const firstGroup = movie.showingGroups?.find(g => g.sessions && g.sessions.length > 0);
              const firstDateStr = firstGroup ? format(new Date(firstGroup.date), 'd MMM', { locale: it }) : null;
              
              return (
                <button 
                  key={movie.filmId}
                  onClick={() => handleSelectMovie(movie.filmId)}
                  className="bg-[#141414] rounded-2xl shadow-lg border border-white/5 overflow-hidden flex flex-col text-left hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all duration-500 group flex-1 h-full hover:-translate-y-1"
                >
                  <div className="w-full aspect-[2/3] relative bg-black shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
                    <img 
                      src={movie.posterImageSrc} 
                      alt={movie.filmTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1 relative z-20 bg-[#141414]">
                    <h3 className="font-bold text-sm text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">{movie.filmTitle}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      {firstDateStr && (
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          Dal {firstDateStr}
                        </div>
                      )}
                      {movie.showingGroups?.some(g => g.sessions.some(s => isSessionOriginalLanguage(s.attributes))) && (
                        <div className="inline-flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                          <Globe size={10} /> V.O. Disponibile
                        </div>
                      )}
                    </div>
                    <div className="mt-auto pt-3 flex items-center text-xs text-amber-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      Vedi <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : moviesForSelectedDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500 bg-[#141414] rounded-3xl border border-white/5">
            <Film size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Nessuna programmazione trovata per la data selezionata.</p>
          </div>
        ) : viewMode === 'movie' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {moviesForSelectedDate.map(movie => (
              <div key={movie.filmId} className="bg-[#141414] rounded-2xl shadow-xl border border-white/5 overflow-hidden flex flex-row hover:border-white/10 transition-colors group">
                <div className="w-[120px] sm:w-[160px] relative bg-black shrink-0 overflow-hidden">
                  <img 
                    src={movie.posterImageSrc} 
                    alt={movie.filmTitle}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-700"
                    onClick={() => handleSelectMovie(movie.filmId)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#141414] pointer-events-none"></div>
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col z-10 -ml-2">
                  <h2 
                    className="text-xl font-black text-white leading-tight mb-2 cursor-pointer hover:text-amber-400 transition-colors line-clamp-2"
                    onClick={() => handleSelectMovie(movie.filmId)}
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
                        href={session.isBookingAvailable && session.bookingUrl ? `https://www.thespacecinema.it${session.bookingUrl}` : '#'}
                        target={session.isBookingAvailable && session.bookingUrl ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className={`border rounded-xl p-2.5 flex flex-col items-center justify-center transition-all duration-300
                          ${session.isSoldOut ? 'opacity-40 cursor-not-allowed bg-white/5 border-transparent' : 'border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer hover:-translate-y-0.5 shadow-sm'}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white tracking-tighter">{format(new Date(session.startTime), 'HH:mm')}</span>
                        </div>
                        <div 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSala(session.screenName); }}
                          className="text-[10px] font-bold text-gray-400 hover:text-amber-400 flex items-center gap-1 mt-2 transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          <MonitorPlay size={10} /> {session.screenName.replace('Sala ', '')}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {allSessions.map(session => (
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
                  className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden shrink-0 hidden sm:block cursor-pointer shadow-md"
                  onClick={() => handleSelectMovie(session.movieId)}
                >
                  <img src={session.poster} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-black text-lg sm:text-xl text-white leading-tight cursor-pointer hover:text-amber-400 transition-colors truncate"
                    onClick={() => handleSelectMovie(session.movieId)}
                  >
                    {session.movieTitle}
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 items-center">
                    <span 
                      onClick={() => setSelectedSala(session.screenName)}
                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer uppercase tracking-wider border border-white/5"
                    >
                      <MonitorPlay size={12} /> {session.screenName}
                    </span>
                    {getLanguageBadge(session.attributes)}
                  </div>
                </div>

                <a 
                  href={session.isBookingAvailable && session.bookingUrl ? `https://www.thespacecinema.it${session.bookingUrl}` : '#'}
                  target={session.isBookingAvailable && session.bookingUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`ml-auto px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shrink-0 uppercase tracking-widest
                    ${session.isSoldOut ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]'}`}
                >
                  Acquista
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

