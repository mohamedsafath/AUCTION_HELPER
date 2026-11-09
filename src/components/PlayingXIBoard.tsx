import React from 'react';
import { Slot, PlayerRole } from '../types';
import { Plus, X, Plane, Shield, IndianRupee, Sparkles, Check, ChevronRight } from 'lucide-react';

interface PlayingXIBoardProps {
  slots: Slot[];
  onOpenAssignModal: (slotId: number) => void;
  onRemovePlayer: (slotId: number) => void;
  onUpdateSlotPrice: (slotId: number, newPrice: number) => void;
}

const getRoleColor = (role: PlayerRole) => {
  switch (role) {
    case 'BAT':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'WK':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'AR':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'BOWL':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-slate-700 text-slate-300 border-slate-600';
  }
};

export const PlayingXIBoard: React.FC<PlayingXIBoardProps> = ({
  slots,
  onOpenAssignModal,
  onRemovePlayer,
  onUpdateSlotPrice,
}) => {
  const [editingSlotId, setEditingSlotId] = React.useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = React.useState<string>('');

  const handleStartEditPrice = (slot: Slot) => {
    setEditingSlotId(slot.id);
    setEditPriceValue(slot.soldPrice?.toString() || '0');
  };

  const handleSavePrice = (slotId: number) => {
    const val = parseFloat(editPriceValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateSlotPrice(slotId, val);
    }
    setEditingSlotId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Playing XI (11 Slots)</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {slots.filter((s) => s.player !== null).length} / 11 Filled
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Click any empty slot to pick a player and log winning auction bid
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> BAT
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> WK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> AR
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> BOWL
          </span>
          <span className="flex items-center gap-1">
            <Plane className="w-3 h-3 text-sky-400" /> Overseas
          </span>
        </div>
      </div>

      {/* Slots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {slots.map((slot) => {
          const isFilled = slot.player !== null;
          const player = slot.player;

          return (
            <div
              key={slot.id}
              className={`group relative rounded-xl border p-3.5 transition-all duration-200 ${
                isFilled
                  ? 'bg-slate-950/70 border-slate-700/80 hover:border-slate-600 shadow-md'
                  : 'bg-slate-950/30 border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-slate-950/60 cursor-pointer'
              }`}
              onClick={() => {
                if (!isFilled) {
                  onOpenAssignModal(slot.id);
                }
              }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Slot number & role label */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isFilled
                        ? 'bg-slate-800 text-amber-400 border border-slate-700'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {slot.id}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {slot.slotLabel}
                      </span>
                      {player && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleColor(
                            player.role
                          )}`}
                        >
                          {player.role}
                        </span>
                      )}
                    </div>

                    {isFilled && player ? (
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {player.name}
                        </span>
                        {player.isOverseas ? (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1 py-0.2 rounded font-medium"
                            title="Overseas Player"
                          >
                            <Plane className="w-2.5 h-2.5" /> OS
                          </span>
                        ) : (
                          <span
                            className="text-[10px] text-slate-400 font-medium"
                            title="Indian Player"
                          >
                            🇮🇳
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <Plus className="w-3.5 h-3.5 text-amber-500/80" />
                        <span className="text-slate-400 font-medium group-hover:text-amber-400 transition">
                          Select {slot.suggestedRole} Player
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Price & Actions */}
                {isFilled && player ? (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Price display / Inline editing */}
                    {editingSlotId === slot.id ? (
                      <div
                        className="flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="number"
                          step="0.05"
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          className="w-16 bg-slate-800 text-white text-xs font-bold px-1.5 py-1 rounded border border-amber-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePrice(slot.id);
                            if (e.key === 'Escape') setEditingSlotId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSavePrice(slot.id)}
                          className="p-1 bg-amber-500 text-slate-950 rounded hover:bg-amber-400 text-xs"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="text-right cursor-pointer hover:opacity-80"
                        title="Click to edit price"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditPrice(slot);
                        }}
                      >
                        <div className="text-sm sm:text-base font-extrabold text-amber-400">
                          ₹{(slot.soldPrice || 0).toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">Cr</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {player.previousSoldPrice
                            ? `Prev: ₹${player.previousSoldPrice.toFixed(2)}Cr`
                            : player.basePrice
                            ? `Base: ₹${player.basePrice.toFixed(2)}Cr`
                            : 'Click to edit'}
                        </div>
                      </div>
                    )}

                    {/* Change / Reassign button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAssignModal(slot.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                      title="Replace Player"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePlayer(slot.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Remove from slot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center text-slate-600 group-hover:text-amber-400 transition pr-2">
                    <span className="text-xs font-semibold mr-1 hidden sm:inline">Add</span>
                    <Plus className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
