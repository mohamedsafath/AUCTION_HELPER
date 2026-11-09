import React, { useState } from 'react';
import { AuctionSettings, Slot } from '../types';
import {
  Wallet,
  Award,
  FileDown,
  RotateCcw,
  Plane,
  Sparkles,
  Edit2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface PurseMetricsProps {
  settings: AuctionSettings;
  onUpdateSettings: (newSettings: AuctionSettings) => void;
  slots: Slot[];
  onResetXI: () => void;
  onExportPDF: () => void;
}

export const PurseMetrics: React.FC<PurseMetricsProps> = ({
  settings,
  onUpdateSettings,
  slots,
  onResetXI,
  onExportPDF,
}) => {
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamInput, setTeamInput] = useState(settings.teamName);
  const [purseInput, setPurseInput] = useState(settings.totalPurse.toString());
  const [isEditingPurse, setIsEditingPurse] = useState(false);

  // Filter slot groups
  const xiSlots = slots.filter((s) => s.category === 'xi');
  const boughtSlots = slots.filter((s) => s.player !== null);
  const totalBoughtCount = boughtSlots.length;
  const totalSpent = boughtSlots.reduce((sum, s) => sum + (s.soldPrice || 0), 0);
  const remainingPurse = Math.max(0, settings.totalPurse - totalSpent);

  // Overseas counts
  const xiBought = xiSlots.filter((s) => s.player !== null);
  const xiOverseasCount = xiBought.filter((s) => s.player?.isOverseas).length;
  const totalOverseasCount = boughtSlots.filter((s) => s.player?.isOverseas).length;
  const wkBought = xiBought.filter((s) => s.player?.role === 'WK').length;

  // Min 18 / Max 25 squad calculations
  const minRequired = settings.minSquadSize || 18;
  const maxAllowed = settings.maxSquadSize || 25;
  const isMinMet = totalBoughtCount >= minRequired;
  const neededToMin = Math.max(0, minRequired - totalBoughtCount);
  const spotsLeftToMax = Math.max(0, maxAllowed - totalBoughtCount);

  // Max safe bid calculation
  let maxSafeBid = remainingPurse;
  if (!isMinMet) {
    const mandatoryReserve = Math.max(0, neededToMin - 1) * settings.minBasePrice;
    maxSafeBid = Math.max(0, remainingPurse - mandatoryReserve);
  }

  const handleSaveTeam = () => {
    onUpdateSettings({ ...settings, teamName: teamInput.trim() || 'My IPL Squad' });
    setIsEditingTeam(false);
  };

  const handleSavePurse = () => {
    const val = parseFloat(purseInput);
    if (!isNaN(val) && val > 0) {
      onUpdateSettings({ ...settings, totalPurse: val });
    }
    setIsEditingPurse(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Team Name & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
            🏏
          </div>
          <div>
            <div className="flex items-center space-x-2">
              {isEditingTeam ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    className="bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1 text-base font-black text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTeam}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {settings.teamName}
                  </h1>
                  <button
                    onClick={() => setIsEditingTeam(true)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition"
                    title="Rename Franchise"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>IPL Squad Auction Manager</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Min 18 to Max 25 Players</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onResetXI}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700/60"
            title="Clear all 25 squad spots"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onExportPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Roster PDF</span>
          </button>
        </div>
      </div>

      {/* Main Purse Dashboard: Hero Remaining Purse + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 relative z-10">
        {/* HERO CARD: Remaining Purse (5 cols on md) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Remaining Purse
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Spent: ₹{totalSpent.toFixed(2)} Cr
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight flex items-baseline gap-1">
              ₹{remainingPurse.toFixed(2)}{' '}
              <span className="text-sm font-bold text-emerald-300">Crores</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalSpent > settings.totalPurse ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, (totalSpent / settings.totalPurse) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>
              Total Purse:{' '}
              <strong className="text-white">₹{settings.totalPurse.toFixed(2)} Cr</strong>
            </span>
            <button
              onClick={() => setIsEditingPurse(!isEditingPurse)}
              className="text-amber-400 hover:underline text-[10px]"
            >
              Change Budget
            </button>
          </div>

          {isEditingPurse && (
            <div className="mt-2 flex items-center space-x-1.5 bg-slate-950 p-2 rounded-lg border border-amber-500">
              <input
                type="number"
                step="0.5"
                value={purseInput}
                onChange={(e) => setPurseInput(e.target.value)}
                className="w-20 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded"
              />
              <span className="text-xs text-slate-400">Cr</span>
              <button
                onClick={handleSavePurse}
                className="px-2 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* 4 Secondary Metric Tiles (7 cols on md: 4 items in 2x2 grid) */}
        <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
          {/* Tile 1: Max Safe Bid */}
          <div className="bg-slate-950/70 border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-bold flex items-center gap-1">
                Max Safe Bid <Award className="w-3.5 h-3.5 text-indigo-400" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 my-1">
              ₹{maxSafeBid.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">Cr</span>
            </div>
            <span className="text-[10px] text-indigo-400/80">
              {!isMinMet ? `Guarantees min 18 spots` : `Full budget safe`}
            </span>
          </div>

          {/* Tile 2: Squad Size (18 to 25) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-1">
                Squad Size <Users className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                  !isMinMet
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {!isMinMet ? `Need ${neededToMin}` : 'Min Met ✓'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white my-1">
              {totalBoughtCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ 25</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Target: 18 min • 25 max
            </span>
          </div>

          {/* Tile 3: Playing XI Overseas (Max 4) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-sky-300 flex items-center gap-1">
                XI Overseas <Plane className="w-3.5 h-3.5 text-sky-400" />
              </span>
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                  xiOverseasCount > 4
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {xiOverseasCount > 4 ? 'VIOLATION' : 'Playing XI'}
              </span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-black my-1 ${
                xiOverseasCount > 4 ? 'text-rose-400' : 'text-sky-300'
              }`}
            >
              {xiOverseasCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ 4 max</span>
            </div>
            <span className="text-[10px] text-slate-400">Starting XI Quota</span>
          </div>

          {/* Tile 4: Squad Overseas (Max 8) & WK */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                Total Overseas <Plane className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                  totalOverseasCount > 8
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {totalOverseasCount > 8 ? 'VIOLATION' : `${totalOverseasCount}/8`}
              </span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-black my-1 ${
                totalOverseasCount > 8 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {totalOverseasCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ 8 max</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>WK in XI:</span>
              <strong className={wkBought >= 1 ? 'text-emerald-400' : 'text-amber-400'}>
                {wkBought >= 1 ? `✓ ${wkBought} WK` : '0 (Need 1)'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Squad Progress Bar towards 18 and 25 */}
      <div className="pt-2 border-t border-slate-800/60 relative z-10">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            {!isMinMet ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Need {neededToMin} more player{neededToMin > 1 ? 's' : ''} to meet mandatory IPL minimum (18)
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mandatory Minimum Met ({totalBoughtCount} Players) • {spotsLeftToMax} expansion slots available
              </span>
            )}
          </span>
          <span className="text-[11px] text-slate-400">
            Min 18 • Max 25
          </span>
        </div>

        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-slate-800 relative">
          <div
            className={`h-full transition-all duration-500 ${
              !isMinMet ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (totalBoughtCount / maxAllowed) * 100)}%` }}
          />
          {/* 18 Mark pin */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-sm"
            style={{ left: `${(18 / 25) * 100}%` }}
            title="Mandatory 18 Players Mark"
          />
        </div>
      </div>

      {/* Warnings */}
      {totalOverseasCount > 8 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Squad Overseas Limit Exceeded:</strong> You have {totalOverseasCount} overseas players (Maximum 8 permitted in the total squad).
          </span>
        </div>
      )}

      {xiOverseasCount > 4 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Playing XI Overseas Limit Exceeded:</strong> You have {xiOverseasCount} overseas players in your starting lineup (Maximum 4 allowed in XI).
          </span>
        </div>
      )}
    </div>
  );
};
