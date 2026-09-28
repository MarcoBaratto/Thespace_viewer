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
    const langAttr = attributes.find(a => a.attributeType === 'Language');
    const isOriginal = langAttr?.value.toLowerCase().includes('original') || langAttr?.name.toLowerCase().includes('v.o.');
    
    if (isOriginal) {
      return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium border border-green-200"><Globe size={12} /> V.O.</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium border border-gray-200">{langAttr?.value || 'ITA'}</span>;
  };

  const selectedMovie = selectedMovieId ? allMovies.find(m => m.filmId === selectedMovieId) : null;

  const renderModal = () => {
    if (!selectedSala) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedSala(null)}>
        <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-lg">Mappa: {selectedSala}</h2>
            <button onClick={() => setSelectedSala(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-gray-800 p-4 flex justify-center items-center">
            <img src={`/seats/${selectedSala.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png?v=3`} alt={`Mappa ${selectedSala}`} className="max-w-full h-auto bg-white rounded shadow-sm" />
          </div>
        </div>
      </div>
    );
  };

  if (selectedMovie) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
        {renderModal()}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-4">
          <div className="max-w-5xl mx-auto flex items-center">
            <button 
              onClick={() => handleSelectMovie(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <ArrowLeft size={20} /> Torna alla programmazione
            </button>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col sm:flex-row mb-8">
            <div className="w-full sm:w-1/3 aspect-[2/3] sm:aspect-auto relative bg-gray-100 shrink-0">
              <img 
                src={selectedMovie.posterImageSrc} 
                alt={selectedMovie.filmTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h1 className="text-2xl font-bold leading-tight mb-2">{selectedMovie.filmTitle}</h1>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                <Clock size={14} /> {selectedMovie.runningTime} min
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                {selectedMovie.synopsisShort || "Nessuna trama disponibile."}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar size={20} /> Programmazione Completa</h2>
          
          <div className="space-y-6">
            {selectedMovie.showingGroups?.filter(g => g.sessions.length > 0).map(group => (
              <div key={group.date} className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-lg border-b pb-2 mb-4 capitalize">
                  {format(new Date(group.date), 'EEEE dd MMMM', { locale: it })}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {group.sessions.map(session => (
                    <a 
                      key={session.sessionId} 
                      href={session.isBookingAvailable && session.bookingUrl ? `https://www.thespacecinema.it${session.bookingUrl}` : '#'}
                      target={session.isBookingAvailable && session.bookingUrl ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`border rounded-lg p-2 flex flex-col items-center justify-center transition-colors
                        ${session.isSoldOut ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer'}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold leading-none">{format(new Date(session.startTime), 'HH:mm')}</span>
                        {session.endTime && (
                          <span className="text-[10px] text-gray-500 mt-1">fine {format(new Date(session.endTime), 'HH:mm')}</span>
                        )}
                      </div>
                      <div 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSala(session.screenName); }}
                        className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                      >
                        <MonitorPlay size={10} /> {session.screenName.replace('Sala ', '')}
                      </div>
                      <div className="mt-2">
                        {getLanguageBadge(session.attributes)}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            {(!selectedMovie.showingGroups || selectedMovie.showingGroups.length === 0) && (
              <p className="text-gray-500 italic">Nessuno spettacolo in programma attualmente.</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {renderModal()}
      {/* Header & Date Selector (Sticky) */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Film className="text-blue-600" />
              The Space Cinema <span className="text-gray-500 font-normal">| Cerro Maggiore</span>
            </h1>
            
            {viewMode !== 'catalog' && (
              <div className="flex items-center gap-1 max-w-[calc(100vw-32px)] sm:max-w-md md:max-w-xl lg:max-w-2xl">
                <button 
                  onClick={() => scroll('left')}
                  className="p-1 rounded-full bg-gray-50 hover:bg-gray-200 text-gray-600 hidden sm:flex shrink-0 shadow-sm border"
                >
                  <ChevronLeft size={20} />
                </button>
                <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar scroll-smooth snap-x">
                  {dates.map(d => {
                    const isSelected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => setDate(d)}
                        className={`flex flex-col items-center min-w-[72px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap snap-start
                          ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        <span className="text-xs font-semibold uppercase">{format(d, 'EEE', { locale: it })}</span>
                        <span className="text-lg font-bold">{format(d, 'dd')}</span>
                        <span className="text-[10px]">{format(d, 'MMM', { locale: it })}</span>
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => scroll('right')}
                  className="p-1 rounded-full bg-gray-50 hover:bg-gray-200 text-gray-600 hidden sm:flex shrink-0 shadow-sm border"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-center sm:justify-start">
          <div className="inline-flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('movie')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'movie' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Vista per Film
            </button>
            <button
              onClick={() => setViewMode('time')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'time' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Vista Oraria
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'catalog' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Catalogo Completo
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'catalog' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allMovies.map(movie => {
              const firstGroup = movie.showingGroups?.find(g => g.sessions && g.sessions.length > 0);
              const firstDateStr = firstGroup ? format(new Date(firstGroup.date), 'd MMM', { locale: it }) : null;
              
              return (
                <button 
                  key={movie.filmId}
                  onClick={() => handleSelectMovie(movie.filmId)}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col text-left hover:shadow-md hover:border-blue-300 transition-all group flex-1 h-full"
                >
                  <div className="w-full aspect-[2/3] relative bg-gray-100 shrink-0">
                    <img 
                      src={movie.posterImageSrc} 
                      alt={movie.filmTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{movie.filmTitle}</h3>
                    {firstDateStr && (
                      <div className="mt-1 text-[11px] text-gray-500 font-medium">
                        Dal {firstDateStr}
                      </div>
                    )}
                    <div className="mt-auto pt-2 flex items-center text-xs text-blue-600 font-medium">
                      Programmazione <ChevronRight size={12} className="ml-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : moviesForSelectedDate.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Nessuna programmazione trovata per questa data.
          </div>
        ) : viewMode === 'movie' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moviesForSelectedDate.map(movie => (
              <div key={movie.filmId} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-row">
                <div className="w-[100px] sm:w-1/3 relative bg-gray-100 shrink-0">
                  <img 
                    src={movie.posterImageSrc} 
                    alt={movie.filmTitle}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleSelectMovie(movie.filmId)}
                  />
                </div>
                <div className="p-3 sm:p-5 flex-1 flex flex-col">
                  <h2 
                    className="text-lg font-bold leading-tight mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSelectMovie(movie.filmId)}
                  >
                    {movie.filmTitle}
                  </h2>
                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <Clock size={12} /> {movie.runningTime} min
                  </p>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 content-start">
                    {movie.showingGroups[0].sessions.map(session => (
                      <a 
                        key={session.sessionId} 
                        href={session.isBookingAvailable && session.bookingUrl ? `https://www.thespacecinema.it${session.bookingUrl}` : '#'}
                        target={session.isBookingAvailable && session.bookingUrl ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className={`border rounded-lg p-2 flex flex-col items-center justify-center transition-colors
                          ${session.isSoldOut ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer'}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold leading-none">{format(new Date(session.startTime), 'HH:mm')}</span>
                          {session.endTime && (
                            <span className="text-[10px] text-gray-500 mt-1">fine {format(new Date(session.endTime), 'HH:mm')}</span>
                          )}
                        </div>
                        <div 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSala(session.screenName); }}
                          className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                        >
                          <MonitorPlay size={10} /> {session.screenName.replace('Sala ', '')}
                        </div>
                        <div className="mt-2">
                          {getLanguageBadge(session.attributes)}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {allSessions.map(session => (
              <div key={session.sessionId} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                <div className="text-center min-w-[70px]">
                  <div className="text-2xl font-bold text-blue-600 leading-none">{format(new Date(session.startTime), 'HH:mm')}</div>
                  {session.endTime ? (
                    <div className="text-[11px] text-gray-500 mt-1">- {format(new Date(session.endTime), 'HH:mm')}</div>
                  ) : (
                    <div className="text-[11px] text-gray-500 mt-1">Inizio</div>
                  )}
                </div>
                
                <div 
                  className="w-12 h-16 rounded overflow-hidden shrink-0 hidden sm:block cursor-pointer"
                  onClick={() => handleSelectMovie(session.movieId)}
                >
                  <img src={session.poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                
                <div className="flex-1">
                  <h3 
                    className="font-bold text-lg leading-tight cursor-pointer hover:text-blue-600 transition-colors inline-block"
                    onClick={() => handleSelectMovie(session.movieId)}
                  >
                    {session.movieTitle}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span 
                      onClick={() => setSelectedSala(session.screenName)}
                      className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-medium transition-colors cursor-pointer"
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
                  className={`ml-auto px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors shrink-0
                    ${session.isSoldOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
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
