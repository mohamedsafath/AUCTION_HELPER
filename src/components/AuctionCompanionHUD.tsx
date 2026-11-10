import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Player, Slot, TargetPlayer, AuctionSettings, PlayerRole } from '../types';
import { getSetMeta, getOrderedSetSummaries } from '../utils/setInfo';
import {
  Gavel,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Undo2,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  Plane,
  Plus,
  Minus,
  Edit2,
  Check,
  Trash2,
  Layers,
  Users,
  Eye,
  Zap,
  Radio,
  Wallet,
  FileDown,
  RefreshCw,
  RotateCcw,
  Flame,
  Star,
  Shield,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface AuctionCompanionHUDProps {
  settings: AuctionSettings;
  slots: Slot[];
  targets: TargetPlayer[];
  allPlayers: Player[];
  liveSetCode: string;
  onSetLiveSetCode: (code: string) => void;
  onDraftPlayer: (player: Player) => void;
  onMarkLost: (targetId: string, player: Player) => void;
  onAddTarget: (player: Player, targetMaxPrice: number, priority: 'Must-Have' | 'High' | 'Medium' | 'Backup', targetPrice?: number) => void;
  onUpdateTargetBudget: (targetId: string, newMaxBudget: number, newTargetPrice?: number) => void;
  onRemoveTarget: (targetId: string) => void;
  onOpenAssignModal: (slotId: number) => void;
  onRemovePlayer: (slotId: number) => void;
  onUpdateSlotPrice: (slotId: number, price: number) => void;
  onOpenAIImport: () => void;
  onUndo: () => void;
  historyCount: number;
  isStandalonePopup: boolean;
  onOpenPopoutWindow: () => void;
  onToggleFullView: () => void;
  isFullView: boolean;
  onStartNewGame: () => void;
}

export const AuctionCompanionHUD: React.FC<AuctionCompanionHUDProps> = ({
  settings,
  slots,
  targets,
  allPlayers,
  liveSetCode,
  onSetLiveSetCode,
  onDraftPlayer,
  onMarkLost,
  onAddTarget,
  onUpdateTargetBudget,
  onRemoveTarget,
  onOpenAssignModal,
  onRemovePlayer,
  onUpdateSlotPrice,
  onOpenAIImport,
  onUndo,
  historyCount,
  isStandalonePopup,
  onOpenPopoutWindow,
  onToggleFullView,
  isFullView,
  onStartNewGame,
}) => {
  // Mobile Bottom Navigation Tab ('LIVE' | 'TARGETS' | 'SQUAD' | 'SCOUT' | 'PURSE')
  const [activeTab, setActiveTab] = useState<'LIVE' | 'TARGETS' | 'SQUAD' | 'SCOUT' | 'PURSE'>('LIVE');

  // Search input for Fast Record Win
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Set Tracker selection
  const [activeSetCode, setActiveSetCode] = useState<string>(liveSetCode || 'Marquee Set 1');

  // Targets tab priority filter
  const [targetPriorityFilter, setTargetPriorityFilter] = useState<'ALL' | 'Must-Have' | 'High' | 'Medium' | 'Backup'>('ALL');

  // Squad tab category filter ('XI' | 'IMPACT' | 'BENCH')
  const [squadSubTab, setSquadSubTab] = useState<'XI' | 'IMPACT' | 'BENCH'>('XI');

  // Scout tab filters
  const [scoutRoleFilter, setScoutRoleFilter] = useState<PlayerRole | 'ALL' | 'OVERSEAS'>('ALL');
  const [scoutSearchQuery, setScoutSearchQuery] = useState('');

  // Inline target budget editing
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState<string>('');

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync active set with prop if updated elsewhere
  useEffect(() => {
    if (liveSetCode && liveSetCode !== activeSetCode) {
      setActiveSetCode(liveSetCode);
    }
  }, [liveSetCode]);

  // Set Summaries
  const orderedSets = useMemo(() => getOrderedSetSummaries(allPlayers), [allPlayers]);
  const currentSetIndex = orderedSets.findIndex((s) => s.meta.code === activeSetCode);
  const currentSetSummary = orderedSets[currentSetIndex] || orderedSets[0];

  // Drafted players set
  const draftedPlayerIds = useMemo(() => {
    return new Set(slots.filter((s) => s.player !== null).map((s) => s.player!.id));
  }, [slots]);

  // Calculations for Purse & Rules
  const boughtSlots = slots.filter((s) => s.player !== null);
  const totalSpent = boughtSlots.reduce((sum, s) => sum + (s.soldPrice || 0), 0);
  const remainingPurse = Math.max(0, settings.totalPurse - totalSpent);
  const purseSpentPercent = Math.min(100, (totalSpent / settings.totalPurse) * 100);

  const minRequired = settings.minSquadSize || 18;
  const isMinMet = boughtSlots.length >= minRequired;
  const neededToMin = Math.max(0, minRequired - boughtSlots.length);

  let maxSafeBid = remainingPurse;
  if (!isMinMet) {
    const mandatoryReserve = Math.max(0, neededToMin - 1) * settings.minBasePrice;
    maxSafeBid = Math.max(0, remainingPurse - mandatoryReserve);
  }

  const xiSlots = slots.slice(0, 11);
  const impactSlot = slots.find((s) => s.category === 'impact');
  const benchSlots = slots.filter((s) => s.category === 'bench');

  const filledXICount = xiSlots.filter((s) => s.player !== null).length;
  const totalOverseas = boughtSlots.filter((s) => s.player?.isOverseas).length;
  const xiOverseas = xiSlots.filter((s) => s.player?.isOverseas).length;

  // Fast search matches
  const fastMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPlayers
      .filter((p) => !draftedPlayerIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, allPlayers, draftedPlayerIds]);

  // Active set players & targets
  const playersInActiveSet = useMemo(() => {
    return allPlayers.filter((p) => (p.marqueeSet || 'Unspecified Set') === activeSetCode);
  }, [allPlayers, activeSetCode]);

  const targetsInActiveSet = useMemo(() => {
    const setIds = new Set(playersInActiveSet.map((p) => p.id));
    return targets.filter((t) => setIds.has(t.player.id));
  }, [playersInActiveSet, targets]);

  // Separate targeted players (sorted by priority & status) vs remaining players in active set
  const { targetedInActiveSet, otherPlayersInActiveSet } = useMemo(() => {
    const targetMap = new Map(targets.map((t) => [t.player.id, t]));
    const targeted: Player[] = [];
    const others: Player[] = [];

    for (const p of playersInActiveSet) {
      if (targetMap.has(p.id)) {
        targeted.push(p);
      } else {
        others.push(p);
      }
    }

    const priorityWeight: Record<string, number> = {
      'Must-Have': 4,
      High: 3,
      Medium: 2,
      Backup: 1,
    };

    // Sort targeted players: available targets first, then by priority (Must-Have > High > Medium > Backup)
    targeted.sort((a, b) => {
      const tA = targetMap.get(a.id);
      const tB = targetMap.get(b.id);
      const isDraftedA = draftedPlayerIds.has(a.id);
      const isDraftedB = draftedPlayerIds.has(b.id);
      const isLostA = tA?.status === 'lost';
      const isLostB = tB?.status === 'lost';

      const activeA = !isDraftedA && !isLostA ? 1 : 0;
      const activeB = !isDraftedB && !isLostB ? 1 : 0;
      if (activeA !== activeB) return activeB - activeA;

      const pA = tA?.priority ? priorityWeight[tA.priority] || 0 : 0;
      const pB = tB?.priority ? priorityWeight[tB.priority] || 0 : 0;
      return pB - pA;
    });

    return { targetedInActiveSet: targeted, otherPlayersInActiveSet: others };
  }, [playersInActiveSet, targets, draftedPlayerIds]);

  // Filtered targets in TARGETS tab
  const filteredTargets = useMemo(() => {
    if (targetPriorityFilter === 'ALL') return targets;
    return targets.filter((t) => t.priority === targetPriorityFilter);
  }, [targets, targetPriorityFilter]);

  // Scout filtered players (sorted with targets first)
  const scoutFilteredPlayers = useMemo(() => {
    let list = allPlayers.filter((p) => !draftedPlayerIds.has(p.id));

    if (scoutRoleFilter === 'OVERSEAS') {
      list = list.filter((p) => p.isOverseas);
    } else if (scoutRoleFilter !== 'ALL') {
      list = list.filter((p) => p.role === scoutRoleFilter);
    }

    if (scoutSearchQuery.trim()) {
      const q = scoutSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.roleFull && p.roleFull.toLowerCase().includes(q)) ||
          (p.marqueeSet && p.marqueeSet.toLowerCase().includes(q))
      );
    }

    // Show targeted players first in Scout
    const targetSet = new Set(targets.map((t) => t.player.id));
    list.sort((a, b) => {
      const aTarget = targetSet.has(a.id) ? 1 : 0;
      const bTarget = targetSet.has(b.id) ? 1 : 0;
      return bTarget - aTarget;
    });

    return list.slice(0, 40);
  }, [allPlayers, draftedPlayerIds, scoutRoleFilter, scoutSearchQuery, targets]);

  // Role Badge Helper
  const renderRoleBadge = (role: PlayerRole) => {
    switch (role) {
      case 'BAT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <span>🏏</span>
            <span>BAT</span>
          </span>
        );
      case 'BOWL':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span>🎯</span>
            <span>BOWL</span>
          </span>
        );
      case 'AR':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <span>⚡</span>
            <span>ALL</span>
          </span>
        );
      case 'WK':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <span>🧤</span>
            <span>WK</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Quick budget stepper
  const handleStepBudget = (targetId: string, currentTarget: TargetPlayer, delta: number) => {
    const newMax = Math.max(0.3, +(currentTarget.targetMaxPrice + delta).toFixed(2));
    const newTarget = currentTarget.targetPrice ? Math.max(0.3, +(currentTarget.targetPrice + delta).toFixed(2)) : newMax;
    onUpdateTargetBudget(targetId, newMax, newTarget);
  };

  // Reusable card renderer for players in active set
  const renderLiveSetPlayerCard = (player: Player) => {
    const target = targets.find((t) => t.player.id === player.id);
    const isDrafted = draftedPlayerIds.has(player.id);
    const isLost = target?.status === 'lost';

    return (
      <div
        key={player.id}
        className={`p-3 rounded-2xl border transition-all ${
          isDrafted
            ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
            : isLost
            ? 'bg-rose-950/20 border-rose-900/40 opacity-70'
            : target
            ? 'bg-gradient-to-r from-amber-950/25 via-slate-900 to-slate-900 border-amber-500/45 shadow-md'
            : 'bg-slate-900 border-slate-800/90 hover:border-slate-700'
        }`}
      >
        {/* Top Row: Name, Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="font-black text-sm text-white tracking-tight truncate">
                {player.name}
              </span>
              {player.isOverseas && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold inline-flex items-center gap-0.5 border border-cyan-500/30">
                  <Plane className="w-2.5 h-2.5" /> OS
                </span>
              )}
              {renderRoleBadge(player.role)}
              {target && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                    target.priority === 'Must-Have'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : target.priority === 'High'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {target.priority}
                </span>
              )}
            </div>

            {/* Base Price & Planned Budget */}
            <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400 flex-wrap gap-y-1">
              <span>
                Base: <strong className="text-white">₹{player.basePrice} Cr</strong>
              </span>
              {target && (
                <span className="inline-flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                  <span className="text-slate-400">Target:</span>
                  <strong className="text-amber-400 font-bold">
                    ₹{(target.targetPrice || target.targetMaxPrice).toFixed(1)} Cr
                  </strong>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Max:</span>
                  <strong className="text-emerald-400 font-bold">
                    ₹{target.targetMaxPrice.toFixed(1)} Cr
                  </strong>
                </span>
              )}
            </div>

            {/* Form stats if present */}
            {target?.form && (
              <div className="mt-1.5 text-[10px] text-slate-300 bg-slate-950/90 px-2 py-1 rounded border border-slate-800 leading-tight">
                <span className="text-amber-400 font-bold mr-1">📊 Form:</span>
                <span>{target.form}</span>
              </div>
            )}

            {/* Alternative note if present */}
            {target?.notes && (
              <div className="mt-1 text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                <span className="text-indigo-400 shrink-0">🔄</span>
                <span className="truncate">{target.notes}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0 self-start mt-0.5">
            {isDrafted ? (
              <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
                ✓ In Squad
              </span>
            ) : isLost ? (
              <span className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                Lost
              </span>
            ) : (
              <>
                {/* Big Green/Gold WON Button */}
                <button
                  onClick={() => onDraftPlayer(player)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 active:scale-95 transition"
                  title="Record Winning Bid"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>WON</span>
                </button>

                {/* Big Red LOST Button if Targeted, else Add Button */}
                {target ? (
                  <button
                    onClick={() => onMarkLost(target.id, player)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-black text-xs active:scale-95 transition"
                    title="Mark as Lost (Opens Alternatives)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onAddTarget(player, player.basePrice * 2 || 2.0, 'High')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 active:scale-95 transition"
                    title="Add to Watchlist"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* =========================================================================
          1. NATIVE MOBILE APP TOP BAR
          ========================================================================= */}
      <header className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 py-2.5 flex items-center justify-between z-40">
        {/* Team Avatar & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/20 border border-amber-300/40">
            🏏
          </div>
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-sm tracking-tight text-white truncate max-w-[150px]">
                {settings.teamName}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              IPL Auction Companion
            </div>
          </div>
        </div>

        {/* Top Action Pills */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onStartNewGame}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 active:scale-95 transition"
            title="Start a new game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {historyCount > 0 && (
            <button
              onClick={onUndo}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center space-x-1 border border-slate-700 active:scale-95 transition"
              title="Undo last move"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">{historyCount}</span>
            </button>
          )}

          {!isStandalonePopup && (
            <button
              onClick={onOpenPopoutWindow}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
              title="Open separate pop-out window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onToggleFullView}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
            title={isFullView ? 'Switch to Mobile UI' : 'Switch to Desktop UI'}
          >
            {isFullView ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. MOBILE WALLET PURSE CARD (FINTECH STYLE)
          ========================================================================= */}
      <div className="flex-shrink-0 p-3 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80">
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950/25 border border-amber-500/30 rounded-2xl p-3 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Row: Label & Spend Progress */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <span>PURSE REMAINING</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                LIVE
              </span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              Spent ₹{totalSpent.toFixed(2)} / ₹{settings.totalPurse.toFixed(0)} Cr
            </span>
          </div>

          {/* Big Amount */}
          <div className="flex items-baseline space-x-1 mb-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-mono">
              ₹{remainingPurse.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400">Crores</span>
          </div>

          {/* Purse Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                purseSpentPercent > 85
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${purseSpentPercent}%` }}
            />
          </div>

          {/* Key Metric Chips Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {/* Safe Max Bid */}
            <div
              className={`rounded-xl py-1.5 px-1 border transition ${
                maxSafeBid < 2.0
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-slate-900/90 border-slate-700/80 text-emerald-300'
              }`}
            >
              <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Safe Bid</span>
              </div>
              <div className="text-xs font-black font-mono">
                ₹{maxSafeBid.toFixed(2)} Cr
              </div>
            </div>

            {/* Squad Count */}
            <div className="rounded-xl py-1.5 px-1 bg-slate-900/90 border border-slate-700/80">
              <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">
                <Users className="w-2.5 h-2.5" />
                <span>Squad</span>
              </div>
              <div className="text-xs font-black text-white">
                {boughtSlots.length}/25{' '}
                <span className="text-[10px] text-amber-400 font-bold">({filledXICount}/11 XI)</span>
              </div>
            </div>

            {/* Overseas Quota */}
            <div className="rounded-xl py-1.5 px-1 bg-slate-900/90 border border-slate-700/80">
              <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">
                <Plane className="w-2.5 h-2.5 text-cyan-400" />
                <span>Overseas</span>
              </div>
              <div
                className={`text-xs font-black ${
                  totalOverseas >= settings.maxOverseasInSquad
                    ? 'text-rose-400'
                    : 'text-cyan-300'
                }`}
              >
                {totalOverseas}/{settings.maxOverseasInSquad}
              </div>
            </div>
          </div>
        </div>

        {/* 3. STICKY MOBILE SEARCH / FAST WIN RECORD BAR */}
        <div ref={searchContainerRef} className="relative mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="🔍 Search 522 players to record win..."
              className="w-full bg-slate-900 border border-amber-500/30 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Results Drawer */}
          {isSearchOpen && fastMatches.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-72 overflow-y-auto">
              {fastMatches.map((player) => (
                <div
                  key={player.id}
                  onClick={() => {
                    onDraftPlayer(player);
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="p-2.5 hover:bg-amber-500/10 cursor-pointer flex items-center justify-between transition active:bg-amber-500/20"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-white truncate">
                        {player.name}
                      </span>
                      {player.isOverseas && <Plane className="w-3 h-3 text-cyan-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {player.roleFull || player.role} • {player.marqueeSet} • Base ₹{player.basePrice} Cr
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1 shrink-0 shadow active:scale-95">
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Won</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          4. SCROLLABLE TAB CONTENT (TOUCH FRIENDLY)
          ========================================================================= */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
        {/* =====================================================================
            TAB 1: LIVE SET TRACKER
            ===================================================================== */}
        {activeTab === 'LIVE' && (
          <div className="space-y-3">
            {/* Set Navigator Controller */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>AUCTIONEER LIVE SET</span>
                </span>
                {liveSetCode === activeSetCode ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE SET
                  </span>
                ) : (
                  <button
                    onClick={() => onSetLiveSetCode(activeSetCode)}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition active:scale-95"
                  >
                    Sync as Live
                  </button>
                )}
              </div>

              {/* Prev / Next Set Carousel Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (currentSetIndex > 0) setActiveSetCode(orderedSets[currentSetIndex - 1].meta.code);
                  }}
                  disabled={currentSetIndex <= 0}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center space-x-1 transition active:scale-95 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <select
                  value={activeSetCode}
                  onChange={(e) => setActiveSetCode(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-amber-400 text-center"
                >
                  {orderedSets.map((s) => (
                    <option key={s.meta.code} value={s.meta.code}>
                      {s.meta.icon} {s.meta.name} ({s.totalPlayers})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (currentSetIndex < orderedSets.length - 1) setActiveSetCode(orderedSets[currentSetIndex + 1].meta.code);
                  }}
                  disabled={currentSetIndex >= orderedSets.length - 1}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center space-x-1 transition active:scale-95 shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Set Info Strip */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800/80">
                <span>{currentSetSummary?.meta.roleLabel}</span>
                <span className="text-amber-400 font-bold">
                  {targetsInActiveSet.length} targets in this set
                </span>
              </div>
            </div>

            {/* List of Players in Current Set: Targeted First, then Other Players */}
            <div className="space-y-3">
              {playersInActiveSet.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
                  No players found in this set.
                </div>
              ) : (
                <>
                  {/* 1. TARGETED PLAYERS IN SET (DISPLAYED FIRST) */}
                  {targetedInActiveSet.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Targeted in this Set ({targetedInActiveSet.length})</span>
                        </span>
                        <span className="text-[10px] text-amber-400/80 font-bold">Priority Wishlist</span>
                      </div>

                      <div className="space-y-2">
                        {targetedInActiveSet.map((player) => renderLiveSetPlayerCard(player))}
                      </div>
                    </div>
                  )}

                  {/* 2. OTHER PLAYERS IN SET */}
                  {otherPlayersInActiveSet.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {targetedInActiveSet.length > 0
                            ? `Other Players in Set (${otherPlayersInActiveSet.length})`
                            : `Players in Set (${playersInActiveSet.length})`}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {otherPlayersInActiveSet.map((player) => renderLiveSetPlayerCard(player))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: TARGET WATCHLIST (PRIORITY FOCUSED)
            ===================================================================== */}
        {activeTab === 'TARGETS' && (
          <div className="space-y-3">
            {/* Watchlist Header & Filters */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                My Target Watchlist ({targets.length})
              </span>
              <button
                onClick={onOpenAIImport}
                className="text-[10px] px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-black flex items-center space-x-1 active:scale-95 transition"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>ChatGPT Plan</span>
              </button>
            </div>

            {/* Priority Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {(['ALL', 'Must-Have', 'High', 'Medium', 'Backup'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTargetPriorityFilter(p)}
                  className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition active:scale-95 ${
                    targetPriorityFilter === p
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {p === 'ALL' ? 'All Targets' : p}
                </button>
              ))}
            </div>

            {/* Target Cards */}
            {filteredTargets.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-2">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-bold text-white">No target players here</div>
                <div className="text-xs text-slate-400 max-w-xs mx-auto">
                  Add players from the Live Set, or import your planned auction budget from ChatGPT!
                </div>
                <button
                  onClick={onOpenAIImport}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs active:scale-95 transition"
                >
                  Import AI Plan
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTargets.map((target) => {
                  const isDrafted = draftedPlayerIds.has(target.player.id);
                  const isLost = target.status === 'lost';

                  return (
                    <div
                      key={target.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isDrafted
                          ? 'bg-emerald-950/15 border-emerald-500/30'
                          : isLost
                          ? 'bg-rose-950/15 border-rose-500/30 opacity-75'
                          : 'bg-slate-900 border-amber-500/30 shadow-md'
                      }`}
                    >
                      {/* Name & Priority */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="font-black text-sm text-white tracking-tight truncate">
                              {target.player.name}
                            </span>
                            {target.player.isOverseas && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold inline-flex items-center gap-0.5 border border-cyan-500/30">
                                <Plane className="w-2.5 h-2.5" /> OS
                              </span>
                            )}
                            {renderRoleBadge(target.player.role)}
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                target.priority === 'Must-Have'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {target.priority}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Set: <span className="text-white">{target.player.marqueeSet}</span> • Base: ₹{target.player.basePrice} Cr
                          </div>

                          {/* Form Stats if present */}
                          {target.form && (
                            <div className="text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 mt-1 truncate max-w-[240px]">
                              <span className="text-amber-400 font-bold">📊 </span>
                              <span>{target.form}</span>
                            </div>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => onRemoveTarget(target.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove target"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Mobile Budget Stepper Strip (Target Min & Max Ceiling) */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <div className="inline-flex items-center gap-1 bg-slate-950/90 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                            <span className="text-slate-400">Target:</span>
                            <span className="font-black text-amber-400 font-mono">
                              ₹{(target.targetPrice || target.targetMaxPrice).toFixed(1)}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-400">Max:</span>
                            <span className="font-black text-emerald-400 font-mono">
                              ₹{target.targetMaxPrice.toFixed(1)}
                            </span>
                            <span className="text-slate-500 text-[10px]">Cr</span>
                          </div>
                          {/* Quick Steppers */}
                          <div className="flex items-center space-x-1 ml-0.5">
                            <button
                              onClick={() => handleStepBudget(target.id, target, -0.5)}
                              className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center active:scale-95"
                              title="-0.50 Cr"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleStepBudget(target.id, target, 0.5)}
                              className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center active:scale-95"
                              title="+0.50 Cr"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1.5">
                          {isDrafted ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs">
                              Bought (₹{target.soldPrice?.toFixed(2) || '0.00'} Cr)
                            </span>
                          ) : isLost ? (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs">
                              Lost
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => onDraftPlayer(target.player)}
                                className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1 active:scale-95 transition"
                              >
                                <Gavel className="w-3 h-3" />
                                <span>WON</span>
                              </button>
                              <button
                                onClick={() => onMarkLost(target.id, target.player)}
                                className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 active:scale-95 transition"
                                title="Mark Lost (Find Alternatives)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: PLAYING XI & SQUAD ROSTER
            ===================================================================== */}
        {activeTab === 'SQUAD' && (
          <div className="space-y-3">
            {/* Squad Category Pills */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                onClick={() => setSquadSubTab('XI')}
                className={`py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
                  squadSubTab === 'XI'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Playing XI ({filledXICount}/11)
              </button>

              <button
                onClick={() => setSquadSubTab('IMPACT')}
                className={`py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
                  squadSubTab === 'IMPACT'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Impact ({impactSlot?.player ? '1/1' : '0/1'})
              </button>

              <button
                onClick={() => setSquadSubTab('BENCH')}
                className={`py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
                  squadSubTab === 'BENCH'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bench ({benchSlots.filter((s) => s.player !== null).length}/13)
              </button>
            </div>

            {/* Overseas in XI alert */}
            {squadSubTab === 'XI' && xiOverseas >= 4 && (
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-cyan-300 text-xs flex items-center space-x-2">
                <Plane className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Overseas Limit Reached:</strong> 4/4 Overseas players in your Starting XI.
                </span>
              </div>
            )}

            {/* Slots List */}
            <div className="space-y-2">
              {(squadSubTab === 'XI' ? xiSlots : squadSubTab === 'IMPACT' ? (impactSlot ? [impactSlot] : []) : benchSlots).map((slot) => (
                <div
                  key={slot.id}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    slot.player
                      ? 'bg-slate-900 border-slate-700/80 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 border-dashed opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          slot.category === 'xi'
                            ? 'bg-amber-500 text-slate-950'
                            : slot.category === 'impact'
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {slot.id}
                      </span>

                      <div className="min-w-0">
                        {slot.player ? (
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-sm text-white truncate">
                                {slot.player.name}
                              </span>
                              {slot.player.isOverseas && <Plane className="w-3 h-3 text-cyan-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {slot.slotLabel} • {slot.player.role}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-bold text-slate-300">
                              {slot.slotLabel}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Needs: {slot.suggestedRole} {slot.isMandatory ? '(Mandatory)' : '(Optional)'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Price / Action */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {slot.player ? (
                        <>
                          <span className="font-mono font-black text-xs text-amber-400">
                            ₹{slot.soldPrice?.toFixed(2)} Cr
                          </span>
                          <button
                            onClick={() => onRemovePlayer(slot.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Remove player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onOpenAssignModal(slot.id)}
                          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-black text-xs border border-slate-700 active:scale-95 transition"
                        >
                          + Pick
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: SCOUTING HUB (BROWSE ALL 522 PLAYERS)
            ===================================================================== */}
        {activeTab === 'SCOUT' && (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {(['ALL', 'BAT', 'WK', 'AR', 'BOWL', 'OVERSEAS'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setScoutRoleFilter(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition active:scale-95 ${
                    scoutRoleFilter === r
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {r === 'BAT' ? '🏏 Batsmen' : r === 'WK' ? '🧤 Keepers' : r === 'AR' ? '⚡ All-Round' : r === 'BOWL' ? '🎯 Bowlers' : r === 'OVERSEAS' ? '✈️ Overseas' : 'All Players'}
                </button>
              ))}
            </div>

            {/* Filter Search */}
            <input
              type="text"
              value={scoutSearchQuery}
              onChange={(e) => setScoutSearchQuery(e.target.value)}
              placeholder="Search by name, role or set..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />

            {/* Scout Results */}
            <div className="space-y-2">
              {scoutFilteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-black text-xs text-white truncate">
                        {player.name}
                      </span>
                      {player.isOverseas && <Plane className="w-3 h-3 text-cyan-400 shrink-0" />}
                      {renderRoleBadge(player.role)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {player.marqueeSet} • Base: ₹{player.basePrice} Cr
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onDraftPlayer(player)}
                      className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1 active:scale-95 transition"
                    >
                      <Gavel className="w-3 h-3" />
                      <span>WON</span>
                    </button>
                    <button
                      onClick={() => onAddTarget(player, player.basePrice * 2 || 2.0, 'High')}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700 active:scale-95 transition"
                      title="Add target"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: PURSE RULES & STRATEGY
            ===================================================================== */}
        {activeTab === 'PURSE' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>AUCTION PURSE & SQUAD RULES</span>
              </span>

              <div className="space-y-2 text-xs divide-y divide-slate-800">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Total Purse Budget:</span>
                  <strong className="text-white">₹{settings.totalPurse.toFixed(2)} Cr</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Total Spent:</span>
                  <strong className="text-amber-400">₹{totalSpent.toFixed(2)} Cr</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Remaining Balance:</span>
                  <strong className="text-emerald-400">₹{remainingPurse.toFixed(2)} Cr</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Max Safe Single Bid:</span>
                  <strong className="text-amber-400">₹{maxSafeBid.toFixed(2)} Cr</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Mandatory Squad Min:</span>
                  <strong className="text-white">18 Players ({neededToMin} needed)</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Overseas Cap:</span>
                  <strong className="text-cyan-400">Max 4 in XI • Max 8 in Squad</strong>
                </div>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Safe Bid Protection Active</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If you haven't completed the mandatory 18-player squad yet, the app locks ₹{settings.minBasePrice} Cr per missing player to ensure you never run out of money before completing your team!
              </p>
            </div>

            {/* Start a New Game Full Width Card Button */}
            <div className="pt-2">
              <button
                onClick={onStartNewGame}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start a new game</span>
              </button>
              <div className="text-[10px] text-slate-400 text-center mt-1.5">
                Resets squad, purse & live sets for a fresh auction session
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          5. NATIVE MOBILE BOTTOM NAVIGATION BAR (FIXED DOCK)
          ========================================================================= */}
      <nav className="flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around z-50 shadow-2xl">
        {/* 1. Live Set Tab */}
        <button
          onClick={() => setActiveTab('LIVE')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition active:scale-90 ${
            activeTab === 'LIVE' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Live Set</span>
        </button>

        {/* 2. Targets Tab */}
        <button
          onClick={() => setActiveTab('TARGETS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition active:scale-90 relative ${
            activeTab === 'TARGETS' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Targets</span>
          {targets.filter((t) => t.status === 'available').length > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
              {targets.filter((t) => t.status === 'available').length}
            </span>
          )}
        </button>

        {/* 3. Squad Tab */}
        <button
          onClick={() => setActiveTab('SQUAD')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition active:scale-90 relative ${
            activeTab === 'SQUAD' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Squad</span>
          <span className="text-[9px] font-mono text-slate-500">
            {boughtSlots.length}/25
          </span>
        </button>

        {/* 4. Scout Tab */}
        <button
          onClick={() => setActiveTab('SCOUT')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition active:scale-90 ${
            activeTab === 'SCOUT' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Scout</span>
        </button>

        {/* 5. Purse Tab */}
        <button
          onClick={() => setActiveTab('PURSE')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition active:scale-90 ${
            activeTab === 'PURSE' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Purse</span>
        </button>
      </nav>
    </div>
  );
};
