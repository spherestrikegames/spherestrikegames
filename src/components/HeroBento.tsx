import React from 'react';
import { Play, Star, Sparkles, Eye, ArrowUpRight, Flame } from 'lucide-react';
import { Game } from '../types/game';

interface HeroBentoProps {
  primaryGame: Game;
  secondaryGames: Game[];
  onPlayGame: (game: Game) => void;
  onUpdateGame?: (game: Game) => void;
}

export const HeroBento: React.FC<HeroBentoProps> = ({
  primaryGame,
  secondaryGames,
  onPlayGame,
  onUpdateGame,
}) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Primary Flagship Bento Card (7 or 8 columns) */}
      <div className="lg:col-span-8 relative rounded-2xl overflow-hidden glass-panel border border-white/[0.08] bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-[#0b0f19] p-6 sm:p-8 flex flex-col justify-between group shadow-xl">
        {/* Ambient deep sapphire mesh (not neon!) */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag & Version Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              FLAGSHIP ARENA
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{primaryGame.genre}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              v{primaryGame.currentVersion}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{primaryGame.rating.toFixed(1)}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono tabular-nums">{(primaryGame.plays || 0).toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Title and description */}
        <div className="relative z-10 space-y-3 mb-6">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
            {primaryGame.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl">
            {primaryGame.description}
          </p>
        </div>

        {/* Actions Bar & Quick Controls Info */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlayGame(primaryGame)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all flex items-center gap-2.5 cursor-pointer group/btn"
            >
              <Play className="w-4 h-4 fill-white transition-transform group-hover/btn:scale-110" />
              <span>PLAY NOW</span>
            </button>

            {onUpdateGame && (
              <button
                onClick={() => onUpdateGame(primaryGame)}
                className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] hover:border-white/20 font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Changelog / Update</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400">
            By <span className="text-slate-200 font-medium">{primaryGame.author}</span>
          </div>
        </div>
      </div>

      {/* Secondary 4-Grid Side Bento (4 columns) */}
      <div className="lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
        {secondaryGames.slice(0, 4).map((game) => (
          <div
            key={game.id}
            onClick={() => onPlayGame(game)}
            className="group relative rounded-xl overflow-hidden glass-card border border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between p-3.5 bg-gradient-to-br from-slate-900/80 to-slate-950/90 shadow-md hover:-translate-y-0.5"
          >
            {/* Top Row: genre and rating */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="font-mono text-slate-400 truncate">{game.genre}</span>
              <span className="flex items-center gap-1 text-amber-400 font-medium shrink-0">
                <Star className="w-3 h-3 fill-amber-400" />
                {game.rating.toFixed(1)}
              </span>
            </div>

            {/* Middle: Title & Quick description */}
            <div className="my-1">
              <h3 className="text-sm font-bold text-white font-['Outfit'] line-clamp-1 group-hover:text-blue-400 transition-colors">
                {game.title}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                {game.description}
              </p>
            </div>

            {/* Bottom Row: Version & Play action button */}
            <div className="pt-2 mt-1 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-slate-400">v{game.currentVersion}</span>
              <span className="flex items-center gap-1 text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Play</span>
                <Play className="w-2.5 h-2.5 fill-blue-400" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
