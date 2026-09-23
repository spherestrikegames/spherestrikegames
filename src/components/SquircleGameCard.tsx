import React from 'react';
import { Plus, Play } from 'lucide-react';
import { Game } from '../types/game';
import { FrontPageCover } from './FrontPageCover';

interface SquircleGameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
}

export const SquircleGameCard: React.FC<SquircleGameCardProps> = ({ game, onPlay }) => {
  return (
    <div
      onClick={() => onPlay(game)}
      title={`Play ${game.title}`}
      className="group relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden glass-card border border-white/[0.12] hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl cursor-pointer bg-[#0e1422]/80"
    >
      <FrontPageCover
        game={game}
        aspect="square"
        showHoverOverlay={true}
        className="w-full h-full"
      />
    </div>
  );
};

interface EmptySquircleSlotProps {
  onOpenUpload?: () => void;
  index: number;
}

export const EmptySquircleSlot: React.FC<EmptySquircleSlotProps> = ({ onOpenUpload, index }) => {
  return (
    <div
      onClick={onOpenUpload}
      title="Upload a game to this slot"
      className="group relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border border-dashed border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-[#0e1422]/30 hover:bg-[#0e1422]/60 flex flex-col items-center justify-center p-2"
    >
      <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:border-blue-500/40 group-hover:bg-blue-600/10 flex items-center justify-center text-slate-700 group-hover:text-blue-400 transition-all">
        <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
      </div>
      <span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-400 mt-1">
        SLOT 0{index + 1}
      </span>
    </div>
  );
};
