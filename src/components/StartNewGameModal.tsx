import React, { useState } from 'react';
import { AuctionSettings } from '../types';
import {
  RotateCcw,
  X,
  Play,
  Sparkles,
  Users,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Check,
} from 'lucide-react';

interface StartNewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AuctionSettings;
  onConfirmNewGame: (options: {
    teamName: string;
    totalPurse: number;
    keepTargets: boolean;
  }) => void;
}

const IPL_TEAMS = [
  'Chennai Super Kings',
  'Mumbai Indians',
  'Royal Challengers Bengaluru',
  'Kolkata Knight Riders',
  'Rajasthan Royals',
  'Sunrisers Hyderabad',
  'Delhi Capitals',
  'Punjab Kings',
  'Gujarat Titans',
  'Lucknow Super Giants',
];

export const StartNewGameModal: React.FC<StartNewGameModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onConfirmNewGame,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>(currentSettings.teamName);
  const [customTeam, setCustomTeam] = useState<string>('');
  const [purseAmount, setPurseAmount] = useState<number>(currentSettings.totalPurse || 120.0);
  const [keepTargets, setKeepTargets] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleStart = () => {
    const finalTeam = customTeam.trim() || selectedTeam || 'My Auction Team';
    onConfirmNewGame({
      teamName: finalTeam,
      totalPurse: purseAmount > 0 ? purseAmount : 120.0,
      keepTargets,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Start a New Game
              </h3>
              <p className="text-xs text-slate-400">
                Reset squad & purse for a fresh auction
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Warning / Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              This will clear all <strong>25 squad spots</strong> and reset your purse back to full. An undo snapshot is saved in case you change your mind.
            </div>
          </div>

          {/* Select Franchise Team */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Choose Franchise / Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setCustomTeam('');
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            >
              {IPL_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
              <option value="Custom">Custom Team Name...</option>
            </select>

            {selectedTeam === 'Custom' && (
              <input
                type="text"
                value={customTeam}
                onChange={(e) => setCustomTeam(e.target.value)}
                placeholder="Enter custom team name..."
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            )}
          </div>

          {/* Starting Purse Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Starting Total Purse</span>
              <span className="text-amber-400 font-mono font-bold">₹{purseAmount.toFixed(1)} Cr</span>
            </label>
            <div className="flex items-center space-x-2">
              {[120, 100, 90, 80].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPurseAmount(amt)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black border transition active:scale-95 ${
                    purseAmount === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ₹{amt} Cr
                </button>
              ))}
            </div>
          </div>

          {/* Targets Reset Mode Toggle */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Watchlist Preference
            </span>

            <div className="space-y-2">
              <label
                onClick={() => setKeepTargets(true)}
                className={`p-3 rounded-2xl border flex items-start space-x-3 cursor-pointer transition ${
                  keepTargets
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="target_mode"
                  checked={keepTargets}
                  onChange={() => setKeepTargets(true)}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <div className="font-black text-xs text-white flex items-center gap-1.5">
                    <span>Keep Target Watchlist</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Keeps your planned players & budgets, but marks all players as "available" to bid on again.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setKeepTargets(false)}
                className={`p-3 rounded-2xl border flex items-start space-x-3 cursor-pointer transition ${
                  !keepTargets
                    ? 'bg-rose-500/10 border-rose-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="target_mode"
                  checked={!keepTargets}
                  onChange={() => setKeepTargets(false)}
                  className="mt-1 text-rose-500 focus:ring-rose-500"
                />
                <div className="min-w-0">
                  <div className="font-black text-xs text-white">
                    Complete Clean Slate
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Wipes the target list completely to 0 players for a brand new blank start.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start a New Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
