import React from 'react';
import { 
  Gamepad2, Target, Rocket, Boxes, Compass, Smile, Trophy, Tv, Users, GraduationCap,
  SlidersHorizontal, ChevronDown, Flame, Sparkles
} from 'lucide-react';
import { GameGenre } from '../types/game';

interface CategoryBarProps {
  activeGenre: GameGenre;
  onSelectGenre: (genre: GameGenre) => void;
  sortBy: 'trending' | 'plays' | 'rating' | 'updated' | 'newest';
  onSortChange: (sort: 'trending' | 'plays' | 'rating' | 'updated' | 'newest') => void;
  totalGamesCount: number;
}

const CATEGORIES: { id: GameGenre; label: string; icon: React.ReactNode }[] = [
  { id: 'All', label: 'All Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { id: '2 Player', label: '2 Player', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'Action', label: 'Action', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'Arcade', label: 'Arcade', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { id: 'Educational', label: 'Educational', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'Shooter', label: 'Shooter', icon: <Rocket className="w-3.5 h-3.5" /> },
  { id: 'Puzzle', label: 'Puzzle', icon: <Boxes className="w-3.5 h-3.5" /> },
  { id: 'Driving', label: 'Driving', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'Sports', label: 'Sports', icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: 'Casual', label: 'Casual', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 'Retro', label: 'Retro', icon: <Tv className="w-3.5 h-3.5" /> },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  activeGenre,
  onSelectGenre,
  sortBy,
  onSortChange,
  totalGamesCount,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Category Pills Row + Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Scrollable Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeGenre === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectGenre(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-900/40'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
          </div>

          <div className="flex items-center p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => onSortChange('trending')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                sortBy === 'trending'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => onSortChange('updated')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                sortBy === 'updated'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Updated
            </button>
            <button
              onClick={() => onSortChange('plays')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                sortBy === 'plays'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Plays
            </button>
            <button
              onClick={() => onSortChange('rating')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                sortBy === 'rating'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
