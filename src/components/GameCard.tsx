import React from 'react';
import { Heart, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { Game } from '../types/game';
import { FrontPageCover } from './FrontPageCover';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  onUpdate?: (game: Game) => void;
  onDelete?: (gameId: string) => void;
  isAdmin?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (gameId: string, e: React.MouseEvent) => void;
  aspect?: '16/9' | '16/10';
  slotNumber?: number;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  onPlay, 
  onUpdate,
  onDelete,
  isAdmin = false,
  isFavorited = false,
  onToggleFavorite,
  slotNumber
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    if (window.confirm(`[ADMIN MODERATION] Are you sure you want to delete "${game.title}" as inappropriate? This cannot be undone.`)) {
      onDelete(game.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate(game);
    }
  };

  return (
    <div 
      onClick={() => onPlay(game)}
      className={`group relative flex flex-col aspect-[16/10] w-full rounded-2xl overflow-hidden glass-card border transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-2xl cursor-pointer bg-[#0e1422]/80 ${
        isAdmin ? 'border-amber-500/40 hover:border-amber-400' : 'border-white/[0.1] hover:border-blue-500/50'
      }`}
    >
      {/* Front Page Cover Art */}
      <FrontPageCover
        game={game}
        showHoverOverlay={true}
        className="w-full h-full"
      />

      {/* Slot Index Badge */}
      {slotNumber !== undefined && (
        <span className="absolute top-2 left-2 z-20 text-[9px] font-mono font-bold text-slate-300 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
          #{String(slotNumber).padStart(2, '0')}
        </span>
      )}

      {/* Admin Mod Badge */}
      {isAdmin && (
        <span className="absolute top-2 left-10 z-20 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
          <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
          <span>MOD</span>
        </span>
      )}

      {/* Favorite Heart Button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => onToggleFavorite(game.id, e)}
          className={`absolute top-2 right-2 z-30 p-1.5 rounded-lg backdrop-blur-md border transition-all cursor-pointer ${
            isFavorited
              ? 'bg-rose-950/80 text-rose-400 border-rose-500/40 opacity-100'
              : 'bg-black/60 text-slate-300 hover:text-white border-white/10 opacity-0 group-hover:opacity-100'
          }`}
          title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-400' : ''}`} />
        </button>
      )}

      {/* Admin Moderation Action Overlay (visible on hover or always accessible) */}
      {isAdmin && (
        <div className="absolute inset-x-2 bottom-2 z-30 flex items-center justify-between gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {onUpdate && (
            <button
              onClick={handleEdit}
              title="Edit game content as Admin"
              className="flex-1 py-1 px-2 rounded-lg bg-blue-950/90 hover:bg-blue-900 border border-blue-500/40 text-blue-200 text-[10px] font-bold flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-blue-400" />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              title="Delete inappropriate game as Admin"
              className="flex-1 py-1 px-2 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-[10px] font-bold flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
