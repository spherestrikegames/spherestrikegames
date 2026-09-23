import React from 'react';
import { Play, Star, Eye, Gamepad2, Rocket, LayoutGrid, Zap, Trophy, Compass, Heart, Users, Target, Boxes, Globe } from 'lucide-react';
import { Game } from '../types/game';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  onUpdate?: (game: Game) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (gameId: string, e: React.MouseEvent) => void;
}

function getIconComponent(iconName: string, genre: string) {
  switch (iconName) {
    case 'Rocket': return <Rocket className="w-7 h-7 text-blue-400" />;
    case 'LayoutGrid': return <LayoutGrid className="w-7 h-7 text-indigo-400" />;
    case 'Zap': return <Zap className="w-7 h-7 text-amber-400" />;
    case 'Trophy': return <Trophy className="w-7 h-7 text-slate-300" />;
    case 'Compass': return <Compass className="w-7 h-7 text-amber-400" />;
    default:
      if (genre === '2 Player') return <Users className="w-7 h-7 text-blue-400" />;
      if (genre === 'Action') return <Target className="w-7 h-7 text-rose-400" />;
      if (genre === 'Puzzle') return <Boxes className="w-7 h-7 text-emerald-400" />;
      return <Gamepad2 className="w-7 h-7 text-blue-400" />;
  }
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  onPlay, 
  onUpdate,
  isFavorited = false,
  onToggleFavorite
}) => {
  const isRecentlyUpdated = (Date.now() - new Date(game.updatedAt).getTime()) < (10 * 24 * 60 * 60 * 1000);

  return (
    <div 
      onClick={() => onPlay(game)}
      className="group relative flex flex-col rounded-xl overflow-hidden glass-card border border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl cursor-pointer bg-[#0e1422]/70"
    >
      {/* Specular hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Thumbnail Aspect Area */}
      <div className="relative aspect-video w-full overflow-hidden flex items-center justify-center bg-slate-950">
        {/* Ambient Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${game.thumbnailGradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300`} />

        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Center Icon */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-md group-hover:scale-110 transition-transform duration-200 shadow-lg">
          {getIconComponent(game.iconName, game.genre)}
        </div>

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-950 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Recently Updated Badge */}
        {isRecentlyUpdated && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-300 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>v{game.currentVersion}</span>
          </div>
        )}

        {/* Web Link Badge */}
        {game.embedUrl && !isRecentlyUpdated && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 text-[10px] font-medium text-blue-300 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-blue-500/30">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Web Link</span>
          </div>
        )}

        {/* Favorite Heart Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(game.id, e)}
            className={`absolute top-2 right-2 z-20 p-1.5 rounded-lg backdrop-blur-md border transition-all cursor-pointer ${
              isFavorited
                ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                : 'bg-black/50 text-slate-400 hover:text-white border-white/10 opacity-0 group-hover:opacity-100'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Metadata row */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-medium text-slate-400">{game.genre}</span>
            <span className="truncate max-w-[110px]">by {game.author}</span>
          </div>

          <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1 font-['Outfit']">
            {game.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Footer info: Rating and Plays count */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-200 tabular-nums">{game.rating.toFixed(1)}</span>
            <span className="text-slate-400 text-[11px]">({game.ratingsCount})</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Eye className="w-3 h-3 text-slate-400" />
            <span className="font-mono tabular-nums">{(game.plays || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
