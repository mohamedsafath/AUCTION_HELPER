import React, { useState, useEffect } from 'react';
import { Player, Slot, TargetPlayer } from '../types';
import {
  Gavel,
  X,
  Plane,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface WinningBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  targetInfo?: TargetPlayer | null;
  slots: Slot[];
  defaultSlotId?: number | null;
  remainingPurse: number;
  maxSafeBid: number;
  onConfirmPurchase: (
    slotId: number,
    player: Player,
    purchasePrice: number,
    targetId?: string
  ) => void;
}

export const WinningBidModal: React.FC<WinningBidModalProps> = ({
  isOpen,
  onClose,
  player,
  targetInfo,
  slots,
  defaultSlotId,
  remainingPurse,
  maxSafeBid,
  onConfirmPurchase,
}) => {
  const [priceInput, setPriceInput] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<number>(1);

  useEffect(() => {
    if (player && isOpen) {
      // Default price to targetMaxPrice if target, or previousSoldPrice, or basePrice
      const initialPrice = targetInfo?.targetMaxPrice || player.previousSoldPrice || player.basePrice || 0.3;
      setPriceInput(initialPrice.toFixed(2));

      // Choose default slot: passed defaultSlotId, or first matching vacant slot, or first vacant slot
      if (defaultSlotId) {
        setSelectedSlotId(defaultSlotId);
      } else {
        const matchingVacant = slots.find(
          (s) => s.player === null && s.suggestedRole === player.role
        );
        if (matchingVacant) {
          setSelectedSlotId(matchingVacant.id);
        } else {
          const firstVacant = slots.find((s) => s.player === null);
          if (firstVacant) {
            setSelectedSlotId(firstVacant.id);
          } else {
            setSelectedSlotId(1);
          }
        }
      }
    }
  }, [player, targetInfo, isOpen, defaultSlotId, slots]);

  if (!isOpen || !player) return null;

  const enteredPrice = parseFloat(priceInput) || 0;
  const newRemainingPurse = remainingPurse - enteredPrice;
  const isOverSafe = enteredPrice > maxSafeBid && maxSafeBid > 0;
  const isBudgetExceeded = newRemainingPurse < 0;

  // Budget difference compared to planned target
  const plannedBudget = targetInfo?.targetMaxPrice;
  const budgetDiff = plannedBudget !== undefined ? plannedBudget - enteredPrice : null;

  const handleQuickAdd = (amount: number) => {
    const cur = parseFloat(priceInput) || 0;
    setPriceInput((cur + amount).toFixed(2));
  };

  const handleSetPrice = (amount: number) => {
    setPriceInput(amount.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPrice <= 0) {
      alert('Please enter a valid winning bid amount greater than ₹0');
      return;
    }
    onConfirmPurchase(selectedSlotId, player, enteredPrice, targetInfo?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/25">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Player Acquired!
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {player.id}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {player.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Player Summary Card */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                {player.roleFull || player.role}
              </span>
              <span className="text-xs text-slate-400">{player.marqueeSet}</span>
              {player.isOverseas ? (
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                  <Plane className="w-2.5 h-2.5" /> OS
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">🇮🇳 IND</span>
              )}
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400">Base: </span>
              <strong className="text-white">₹{player.basePrice.toFixed(2)} Cr</strong>
            </div>
          </div>

          {/* Planned Budget vs Winning Price */}
          {plannedBudget !== undefined && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Target Planned Budget: </span>
                <strong className="text-amber-400 font-bold text-sm">
                  ₹{plannedBudget.toFixed(2)} Cr
                </strong>
              </div>
              {budgetDiff !== null && (
                <div
                  className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                    budgetDiff >= 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {budgetDiff >= 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>₹{budgetDiff.toFixed(2)} Cr Saved</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>₹{(-budgetDiff).toFixed(2)} Cr Over Budget</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Input: How much did you get him for? */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                How much did you buy him for? (₹ Crores)
              </label>
              <span className="text-[11px] text-indigo-400 font-medium">
                Safe Max: ₹{maxSafeBid.toFixed(2)} Cr
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-extrabold text-amber-400">
                ₹
              </span>
              <input
                type="number"
                step="0.05"
                min="0.1"
                required
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="e.g. 14.50"
                className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-xl pl-9 pr-14 py-2.5 text-lg font-black text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                Cr
              </span>
            </div>

            {/* Quick Price Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 mr-1">Quick:</span>
              {plannedBudget !== undefined && (
                <button
                  type="button"
                  onClick={() => handleSetPrice(plannedBudget)}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30"
                >
                  Target (₹{plannedBudget.toFixed(2)}Cr)
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSetPrice(player.basePrice)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                Base (₹{player.basePrice.toFixed(2)}Cr)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(0.2)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +20 L
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(0.5)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +50 L
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1.0)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +1.0 Cr
              </button>
            </div>
          </div>

          {/* Slot Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span>Assign to Playing XI Slot</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Suggested for {player.role}: Slot {selectedSlotId}
              </span>
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
            >
              {slots.map((s) => {
                const sectionLabel =
                  s.category === 'xi'
                    ? 'Playing XI'
                    : s.category === 'impact'
                    ? '⚡ Impact'
                    : 'Bench';
                const status = s.player
                  ? `[Filled: ${s.player.name} - ₹${s.soldPrice}Cr]`
                  : `[Empty - ${s.suggestedRole}]`;
                return (
                  <option key={s.id} value={s.id}>
                    [{sectionLabel}] Slot {s.id}: {s.slotLabel} ({s.suggestedRole}) {status}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Live Remaining Purse Preview */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Remaining Purse After Bid:</span>
              <div
                className={`text-lg font-black ${
                  isBudgetExceeded ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                ₹{newRemainingPurse.toFixed(2)} Cr
              </div>
            </div>

            <div className="text-right text-xs text-slate-400">
              <span>Current Purse: </span>
              <strong className="text-white">₹{remainingPurse.toFixed(2)} Cr</strong>
            </div>
          </div>

          {/* Warnings */}
          {isOverSafe && !isBudgetExceeded && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Safe Ceiling Warning:</strong> Spending ₹{enteredPrice.toFixed(2)} Cr exceeds your safe reserve limit (₹{maxSafeBid.toFixed(2)} Cr).
              </span>
            </div>
          )}

          {isBudgetExceeded && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Purse Overdrawn:</strong> You do not have enough purse left to pay ₹{enteredPrice.toFixed(2)} Cr!
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Winning Bid & Slot into XI</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
