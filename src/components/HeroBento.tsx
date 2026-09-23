import React from 'react';
import { Plus } from 'lucide-react';
import { Game } from '../types/game';
import { FrontPageCover } from './FrontPageCover';

interface HeroBentoProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
  onOpenUpload?: () => void;
}

export const HeroBento: React.FC<HeroBentoProps> = ({
  games = [],
  onPlayGame,
  onOpenUpload,
}) => {
  // Slots 0 to 5 correspond to the 6 positions in the "Top picks for you" bento
  const slot0 = games[0]; // Left flagship card
  const slot1 = games[1]; // Center top-left
  const slot2 = games[2]; // Center top-right
  const slot3 = games[3]; // Center bottom-left
  const slot4 = games[4]; // Center bottom-right
  const slot5 = games[5]; // Right card

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
      {/* 1. Left Flagship Hero Card (takes 5 of 12 cols on desktop) */}
      <div className="md:col-span-12 lg:col-span-5 aspect-[16/10] sm:aspect-[16/9] w-full">
        {slot0 ? (
          <div
            onClick={() => onPlayGame(slot0)}
            className="group relative w-full h-full rounded-2xl overflow-hidden glass-card border border-white/[0.12] hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl cursor-pointer bg-[#0e1422]/80"
          >
            <FrontPageCover game={slot0} showHoverOverlay={true} className="w-full h-full" />
          </div>
        ) : (
          <div
            onClick={onOpenUpload}
            title="Upload flagship game"
            className="group relative w-full h-full rounded-2xl overflow-hidden border border-dashed border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-1 cursor-pointer bg-[#0e1422]/40 hover:bg-[#0e1422]/70 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] group-hover:border-blue-500/50 group-hover:bg-blue-600/10 flex items-center justify-center text-slate-600 group-hover:text-blue-400 transition-all mb-2">
              <Plus className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-sm font-bold text-slate-400 group-hover:text-white font-['Outfit']">
              Flagship Arena Slot
            </span>
            <span className="text-xs text-blue-400/80 group-hover:text-blue-400 mt-0.5">
              + Upload Featured Game
            </span>
            <span className="absolute top-3 left-3 text-[9px] font-mono text-slate-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.04]">
              HERO SLOT 01
            </span>
          </div>
        )}
      </div>

      {/* 2. Middle 2x2 Grid of 4 Rectangular Cards (takes 4 of 12 cols on desktop) */}
      <div className="md:col-span-7 lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4 aspect-[16/10] sm:aspect-[16/9] w-full">
        {[
          { game: slot1, slotNum: 2, label: 'Center Top-Left' },
          { game: slot2, slotNum: 3, label: 'Center Top-Right' },
          { game: slot3, slotNum: 4, label: 'Center Bottom-Left' },
          { game: slot4, slotNum: 5, label: 'Center Bottom-Right' },
        ].map(({ game, slotNum, label }, idx) => (
          <div key={`middle-slot-${idx}`} className="w-full h-full">
            {game ? (
              <div
                onClick={() => onPlayGame(game)}
                className="group relative w-full h-full rounded-2xl overflow-hidden glass-card border border-white/[0.1] hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl cursor-pointer bg-[#0e1422]/80"
              >
                <FrontPageCover game={game} showHoverOverlay={true} className="w-full h-full" />
              </div>
            ) : (
              <div
                onClick={onOpenUpload}
                title={`Upload game to ${label}`}
                className="group relative w-full h-full rounded-2xl overflow-hidden border border-dashed border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-[#0e1422]/40 hover:bg-[#0e1422]/70 flex flex-col items-center justify-center p-2 text-center"
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:border-blue-500/40 group-hover:bg-blue-600/10 flex items-center justify-center text-slate-600 group-hover:text-blue-400 transition-all mb-1">
                  <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 font-['Outfit']">
                  Empty Slot
                </span>
                <span className="text-[9px] text-blue-400/80 group-hover:text-blue-400">
                  + Add
                </span>
                <span className="absolute top-2 left-2 text-[8px] font-mono text-slate-600 bg-black/40 px-1 py-0.2 rounded border border-white/[0.04]">
                  0{slotNum}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Right Large Card (takes 3 of 12 cols on desktop) */}
      <div className="md:col-span-5 lg:col-span-3 aspect-[16/10] sm:aspect-[16/9] w-full">
        {slot5 ? (
          <div
            onClick={() => onPlayGame(slot5)}
            className="group relative w-full h-full rounded-2xl overflow-hidden glass-card border border-white/[0.12] hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl cursor-pointer bg-[#0e1422]/80"
          >
            <FrontPageCover game={slot5} showHoverOverlay={true} className="w-full h-full" />
          </div>
        ) : (
          <div
            onClick={onOpenUpload}
            title="Upload game to spotlight slot"
            className="group relative w-full h-full rounded-2xl overflow-hidden border border-dashed border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-1 cursor-pointer bg-[#0e1422]/40 hover:bg-[#0e1422]/70 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] group-hover:border-blue-500/50 group-hover:bg-blue-600/10 flex items-center justify-center text-slate-600 group-hover:text-blue-400 transition-all mb-2">
              <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-white font-['Outfit']">
              Spotlight Arena Slot
            </span>
            <span className="text-[11px] text-blue-400/80 group-hover:text-blue-400 mt-0.5">
              + Upload Game
            </span>
            <span className="absolute top-3 left-3 text-[9px] font-mono text-slate-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.04]">
              HERO SLOT 06
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
