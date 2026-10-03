'use client';

import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Globe, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '../types';
import { isSessionOriginalLanguage } from '../utils/helpers';

interface MovieCatalogProps {
  movies: Movie[];
  onSelectMovie: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export default function MovieCatalog({ movies, onSelectMovie, favorites, onToggleFavorite }: MovieCatalogProps) {
  // Sort movies so favorites are at the top
  const sortedMovies = [...movies].sort((a, b) => {
    const aFav = favorites.includes(a.filmId);
    const bFav = favorites.includes(b.filmId);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {sortedMovies.map(movie => {
        const firstGroup = movie.showingGroups?.find(g => g.sessions && g.sessions.length > 0);
        const firstDateStr = firstGroup ? format(new Date(firstGroup.date), 'd MMM', { locale: it }) : null;
        const isFav = favorites.includes(movie.filmId);
        
        return (
          <button 
            key={movie.filmId}
            onClick={() => onSelectMovie(movie.filmId)}
            className="bg-[#141414] rounded-2xl shadow-lg border border-white/5 overflow-hidden flex flex-col text-left hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all duration-500 group flex-1 h-full hover:-translate-y-1 relative"
          >
            <div 
              className="absolute top-2 right-2 z-30 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
              onClick={(e) => onToggleFavorite(movie.filmId, e)}
            >
              <Star size={16} className={isFav ? "text-amber-500 fill-amber-500" : "text-white/70"} />
            </div>

            <div className="w-full aspect-[2/3] relative bg-black shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
              <Image 
                src={movie.posterImageSrc} 
                alt={movie.filmTitle}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </div>
            <div className="p-4 flex flex-col flex-1 relative z-20 bg-[#141414]">
              <h3 className="font-bold text-sm text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors pr-6">{movie.filmTitle}</h3>
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
  );
}
