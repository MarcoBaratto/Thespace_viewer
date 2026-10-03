'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Movie } from '../types';

import DashboardHeader from './DashboardHeader';
import MovieGrid from './MovieGrid';
import MovieTimeline from './MovieTimeline';
import MovieCatalog from './MovieCatalog';
import MovieDetail from './MovieDetail';
import SeatMapModal from './SeatMapModal';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CinemaDashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'movie' | 'time' | 'catalog'>('movie');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cinema_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites');
      }
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('cinema_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
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

  // Use SWR for data fetching
  const { data: apiData, error, isLoading } = useSWR('/api/schedule', fetcher, {
    revalidateOnFocus: false, // Prevents unnecessary refetches on tab focus given it's proxied
    dedupingInterval: 60000,
  });

  const allMovies: Movie[] = useMemo(() => {
    if (apiData && Array.isArray(apiData.result)) return apiData.result;
    if (Array.isArray(apiData)) return apiData;
    return [];
  }, [apiData]);

  // Extract all unique dates
  const dates = useMemo(() => {
    const dateSet = new Set<string>();
    allMovies.forEach(m => {
      m.showingGroups?.forEach(g => {
        if (g.sessions && g.sessions.length > 0) {
          dateSet.add(g.date);
        }
      });
    });
    
    let parsedDates = Array.from(dateSet).sort().map(dStr => new Date(dStr));
    if (parsedDates.length === 0) {
      parsedDates = [new Date()];
    }
    return parsedDates;
  }, [allMovies]);

  // Filter movies for the currently selected date
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const moviesForSelectedDate = useMemo(() => {
    const filtered = allMovies.map(movie => {
      const groupForDate = movie.showingGroups?.find(g => g.date.startsWith(dateStr));
      if (groupForDate && groupForDate.sessions.length > 0) {
        return {
          ...movie,
          showingGroups: [groupForDate] 
        };
      }
      return null;
    }).filter(Boolean) as Movie[];
    
    // Sort so favorites are first
    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.filmId);
      const bFav = favorites.includes(b.filmId);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [allMovies, dateStr, favorites]);

  // Extract all sessions for timeline view
  const allSessions = useMemo(() => {
    return moviesForSelectedDate.flatMap(movie => 
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
  }, [moviesForSelectedDate]);

  const selectedMovie = selectedMovieId ? allMovies.find(m => m.filmId === selectedMovieId) : null;

  if (selectedMovie) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-12 font-sans selection:bg-amber-500/30">
        <SeatMapModal selectedSala={selectedSala} onClose={() => setSelectedSala(null)} />
        <MovieDetail 
          movie={selectedMovie} 
          onBack={() => handleSelectMovie(null)} 
          onSelectSala={setSelectedSala}
          isFavorite={favorites.includes(selectedMovie.filmId)}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 pb-12 font-sans selection:bg-amber-500/30">
      <SeatMapModal selectedSala={selectedSala} onClose={() => setSelectedSala(null)} />
      
      <DashboardHeader 
        dates={dates}
        selectedDate={date}
        onSelectDate={setDate}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-amber-500"></div>
            <p className="text-amber-500/80 font-medium tracking-widest uppercase text-sm animate-pulse">Caricamento...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-32 space-y-4 text-red-500">
             <p className="text-lg font-medium">Errore nel caricamento dei dati.</p>
           </div>
        ) : viewMode === 'catalog' ? (
          <MovieCatalog 
            movies={allMovies} 
            onSelectMovie={handleSelectMovie} 
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : viewMode === 'movie' ? (
          <MovieGrid movies={moviesForSelectedDate} onSelectMovie={handleSelectMovie} onSelectSala={setSelectedSala} />
        ) : (
          <MovieTimeline sessions={allSessions} onSelectMovie={handleSelectMovie} onSelectSala={setSelectedSala} />
        )}
      </main>
    </div>
  );
}
