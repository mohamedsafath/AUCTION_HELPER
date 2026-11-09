import React, { useState, useMemo } from 'react';
import { Player, Slot, TargetPlayer, PlayerRole } from '../types';
import { getSetMeta, getOrderedSetSummaries, SetSummary } from '../utils/setInfo';
import {
  Layers,
  Target,
  Sparkles,
  Plane,
  Gavel,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Search,
  Zap,
  TrendingUp,
  Star,
  Clock,
  Radio,
  Eye,
  Plus,
  Edit2,
  Check,
} from 'lucide-react';

interface SetWiseAuctionTrackerProps {
  allPlayers: Player[];
  slots: Slot[];
  targets: TargetPlayer[];
  liveSetCode: string;
  onSetLiveSetCode: (code: string) => void;
  onDraftPlayer: (player: Player) => void;
  onMarkLost: (targetId: string, player: Player) => void;
  onAddTarget: (player: Player, targetMaxPrice: number, priority: 'Must-Have' | 'High' | 'Backup') => void;
  onUpdateTargetBudget: (targetId: string, newBudget: number) => void;
}

export const SetWiseAuctionTracker: React.FC<SetWiseAuctionTrackerProps> = ({
  allPlayers,
  slots,
  targets,
  liveSetCode,
  onSetLiveSetCode,
  onDraftPlayer,
  onMarkLost,
  onAddTarget,
  onUpdateTargetBudget,
}) => {
  const [selectedSetCode, setSelectedSetCode] = useState<string>(liveSetCode || 'Marquee Set 1');
  const [viewMode, setViewMode] = useState<'EXPLORER' | 'ROADMAP'>('EXPLORER');
  const [setFilterCategory, setSetFilterCategory] = useState<'ALL' | 'WITH_TARGETS' | 'MARQUEE' | 'CAPPED' | 'UNCAPPED'>('ALL');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  // Editing budget inline state
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState<string>('');

  // Drafted players map: playerId -> slot
  const draftedMap = useMemo(() => {
    const map = new Map<string, Slot>();
    slots.forEach((s) => {
      if (s?.player?.id) {
        map.set(s.player.id, s);
      }
    });
    return map;
  }, [slots]);

  // Target map: playerId -> TargetPlayer
  const targetMap = useMemo(() => {
    const map = new Map<string, TargetPlayer>();
    targets.forEach((t) => {
      if (t?.player?.id) {
        map.set(t.player.id, t);
      }
    });
    return map;
  }, [targets]);

  // Alternative player map: backupPlayerId -> primary target
  const altMap = useMemo(() => {
    const map = new Map<string, TargetPlayer>();
    targets.forEach((t) => {
      if (t?.backupPlayerId) {
        map.set(t.backupPlayerId, t);
      }
    });
    return map;
  }, [targets]);

  // Ordered summaries for all 47 sets
  const allSetSummaries = useMemo(() => {
    return getOrderedSetSummaries(allPlayers);
  }, [allPlayers]);

  // Count target players per set
  const setTargetStats = useMemo(() => {
    const map = new Map<string, { count: number; totalBudget: number; activeCount: number }>();
    targets.forEach((t) => {
      if (!t || !t.player) return;
      const setCode = t.player.marqueeSet || 'Unspecified Set';
      const existing = map.get(setCode) || { count: 0, totalBudget: 0, activeCount: 0 };
      map.set(setCode, {
        count: existing.count + 1,
        totalBudget: existing.totalBudget + (t.targetMaxPrice || 0),
        activeCount: existing.activeCount + (t.status === 'available' ? 1 : 0),
      });
    });
    return map;
  }, [targets]);

  // Total sets with targets
  const setsWithTargetsCount = useMemo(() => {
    let count = 0;
    setTargetStats.forEach((v) => {
      if (v.count > 0) count++;
    });
    return count;
  }, [setTargetStats]);

  // Filtered sets list based on category filter
  const filteredSets = useMemo(() => {
    return allSetSummaries.filter((summary) => {
      if (!summary || !summary.meta) return false;
      const targetStat = setTargetStats.get(summary.meta.code);
      const hasTargets = (targetStat?.count || 0) > 0;

      if (setFilterCategory === 'WITH_TARGETS') {
        return hasTargets;
      }
      if (setFilterCategory === 'MARQUEE') {
        return summary.meta.category === 'Marquee' || summary.meta.category === 'Special';
      }
      if (setFilterCategory === 'CAPPED') {
        return summary.meta.category === 'Capped';
      }
      if (setFilterCategory === 'UNCAPPED') {
        return summary.meta.category === 'Uncapped';
      }
      return true;
    });
  }, [allSetSummaries, setFilterCategory, setTargetStats]);

  // Currently selected set summary
  const currentSetSummary = useMemo(() => {
    if (!allSetSummaries || allSetSummaries.length === 0) return null;
    return (
      allSetSummaries.find((s) => s.meta.code === selectedSetCode) ||
      allSetSummaries[0]
    );
  }, [allSetSummaries, selectedSetCode]);

  // Target players in the currently selected set
  const targetsInCurrentSet = useMemo(() => {
    if (!currentSetSummary || !Array.isArray(currentSetSummary.players)) return [];
    return currentSetSummary.players
      .map((player, index) => {
        if (!player) return null;
        const target = targetMap.get(player.id);
        if (!target) return null;
        return {
          target,
          player,
          orderInSet: index + 1,
          totalInSet: currentSetSummary.players.length,
        };
      })
      .filter(Boolean) as {
      target: TargetPlayer;
      player: Player;
      orderInSet: number;
      totalInSet: number;
    }[];
  }, [currentSetSummary, targetMap]);

  // Quick navigation: prev / next set
  const currentSetIndex = allSetSummaries.findIndex((s) => s.meta.code === selectedSetCode);
  const handlePrevSet = () => {
    if (currentSetIndex > 0) {
      setSelectedSetCode(allSetSummaries[currentSetIndex - 1].meta.code);
    }
  };
  const handleNextSet = () => {
    if (currentSetIndex < allSetSummaries.length - 1) {
      setSelectedSetCode(allSetSummaries[currentSetIndex + 1].meta.code);
    }
  };

  // Jump to player's set from search
  const searchedPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) return [];
    const q = playerSearchQuery.toLowerCase();
    return allPlayers
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [allPlayers, playerSearchQuery]);

  const handleSelectSearchedPlayer = (player: Player) => {
    if (player.marqueeSet) {
      setSelectedSetCode(player.marqueeSet);
      setPlayerSearchQuery('');
    }
  };

  const handleSaveBudget = (targetId: string) => {
    const val = parseFloat(editingBudgetValue);
    if (!isNaN(val) && val > 0) {
      onUpdateTargetBudget(targetId, val);
    }
    setEditingBudgetId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden space-y-0">
      {/* 1. Header & Live Set Bar */}
      <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                SET-WISE AUCTION TRACKER
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  47 Sets • Sequential Order
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live auction breakdown by sets. Highlights upcoming target players so you never miss them in the order!
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Live Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('EXPLORER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'EXPLORER'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Set Explorer</span>
            </button>
            <button
              onClick={() => setViewMode('ROADMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'ROADMAP'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Target Roadmap ({setsWithTargetsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-3 bg-slate-950/70 border-b border-slate-800/60 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Current Set:</span>
          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {currentSetSummary?.meta.code}
          </span>
          {liveSetCode === currentSetSummary?.meta.code && (
            <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Targets in Set:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              targetsInCurrentSet.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-500'
            }`}
          >
            {targetsInCurrentSet.length} Target{targetsInCurrentSet.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Total Sets with Targets:</span>
          <button
            onClick={() => setSetFilterCategory('WITH_TARGETS')}
            className="font-bold text-indigo-400 hover:underline"
          >
            {setsWithTargetsCount} of 47 Sets
          </button>
        </div>

        {/* Fast Player Search to Jump to Set */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Find player's set..."
            value={playerSearchQuery}
            onChange={(e) => setPlayerSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchedPlayers.length > 0 && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              {searchedPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectSearchedPlayer(p)}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white"
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {p.marqueeSet}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 text-xs">
          <button
            onClick={() => setSetFilterCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
              setFilterCategory === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            All Sets (47)
          </button>
          <button
            onClick={() => setSetFilterCategory('WITH_TARGETS')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center space-x-1 ${
              setFilterCategory === 'WITH_TARGETS'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span>🎯 Sets with Targets</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-amber-200">
              {setsWithTargetsCount}
            </span>
          </button>
          <button
            onClick={() => setSetFilterCategory('MARQUEE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
              setFilterCategory === 'MARQUEE'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Marquee & Special (5)
          </button>
          <button
            onClick={() => setSetFilterCategory('CAPPED')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
              setFilterCategory === 'CAPPED'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Capped (11)
          </button>
          <button
            onClick={() => setSetFilterCategory('UNCAPPED')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
              setFilterCategory === 'UNCAPPED'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Uncapped (31)
          </button>
        </div>

        {/* Set Live Set Button */}
        <div className="flex items-center space-x-2">
          {liveSetCode !== currentSetSummary?.meta.code ? (
            <button
              onClick={() => onSetLiveSetCode(currentSetSummary?.meta.code || '')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center space-x-1"
              title="Set this set as the currently active auction set"
            >
              <Radio className="w-3 h-3 text-rose-400" />
              <span>Mark as Live Set</span>
            </button>
          ) : (
            <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-rose-500/30 text-rose-300 border border-rose-500/50 flex items-center space-x-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Currently Live in Auction</span>
            </span>
          )}
        </div>
      </div>

      {/* 4. Horizontal Set Pills Carousel */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-2">
        <button
          onClick={handlePrevSet}
          disabled={currentSetIndex === 0}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-thin flex-1">
          {filteredSets.map((summary) => {
            const isSelected = summary.meta.code === selectedSetCode;
            const isLive = summary.meta.code === liveSetCode;
            const stat = setTargetStats.get(summary.meta.code);
            const targetCount = stat?.count || 0;
            const activeTargetCount = stat?.activeCount || 0;

            return (
              <button
                key={summary.meta.code}
                onClick={() => setSelectedSetCode(summary.meta.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 border ${
                  isSelected
                    ? 'bg-slate-800 text-white border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{summary.meta.icon}</span>
                <span className="tracking-wide">{summary.meta.shortLabel}</span>

                {/* Target badge */}
                {targetCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      activeTargetCount > 0
                        ? 'bg-amber-500 text-slate-950 shadow-sm animate-pulse'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    🎯 {targetCount}
                  </span>
                )}

                {/* Live indicator */}
                {isLive && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNextSet}
          disabled={currentSetIndex === allSetSummaries.length - 1}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Main Body: Switch between EXPLORER and ROADMAP */}
      {viewMode === 'EXPLORER' ? (
        <div className="p-5 space-y-5">
          {/* Active Set Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{currentSetSummary?.meta.icon}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-white">
                    {currentSetSummary?.meta.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {currentSetSummary?.meta.category}
                  </span>
                  {liveSetCode === currentSetSummary?.meta.code && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      🔴 LIVE AUCTION SET
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {currentSetSummary?.totalPlayers} players in this set •{' '}
                  {currentSetSummary?.overseasCount} Overseas •{' '}
                  {currentSetSummary?.cappedCount} Capped
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Quick Set Jump:</span>
              <select
                value={selectedSetCode}
                onChange={(e) => setSelectedSetCode(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
              >
                {allSetSummaries.map((s) => {
                  const stat = setTargetStats.get(s.meta.code);
                  return (
                    <option key={s.meta.code} value={s.meta.code}>
                      {s.meta.shortLabel} - {s.meta.name}{' '}
                      {stat?.count ? `(🎯 ${stat.count} Targets)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* CRITICAL FEATURE: TARGET SPOTLIGHT IN THIS SET */}
          {targetsInCurrentSet.length > 0 ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-950 border-2 border-amber-500/60 shadow-lg shadow-amber-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    ⚠️
                  </div>
                  <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                    TARGET PLAYERS IN THIS SET ({targetsInCurrentSet.length})
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-amber-200/80 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  Keep purse reserved! Don't miss players below
                </span>
              </div>

              {/* Spotlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {targetsInCurrentSet.map(({ target, player, orderInSet, totalInSet }) => {
                  const draftedSlot = draftedMap.get(player.id);
                  const isBought = target.status === 'bought' || draftedSlot !== undefined;
                  const isLost = target.status === 'lost';
                  const isLowerDown = orderInSet > 3;

                  return (
                    <div
                      key={target.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                        isBought
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : isLost
                          ? 'bg-rose-950/20 border-rose-500/40 opacity-70'
                          : 'bg-slate-900/90 border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                      }`}
                    >
                      {/* Top: Position & Name */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          {/* Order in set badge */}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              isLowerDown
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 text-amber-300 border-slate-700'
                            }`}
                          >
                            #{orderInSet} of {totalInSet} in this Set
                            {isLowerDown && ' (Coming up lower!)'}
                          </span>

                          {/* Priority badge */}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              target.priority === 'Must-Have'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : target.priority === 'High'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {target.priority}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-black text-white text-base">
                            {player.name}
                          </span>
                          {player.isOverseas && (
                            <span title="Overseas Player">✈️</span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {player.roleFull || player.role}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>Base: ₹{player.basePrice.toFixed(2)} Cr</span>
                          {player.previousSoldPrice && (
                            <span>• Prev: ₹{player.previousSoldPrice.toFixed(2)} Cr</span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Planned Budget & Status */}
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Planned Budget
                          </div>
                          {editingBudgetId === target.id ? (
                            <div className="flex items-center space-x-1 mt-0.5">
                              <span className="text-emerald-400 font-bold">₹</span>
                              <input
                                type="number"
                                step="0.25"
                                autoFocus
                                value={editingBudgetValue}
                                onChange={(e) => setEditingBudgetValue(e.target.value)}
                                className="w-16 px-1.5 py-0.5 text-xs rounded bg-slate-900 border border-emerald-500 text-white font-bold"
                              />
                              <button
                                onClick={() => handleSaveBudget(target.id)}
                                className="p-1 rounded bg-emerald-600 text-white"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 mt-0.5">
                              <span className="text-emerald-400 font-black text-sm">
                                ₹{target.targetMaxPrice.toFixed(2)} Cr
                              </span>
                              <button
                                onClick={() => {
                                  setEditingBudgetId(target.id);
                                  setEditingBudgetValue(target.targetMaxPrice.toString());
                                }}
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                                title="Edit Budget"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          {isBought ? (
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              WON {draftedSlot && `(${draftedSlot.slotLabel})`}
                            </span>
                          ) : isLost ? (
                            <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              LOST
                            </span>
                          ) : (
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5" />
                              AVAILABLE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes / Alternative if linked */}
                      {target.notes && (
                        <div className="text-[11px] text-slate-300 bg-slate-800/60 px-2 py-1 rounded border border-slate-700/60">
                          {target.notes}
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isBought && (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => onDraftPlayer(player)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>Won Bid</span>
                          </button>
                          {!isLost && (
                            <button
                              onClick={() => onMarkLost(target.id, player)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition"
                              title="Mark Lost & Find Alternative"
                            >
                              Lost
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>ℹ️</span>
                <span>
                  No targeted players in <strong>{currentSetSummary?.meta.name}</strong>. You can scout this set or add players below.
                </span>
              </div>
              <span className="text-slate-500">
                {currentSetSummary?.players.length} players available in this set
              </span>
            </div>
          )}

          {/* Sequential Players in this Set Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                All Players in {currentSetSummary?.meta.shortLabel} (Sequential Auction Order)
              </h4>
              <span className="text-[11px] text-slate-400">
                Highlighted rows are in your Target Watchlist
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3"># Order</th>
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-right">Base Price</th>
                      <th className="py-2.5 px-3 text-right">Prev Price</th>
                      <th className="py-2.5 px-3 text-center">Target Status</th>
                      <th className="py-2.5 px-3 text-right">Planned Budget</th>
                      <th className="py-2.5 px-3 text-center">Squad Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentSetSummary?.players.map((player, index) => {
                      const target = targetMap.get(player.id);
                      const isTarget = target !== undefined;
                      const draftedSlot = draftedMap.get(player.id);
                      const isBought = isTarget ? target.status === 'bought' || draftedSlot !== undefined : draftedSlot !== undefined;
                      const isLost = isTarget && target.status === 'lost';
                      const isAlt = altMap.has(player.id);

                      return (
                        <tr
                          key={player.id}
                          className={`transition ${
                            isTarget
                              ? 'bg-amber-500/10 hover:bg-amber-500/15 font-medium border-l-4 border-l-amber-500'
                              : isAlt
                              ? 'bg-indigo-500/5 hover:bg-indigo-500/10 border-l-4 border-l-indigo-500'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Order Number */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            #{index + 1}
                          </td>

                          {/* Player Name */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white">
                                {player.name}
                              </span>
                              {player.isOverseas && (
                                <span title="Overseas Player">✈️</span>
                              )}
                              {isTarget && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 uppercase">
                                  Target
                                </span>
                              )}
                              {isAlt && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Alternative
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {player.roleFull || player.role}
                            </span>
                          </td>

                          {/* Base Price */}
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            ₹{player.basePrice.toFixed(2)} Cr
                          </td>

                          {/* Prev Sold Price */}
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {player.previousSoldPrice ? `₹${player.previousSoldPrice.toFixed(2)} Cr` : '—'}
                          </td>

                          {/* Target Status */}
                          <td className="py-2.5 px-3 text-center">
                            {isTarget ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  target.priority === 'Must-Have'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : target.priority === 'High'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {target.priority}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Target Planned Budget */}
                          <td className="py-2.5 px-3 text-right font-mono">
                            {isTarget ? (
                              <span className="font-bold text-emerald-400">
                                ₹{target.targetMaxPrice.toFixed(2)} Cr
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Squad Status */}
                          <td className="py-2.5 px-3 text-center">
                            {draftedSlot ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Won ({draftedSlot.slotLabel})
                              </span>
                            ) : isLost ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Lost
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium">
                                Available
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {!draftedSlot && (
                                <button
                                  onClick={() => onDraftPlayer(player)}
                                  className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 transition shadow-sm"
                                  title="Record winning bid / Draft"
                                >
                                  <Gavel className="w-3 h-3" />
                                  <span>Win</span>
                                </button>
                              )}

                              {!isTarget && !draftedSlot && (
                                <button
                                  onClick={() => {
                                    const defaultBenchmark =
                                      player.previousSoldPrice || player.basePrice * 2.5 || 5.0;
                                    onAddTarget(player, defaultBenchmark, 'High');
                                  }}
                                  className="px-2 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center space-x-1"
                                  title="Add to Target Watchlist"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Target</span>
                                </button>
                              )}

                              {isTarget && !draftedSlot && !isLost && (
                                <button
                                  onClick={() => onMarkLost(target.id, player)}
                                  className="px-2 py-1 text-xs font-semibold rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                                  title="Mark Lost & Find Alternative"
                                >
                                  Lost
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View Mode B: TARGET ROADMAP ACROSS ALL SETS */
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>🗺️</span>
                Auction Set Roadmap: Target Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Visual chronological timeline of all sets where you have planned targets.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
              {setsWithTargetsCount} Sets with Targets Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSetSummaries
              .filter((s) => (setTargetStats.get(s.meta.code)?.count || 0) > 0)
              .map((summary) => {
                const stat = setTargetStats.get(summary.meta.code);
                const isLive = summary.meta.code === liveSetCode;
                const isSelected = summary.meta.code === selectedSetCode;

                // Find target players in this set
                const targetsHere = summary.players
                  .map((p, idx) => {
                    const t = targetMap.get(p.id);
                    return t ? { target: t, player: p, order: idx + 1 } : null;
                  })
                  .filter(Boolean) as { target: TargetPlayer; player: Player; order: number }[];

                return (
                  <div
                    key={summary.meta.code}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                      isLive
                        ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40'
                        : isSelected
                        ? 'bg-slate-850 border-amber-500/60'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{summary.meta.icon}</span>
                          <div>
                            <span className="font-black text-white text-sm">
                              {summary.meta.name}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {summary.totalPlayers} total players in set
                            </div>
                          </div>
                        </div>

                        {isLive && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            🔴 LIVE
                          </span>
                        )}
                      </div>

                      {/* Budget summary */}
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs mb-3">
                        <span className="text-slate-400">Planned Budget:</span>
                        <span className="font-bold text-emerald-400">
                          ₹{(stat?.totalBudget || 0).toFixed(2)} Cr
                        </span>
                      </div>

                      {/* List of targets in this set */}
                      <div className="space-y-1.5">
                        {targetsHere.map(({ target, player, order }) => {
                          const draftedSlot = draftedMap.get(player.id);
                          const isBought = target.status === 'bought' || draftedSlot !== undefined;

                          return (
                            <div
                              key={target.id}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                isBought
                                  ? 'bg-emerald-950/20 border-emerald-500/30'
                                  : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <span className="font-mono text-[10px] font-bold text-amber-400 shrink-0">
                                  #{order}
                                </span>
                                <span className="font-semibold text-white truncate">
                                  {player.name}
                                </span>
                                {player.isOverseas && <span>✈️</span>}
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-[11px] font-bold text-emerald-400">
                                  ₹{target.targetMaxPrice.toFixed(2)} Cr
                                </span>
                                {isBought ? (
                                  <span className="text-[10px] font-black text-emerald-400">
                                    WON
                                  </span>
                                ) : (
                                  <span
                                    className={`text-[9px] font-bold px-1 rounded ${
                                      target.priority === 'Must-Have'
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {target.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSetCode(summary.meta.code);
                        setViewMode('EXPLORER');
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1"
                    >
                      <span>Explore this Set ({summary.meta.shortLabel})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
