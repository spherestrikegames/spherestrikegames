import React from 'react';
import { Play, Sparkles, Star, Flame, Eye, ArrowUpRight } from 'lucide-react';
import { Game } from '../types/game';

interface HeroSpotlightProps {
  game: Game;
  onPlayGame: (game: Game) => void;
  onUpdateGame?: (game: Game) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  game,
  onPlayGame,
  onUpdateGame,
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden glass-panel border border-white/15 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 shadow-2xl p-6 sm:p-8 md:p-10">
      {/* Specular top light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* Decorative ambient background mesh */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="max-w-2xl space-y-4">
          {/* Metadata line - zero pill rule compliant */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300/90 tracking-wider">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              SPOTLIGHT SELECTION
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{game.genre}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">v{game.currentVersion} LIVE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-['Outfit'] text-balance">
            {game.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
            {game.description}
          </p>

          {/* Clean unboxed stats with typographic separators */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{game.rating.toFixed(1)}</span>
              <span className="text-slate-500">({game.ratingsCount})</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="tabular-nums font-mono">{(game.plays || 0).toLocaleString()}</span> plays
            </span>
            <span aria-hidden="true">·</span>
            <span>By <span className="text-slate-200 font-medium">{game.author}</span></span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400/90 font-mono">Updated {new Date(game.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onPlayGame(game)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.65)] transition-all flex items-center gap-2 cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
              <span>PLAY NOW</span>
            </button>

            {onUpdateGame && (
              <button
                onClick={() => onUpdateGame(game)}
                className="px-4 py-3 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 hover:border-white/20 font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Fork or Update Game</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Visual Preview Box with glass styling */}
        <div 
          onClick={() => onPlayGame(game)}
          className="relative w-full lg:w-80 h-52 rounded-xl overflow-hidden glass-card border border-white/15 group cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:border-cyan-400/50 shadow-xl"
        >
          {/* Subtle animated gradient backdrop */}
          <div className={`absolute inset-0 bg-gradient-to-br ${game.thumbnailGradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />

          {/* Center Play Glow */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-md flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all duration-200 shadow-lg">
            <Play className="w-7 h-7 fill-current ml-1" />
          </div>

          <div className="relative z-10 mt-3 text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
            Click to Launch Sandbox
          </div>
          <div className="relative z-10 text-[11px] font-mono text-cyan-400/80 mt-0.5">
            Version {game.currentVersion}
          </div>
        </div>
      </div>
    </div>
  );
};
