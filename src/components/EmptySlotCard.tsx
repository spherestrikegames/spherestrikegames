import React from 'react';
import { Plus } from 'lucide-react';

interface EmptySlotCardProps {
  onOpenUpload?: () => void;
  slotNumber?: number;
}

export const EmptySlotCard: React.FC<EmptySlotCardProps> = ({ 
  onOpenUpload, 
  slotNumber 
}) => {
  return (
    <div
      onClick={onOpenUpload}
      title="Upload a game to this slot"
      className="group relative flex flex-col items-center justify-center aspect-[16/10] w-full rounded-2xl overflow-hidden border border-dashed border-white/[0.08] hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-lg cursor-pointer bg-[#0e1422]/40 hover:bg-[#0e1422]/70"
    >
      {/* Specular top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Subtle grid background texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Center Plus Icon & Label */}
      <div className="relative z-10 flex flex-col items-center gap-2 p-3 text-center">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] group-hover:border-blue-500/50 group-hover:bg-blue-600/10 flex items-center justify-center text-slate-600 group-hover:text-blue-400 transition-all duration-200 shadow-sm">
          <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
        </div>

        <div className="space-y-0.5">
          <span className="block text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors font-['Outfit']">
            Empty Slot
          </span>
          <span className="block text-[10px] text-blue-400/80 group-hover:text-blue-400 font-medium">
            + Upload Game
          </span>
        </div>
      </div>

      {/* Slot index pill */}
      {slotNumber !== undefined && (
        <span className="absolute top-2.5 left-2.5 text-[9px] font-mono text-slate-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.05]">
          SLOT #{String(slotNumber).padStart(2, '0')}
        </span>
      )}
    </div>
  );
};
