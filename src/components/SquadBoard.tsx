import React, { useState } from 'react';
import { Slot, PlayerRole, SlotCategory } from '../types';
import {
  Plus,
  X,
  Plane,
  Check,
  ChevronRight,
  Zap,
  Users,
  Shield,
  GripVertical,
  ArrowRightLeft,
} from 'lucide-react';

interface SquadBoardProps {
  slots: Slot[];
  onOpenAssignModal: (slotId: number) => void;
  onRemovePlayer: (slotId: number) => void;
  onUpdateSlotPrice: (slotId: number, newPrice: number) => void;
  onSwapSlots: (sourceSlotId: number, targetSlotId: number) => void;
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

export const SquadBoard: React.FC<SquadBoardProps> = ({
  slots,
  onOpenAssignModal,
  onRemovePlayer,
  onUpdateSlotPrice,
  onSwapSlots,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'XI' | 'IMPACT' | 'BENCH' | 'EXPANSION'>('ALL');
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');

  // Drag and drop state
  const [draggedSlotId, setDraggedSlotId] = useState<number | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<number | null>(null);

  // Quick Move modal state
  const [quickMoveSlotId, setQuickMoveSlotId] = useState<number | null>(null);

  const xiSlots = slots.filter((s) => s.category === 'xi');
  const impactSlots = slots.filter((s) => s.category === 'impact');
  const benchSlots = slots.filter((s) => s.category === 'bench');
  const mandatoryBenchSlots = benchSlots.filter((s) => s.id <= 18);
  const optionalExpansionSlots = benchSlots.filter((s) => s.id > 18);

  const xiFilled = xiSlots.filter((s) => s.player !== null).length;
  const impactFilled = impactSlots.filter((s) => s.player !== null).length;
  const mandatoryBenchFilled = mandatoryBenchSlots.filter((s) => s.player !== null).length;
  const expansionFilled = optionalExpansionSlots.filter((s) => s.player !== null).length;
  const totalBoughtCount = slots.filter((s) => s.player !== null).length;

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

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, slotId: number) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.player) {
      e.preventDefault();
      return;
    }
    setDraggedSlotId(slotId);
    e.dataTransfer.setData('text/plain', slotId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlotId(null);
  };

  const handleDrop = (e: React.DragEvent, targetSlotId: number) => {
    e.preventDefault();
    setDragOverSlotId(null);
    if (draggedSlotId !== null && draggedSlotId !== targetSlotId) {
      onSwapSlots(draggedSlotId, targetSlotId);
    }
    setDraggedSlotId(null);
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverSlotId(null);
  };

  const renderSlotCard = (slot: Slot) => {
    const isFilled = slot.player !== null;
    const player = slot.player;
    const isImpact = slot.category === 'impact';
    const isOptional = slot.id > 18;
    const isBeingDragged = draggedSlotId === slot.id;
    const isDragOver = dragOverSlotId === slot.id;

    return (
      <div
        key={slot.id}
        draggable={isFilled}
        onDragStart={(e) => handleDragStart(e, slot.id)}
        onDragOver={(e) => handleDragOver(e, slot.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, slot.id)}
        onDragEnd={handleDragEnd}
        className={`group relative rounded-xl border p-3 transition-all duration-200 select-none ${
          isBeingDragged
            ? 'opacity-40 scale-95 border-dashed border-amber-400 bg-slate-900'
            : isDragOver
            ? 'border-2 border-amber-400 bg-amber-500/20 scale-[1.02] shadow-xl'
            : isImpact
            ? isFilled
              ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10 cursor-grab active:cursor-grabbing'
              : 'bg-amber-950/10 border-dashed border-amber-500/40 hover:border-amber-400 cursor-pointer'
            : isFilled
            ? 'bg-slate-950/70 border-slate-700/80 hover:border-slate-600 shadow-sm cursor-grab active:cursor-grabbing'
            : isOptional
            ? 'bg-slate-950/20 border-dashed border-slate-800/60 hover:border-slate-700 hover:bg-slate-950/40 cursor-pointer'
            : 'bg-slate-950/30 border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-slate-950/60 cursor-pointer'
        }`}
        onClick={() => {
          if (!isFilled) {
            onOpenAssignModal(slot.id);
          }
        }}
      >
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Slot number, drag handle, role label */}
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Drag Handle & Slot Badge */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {isFilled && (
                <div
                  className="text-slate-600 group-hover:text-amber-400 cursor-grab active:cursor-grabbing transition"
                  title="Click and drag to move to Bench or another slot"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  isImpact
                    ? 'bg-amber-500 text-slate-950'
                    : isFilled
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : isOptional
                    ? 'bg-slate-900/60 text-slate-600 border border-slate-850'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {isImpact ? '⚡' : slot.id}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {slot.slotLabel}
                </span>
                {player && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.1 rounded border ${getRoleColor(
                      player.role
                    )}`}
                  >
                    {player.role}
                  </span>
                )}
                {isImpact && (
                  <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    IMPACT
                  </span>
                )}
                {isOptional && !isFilled && (
                  <span className="text-[8px] px-1 rounded bg-slate-800/60 text-slate-500">
                    Optional
                  </span>
                )}
              </div>

              {isFilled && player ? (
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    {player.id}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {player.name}
                  </span>
                  {player.isOverseas ? (
                    <span
                      className="inline-flex items-center gap-0.5 text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1 py-0.1 rounded font-medium"
                      title="Overseas Player"
                    >
                      <Plane className="w-2.5 h-2.5" /> OS
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium" title="Indian Player">
                      🇮🇳
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                  <Plus className="w-3 h-3 text-amber-500/80" />
                  <span className="text-slate-400 font-medium group-hover:text-amber-400 transition">
                    Pick {slot.suggestedRole} Spot
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Price, Swap Button & Actions */}
          {isFilled && player ? (
            <div className="flex items-center space-x-1.5 flex-shrink-0">
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
                  <div className="text-xs sm:text-sm font-extrabold text-amber-400">
                    ₹{(slot.soldPrice || 0).toFixed(2)}{' '}
                    <span className="text-[9px] font-normal text-slate-400">Cr</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {player.previousSoldPrice
                      ? `Prev ₹${player.previousSoldPrice}Cr`
                      : `Base ₹${player.basePrice}Cr`}
                  </div>
                </div>
              )}

              {/* Quick Move / Swap Dropdown Trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickMoveSlotId(quickMoveSlotId === slot.id ? null : slot.id);
                }}
                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                title="Move/Swap slot"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Change / Reassign button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAssignModal(slot.id);
                }}
                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                title="Replace Player"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlayer(slot.id);
                }}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Remove from slot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center text-slate-600 group-hover:text-amber-400 transition pr-1">
              <span className="text-[11px] font-semibold mr-1 hidden sm:inline">Add</span>
              <Plus className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Quick Move Destination Menu */}
        {quickMoveSlotId === slot.id && isFilled && (
          <div
            className="mt-2 pt-2 border-t border-slate-800 bg-slate-950/90 rounded-lg p-2 z-20 space-y-1.5 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-bold text-amber-400 flex items-center justify-between">
              <span>Move {player.name} to:</span>
              <button
                onClick={() => setQuickMoveSlotId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto text-[11px]">
              {slots
                .filter((s) => s.id !== slot.id)
                .map((dest) => (
                  <button
                    key={dest.id}
                    onClick={() => {
                      onSwapSlots(slot.id, dest.id);
                      setQuickMoveSlotId(null);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                      dest.player
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-400'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    Slot {dest.id} ({dest.slotLabel}) {dest.player ? `[Swap: ${dest.player.name}]` : '[Empty]'}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Squad Roster (18–25 Spots)</h2>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                totalBoughtCount < 18
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {totalBoughtCount < 18
                ? `${totalBoughtCount}/18 (Need ${18 - totalBoughtCount} for Min)`
                : `${totalBoughtCount}/25 (Min 18 Met ✓)`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Hold and drag any player to move between XI and Bench.</span>
            <span className="text-amber-400 font-semibold">• Player moves exclusively (no duplicates)</span>
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              activeTab === 'ALL'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All 25 ({totalBoughtCount})
          </button>
          <button
            onClick={() => setActiveTab('XI')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              activeTab === 'XI'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            XI ({xiFilled}/11)
          </button>
          <button
            onClick={() => setActiveTab('IMPACT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              activeTab === 'IMPACT'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Impact ({impactFilled}/1)
          </button>
          <button
            onClick={() => setActiveTab('BENCH')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              activeTab === 'BENCH'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Core Bench ({mandatoryBenchFilled}/6)
          </button>
          <button
            onClick={() => setActiveTab('EXPANSION')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              activeTab === 'EXPANSION'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expansion ({expansionFilled}/7)
          </button>
        </div>
      </div>

      {/* Content based on Active Tab */}
      <div className="space-y-5">
        {/* SECTION 1: PLAYING XI */}
        {(activeTab === 'ALL' || activeTab === 'XI') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏏 Starting Playing XI (Slots 1 - 11)</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Max 4 Overseas)
                </span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {xiFilled}/11 Filled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {xiSlots.map(renderSlotCard)}
            </div>
          </div>
        )}

        {/* SECTION 2: IMPACT PLAYER SPOT */}
        {(activeTab === 'ALL' || activeTab === 'IMPACT') && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Tactical Impact Player Spot (Slot 12)</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {impactFilled}/1 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {impactSlots.map(renderSlotCard)}
            </div>
          </div>
        )}

        {/* SECTION 3: CORE BENCH (SLOTS 13-18 MANDATORY SQUAD) */}
        {(activeTab === 'ALL' || activeTab === 'BENCH') && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Core Bench Reserves (Slots 13 - 18)</span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  [Completes Mandatory 18-Player Minimum]
                </span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {mandatoryBenchFilled}/6 Filled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mandatoryBenchSlots.map(renderSlotCard)}
            </div>
          </div>
        )}

        {/* SECTION 4: OPTIONAL EXPANSION (SLOTS 19-25 UP TO MAX 25) */}
        {(activeTab === 'ALL' || activeTab === 'EXPANSION') && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Optional Squad Expansion (Slots 19 - 25)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Deepen roster up to maximum 25 players)
                </span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {expansionFilled}/7 Filled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {optionalExpansionSlots.map(renderSlotCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
