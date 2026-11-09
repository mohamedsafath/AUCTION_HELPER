import React from 'react';
import { Player, Slot, TargetPlayer } from '../types';
import { ArrowRight, Plane, Sparkles, Check, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface AlternativeSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lostPlayer: Player | null;
  allPlayers: Player[];
  slots: Slot[];
  targets: TargetPlayer[];
  maxSafeBid: number;
  onTargetAlternative: (player: Player, targetMaxPrice: number) => void;
  onDraftAlternative: (player: Player) => void;
}

export const AlternativeSuggestionModal: React.FC<AlternativeSuggestionModalProps> = ({
  isOpen,
  onClose,
  lostPlayer,
  allPlayers,
  slots,
  targets,
  maxSafeBid,
  onTargetAlternative,
  onDraftAlternative,
}) => {
  if (!isOpen || !lostPlayer) return null;

  // Find who is already in XI or already marked lost
  const draftedPlayerIds = new Set(slots.filter((s) => s.player !== null).map((s) => s.player!.id));
  const lostPlayerIds = new Set(targets.filter((t) => t.status === 'lost').map((t) => t.player.id));
  const boughtOverseasCount = slots.filter((s) => s.player?.isOverseas).length;
  const needIndian = boughtOverseasCount >= 4;

  // Filter candidates in the same role
  const candidateAlternatives = allPlayers
    .filter((p) => {
      if (p.id === lostPlayer.id) return false;
      if (p.role !== lostPlayer.role) return false;
      if (draftedPlayerIds.has(p.id)) return false;
      if (lostPlayerIds.has(p.id)) return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize Indian if overseas limit reached
      if (needIndian) {
        if (!a.isOverseas && b.isOverseas) return -1;
        if (a.isOverseas && !b.isOverseas) return 1;
      }
      // Prioritize Marquee / Set 1
      const isMarqueeA = a.marqueeSet.includes('Marquee') ? 2 : a.marqueeSet.includes('Set 1') ? 1 : 0;
      const isMarqueeB = b.marqueeSet.includes('Marquee') ? 2 : b.marqueeSet.includes('Set 1') ? 1 : 0;
      if (isMarqueeA !== isMarqueeB) return isMarqueeB - isMarqueeA;

      // Base price descending
      return b.basePrice - a.basePrice;
    })
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-lg font-bold">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Target Lost
                </span>
                <h3 className="text-lg font-black text-white">
                  Next Alternatives for {lostPlayer.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Role: <strong className="text-amber-400">{lostPlayer.roleFull || lostPlayer.role}</strong> • Set: {lostPlayer.marqueeSet}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overseas Quota Alert if applicable */}
        {needIndian && (
          <div className="mx-4 sm:mx-5 mt-4 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center space-x-2 text-sky-300 text-xs">
            <Plane className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Overseas Cap (4/4) Reached:</strong> We have prioritized top <strong>Indian</strong> alternatives so you comply with IPL Playing XI limits.
            </span>
          </div>
        )}

        {/* Body: List of Top 5 Alternatives */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Recommended Alternatives ({lostPlayer.roleFull || lostPlayer.role})</span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              Safe Purse Ceiling: ₹{maxSafeBid.toFixed(2)} Cr
            </span>
          </div>

          {candidateAlternatives.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No remaining available alternatives found in this category.
            </div>
          ) : (
            candidateAlternatives.map((alt, index) => {
              const isTargeted = targets.some((t) => t.player.id === alt.id && t.status === 'available');

              return (
                <div
                  key={alt.id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-750 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  {/* Left: Player Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-slate-700">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-white">{alt.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {alt.marqueeSet}
                        </span>
                        {alt.isOverseas ? (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-medium inline-flex items-center gap-0.5">
                            <Plane className="w-2.5 h-2.5" /> OS
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">🇮🇳 IND</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                        <span>Base: <strong className="text-slate-200">₹{alt.basePrice.toFixed(2)} Cr</strong></span>
                        {alt.previousSoldPrice && (
                          <span>• Benchmark: <strong className="text-amber-400">₹{alt.previousSoldPrice.toFixed(2)} Cr</strong></span>
                        )}
                        {alt.previousTeam && (
                          <span className="hidden sm:inline">• Ex-{alt.previousTeam}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                    {!isTargeted ? (
                      <button
                        onClick={() => {
                          onTargetAlternative(alt, alt.previousSoldPrice || alt.basePrice * 2.5);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition flex items-center space-x-1"
                        title="Add to target wishlist"
                      >
                        <span>⭐ Target Him</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                        ✓ In Targets
                      </span>
                    )}

                    <button
                      onClick={() => {
                        onDraftAlternative(alt);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 transition flex items-center space-x-1 active:scale-95"
                      title="Draft directly into empty Playing XI slot"
                    >
                      <span>⚡ Draft into XI</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Clicking <strong>Target Him</strong> adds this backup option to your live wishlist.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
