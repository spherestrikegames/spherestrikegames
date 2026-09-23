import React from 'react';
import { 
  Play, Flame, RefreshCw, Star, Tv, Zap, 
  Gamepad2, Rocket, Target, Trophy, Car, Ghost, Sword, Sparkles
} from 'lucide-react';
import { Game } from '../types/game';

interface FrontPageCoverProps {
  game?: Partial<Game>;
  title?: string;
  genre?: string;
  author?: string;
  coverImage?: string;
  badge?: 'hot' | 'update' | 'new' | 'star' | 'stream' | 'none';
  accentTheme?: string;
  iconName?: string;
  aspect?: '16/9' | 'square' | 'wide' | 'auto';
  className?: string;
  showHoverOverlay?: boolean;
}

// Preset theme gradients and decorative backgrounds for built-in designer
export const FRONT_PAGE_THEMES = [
  {
    id: 'sky-rush',
    name: 'Sky Horizon',
    gradient: 'from-[#0284c7] via-[#38bdf8] to-[#bae6fd]',
    pattern: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
    textColor: 'text-white drop-shadow-[0_4px_12px_rgba(2,132,199,0.8)]',
    titleStyle: 'font-black tracking-tight text-white stroke-black',
    accent: '#0284c7'
  },
  {
    id: 'voxel-craft',
    name: 'Block Craft',
    gradient: 'from-[#15803d] via-[#16a34a] to-[#86efac]',
    pattern: 'linear-gradient(45deg, rgba(0,0,0,0.15) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.15) 75%)',
    textColor: 'text-white drop-shadow-[0_4px_8px_rgba(21,128,61,0.9)]',
    titleStyle: 'font-black tracking-wider text-yellow-300 font-mono',
    accent: '#22c55e'
  },
  {
    id: 'cyber-arena',
    name: 'Cyber Arena',
    gradient: 'from-[#030712] via-[#0f172a] to-[#1e1b4b]',
    pattern: 'radial-gradient(#38bdf8 1px, transparent 1px)',
    textColor: 'text-cyan-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]',
    titleStyle: 'font-extrabold tracking-widest text-cyan-200 uppercase',
    accent: '#06b6d4'
  },
  {
    id: 'desert-speed',
    name: 'Desert Dunes',
    gradient: 'from-[#78350f] via-[#d97706] to-[#fde68a]',
    pattern: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
    textColor: 'text-amber-100 drop-shadow-[0_4px_10px_rgba(120,53,15,0.8)]',
    titleStyle: 'font-black italic tracking-tight text-white',
    accent: '#f59e0b'
  },
  {
    id: 'midnight-dungeon',
    name: 'Obsidian Dungeon',
    gradient: 'from-[#09090b] via-[#18181b] to-[#27272a]',
    pattern: 'radial-gradient(ellipse at bottom, rgba(168,85,247,0.15), transparent)',
    textColor: 'text-purple-200 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]',
    titleStyle: 'font-extrabold tracking-tight text-purple-100 uppercase',
    accent: '#a855f7'
  },
  {
    id: 'speed-asphalt',
    name: 'Asphalt Drift',
    gradient: 'from-[#1c1917] via-[#292524] to-[#7f1d1d]',
    pattern: 'linear-gradient(to right, rgba(239,68,68,0.15), transparent 40%)',
    textColor: 'text-rose-100 drop-shadow-[0_4px_12px_rgba(159,18,57,0.8)]',
    titleStyle: 'font-black italic tracking-tighter text-rose-300 uppercase',
    accent: '#ef4444'
  }
];

export const FrontPageCover: React.FC<FrontPageCoverProps> = ({
  game,
  title,
  genre,
  author,
  coverImage,
  badge,
  accentTheme,
  iconName,
  aspect = '16/9',
  className = '',
  showHoverOverlay = true
}) => {
  const effectiveTitle = title ?? game?.title ?? 'Untitled Game';
  const effectiveCover = coverImage ?? game?.coverImage;
  const effectiveBadge = badge ?? game?.badge ?? 'none';
  const effectiveGenre = genre ?? game?.genre ?? 'Arcade';
  const effectiveAuthor = author ?? game?.author ?? 'Community Creator';
  const effectiveThemeId = accentTheme ?? (game?.thumbnailGradient ? 'cyber-arena' : 'sky-rush');

  const themeConfig = FRONT_PAGE_THEMES.find(t => t.id === effectiveThemeId) || FRONT_PAGE_THEMES[0];

  const renderBadge = () => {
    switch (effectiveBadge) {
      case 'hot':
        return (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md shadow-orange-950/60 uppercase tracking-wide">
            <Flame className="w-3 h-3 fill-white" />
            <span>HOT</span>
          </div>
        );
      case 'update':
        return (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md shadow-blue-950/60 uppercase tracking-wide">
            <RefreshCw className="w-3 h-3" />
            <span>UPDATED</span>
          </div>
        );
      case 'new':
        return (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md shadow-emerald-950/60 uppercase tracking-wide">
            <Zap className="w-3 h-3 fill-white" />
            <span>NEW</span>
          </div>
        );
      case 'star':
        return (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md shadow-purple-950/60 uppercase tracking-wide">
            <Star className="w-3 h-3 fill-white" />
            <span>TOP PICK</span>
          </div>
        );
      case 'stream':
        return (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-purple-700 text-white text-[10px] font-bold p-1 rounded-md shadow-md shadow-purple-950/60">
            <Tv className="w-3 h-3" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderIcon = (name?: string) => {
    switch (name) {
      case 'Rocket': return <Rocket className="w-10 h-10 text-white drop-shadow-md" />;
      case 'Car': return <Car className="w-10 h-10 text-white drop-shadow-md" />;
      case 'Target': return <Target className="w-10 h-10 text-white drop-shadow-md" />;
      case 'Ghost': return <Ghost className="w-10 h-10 text-white drop-shadow-md" />;
      case 'Sword': return <Sword className="w-10 h-10 text-white drop-shadow-md" />;
      case 'Trophy': return <Trophy className="w-10 h-10 text-white drop-shadow-md" />;
      default: return <Gamepad2 className="w-10 h-10 text-white drop-shadow-md" />;
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}>
      {/* Badge in top left corner */}
      {renderBadge()}

      {/* Main Cover Artwork */}
      {effectiveCover ? (
        <img
          src={effectiveCover}
          alt={effectiveTitle}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        /* Dynamic Designed Front Page Poster */
        <div
          className={`w-full h-full bg-gradient-to-br ${themeConfig.gradient} relative flex flex-col items-center justify-center p-4 text-center overflow-hidden transform group-hover:scale-105 transition-transform duration-300`}
        >
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: themeConfig.pattern, backgroundSize: '24px 24px' }}
          />

          {/* Radial light spotlight */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />

          {/* Central Logo / Emblem */}
          <div className="relative z-10 p-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 shadow-xl mb-2">
            {renderIcon(iconName || game?.iconName)}
          </div>

          {/* Bold 3D Game Title */}
          <div className="relative z-10 px-2 max-w-full">
            <h2 className={`text-base sm:text-lg font-black tracking-tight uppercase line-clamp-2 leading-tight ${themeConfig.textColor}`}>
              {effectiveTitle}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm mx-auto w-fit">
              <span>{effectiveGenre}</span>
            </div>
          </div>
        </div>
      )}

      {/* Specular Edge Hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Hover Action Overlay */}
      {showHoverOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5 z-20 pointer-events-none">
          <div className="flex items-center justify-end">
            <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
              {effectiveGenre}
            </span>
          </div>

          {/* Center Play Button Icon */}
          <div className="self-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-950 transform scale-75 group-hover:scale-100 transition-transform duration-200 border border-blue-400/40">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
          </div>

          {/* Bottom Title & Author */}
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white font-['Outfit'] truncate leading-snug drop-shadow-md">
              {effectiveTitle}
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              By <span className="text-white font-medium">{effectiveAuthor}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
