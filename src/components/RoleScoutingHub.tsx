import React, { useState, useMemo } from 'react';
import { Player, PlayerRole, Slot, TargetPlayer } from '../types';
import {
  Search,
  Plane,
  Star,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';

interface RoleScoutingHubProps {
  allPlayers: Player[];
  slots: Slot[];
  targets: TargetPlayer[];
  onDraftPlayer: (player: Player) => void;
  onAddTarget: (player: Player, targetMaxPrice: number, priority: 'Must-Have' | 'High' | 'Backup') => void;
}

export const RoleScoutingHub: React.FC<RoleScoutingHubProps> = ({
  allPlayers,
  slots,
  targets,
  onDraftPlayer,
  onAddTarget,
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState<PlayerRole>('WK');
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [selectedOrigin, setSelectedOrigin] = useState<'ALL' | 'IND' | 'OS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'PRICE_DESC' | 'PRICE_ASC' | 'NAME' | 'SET'>('PRICE_DESC');

  // Role metadata
  const roleTabs: { role: PlayerRole; label: string; icon: string; count: number }[] = [
    {
      role: 'WK',
      label: 'Wicket-Keepers',
      icon: '🧤',
      count: allPlayers.filter((p) => p.role === 'WK').length,
    },
    {
      role: 'BAT',
      label: 'Batsmen',
      icon: '🏏',
      count: allPlayers.filter((p) => p.role === 'BAT').length,
    },
    {
      role: 'AR',
      label: 'All-Rounders',
      icon: '⚡',
      count: allPlayers.filter((p) => p.role === 'AR').length,
    },
    {
      role: 'BOWL',
      label: 'Bowlers',
      icon: '🎯',
      count: allPlayers.filter((p) => p.role === 'BOWL').length,
    },
  ];

  // Drafted map
  const draftedMap = useMemo(() => {
    const map = new Map<string, number>();
    slots.forEach((s) => {
      if (s.player) {
        map.set(s.player.id, s.id);
      }
    });
    return map;
  }, [slots]);

  // Target status map
  const targetMap = useMemo(() => {
    const map = new Map<string, TargetPlayer>();
    targets.forEach((t) => {
      map.set(t.player.id, t);
    });
    return map;
  }, [targets]);

  // Available unique sets for active role
  const availableSets = useMemo(() => {
    const sets = new Set<string>();
    allPlayers
      .filter((p) => p.role === activeRoleTab)
      .forEach((p) => {
        if (p.marqueeSet) sets.add(p.marqueeSet);
      });
    return Array.from(sets);
  }, [allPlayers, activeRoleTab]);

  // Filtered & Sorted players
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = allPlayers.filter((p) => {
      if (p.role !== activeRoleTab) return false;
      if (selectedSet !== 'ALL' && p.marqueeSet !== selectedSet) return false;
      if (selectedOrigin === 'IND' && p.isOverseas) return false;
      if (selectedOrigin === 'OS' && !p.isOverseas) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'PRICE_DESC') {
        const pA = a.previousSoldPrice || a.basePrice;
        const pB = b.previousSoldPrice || b.basePrice;
        return pB - pA;
      }
      if (sortBy === 'PRICE_ASC') {
        const pA = a.previousSoldPrice || a.basePrice;
        const pB = b.previousSoldPrice || b.basePrice;
        return pA - pB;
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'SET') {
        return a.marqueeSet.localeCompare(b.marqueeSet);
      }
      return 0;
    });

    return result;
  }, [allPlayers, activeRoleTab, selectedSet, selectedOrigin, searchQuery, sortBy]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔍</span>
            <h2 className="text-lg font-black text-white">
              Role Scouting Hub & Alternatives
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
              522 Master Players
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare players across Wicket-Keepers, Batsmen, All-Rounders, and Bowlers to plan your squad
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeRoleTab}...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[11px] text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="PRICE_DESC">Price: High → Low</option>
            <option value="PRICE_ASC">Price: Low → High</option>
            <option value="NAME">Name: A → Z</option>
            <option value="SET">By Marquee Set</option>
          </select>
        </div>
      </div>

      {/* 4 Primary Role Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {roleTabs.map((tab) => {
          const isActive = activeRoleTab === tab.role;
          return (
            <button
              key={tab.role}
              onClick={() => {
                setActiveRoleTab(tab.role);
                setSelectedSet('ALL');
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="text-xl">{tab.icon}</span>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-black truncate ${
                      isActive ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {tab.count} Players
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filters: Sets & Origin */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold mr-1">Set:</span>
          <button
            onClick={() => setSelectedSet('ALL')}
            className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
              selectedSet === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Sets ({filteredPlayers.length})
          </button>
          {availableSets.slice(0, 6).map((set) => (
            <button
              key={set}
              onClick={() => setSelectedSet(set)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                selectedSet === set
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {set}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setSelectedOrigin('ALL')}
            className={`px-2 py-0.5 rounded-lg transition ${
              selectedOrigin === 'ALL' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedOrigin('IND')}
            className={`px-2 py-0.5 rounded-lg transition ${
              selectedOrigin === 'IND' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇮🇳 Indian
          </button>
          <button
            onClick={() => setSelectedOrigin('OS')}
            className={`px-2 py-0.5 rounded-lg transition ${
              selectedOrigin === 'OS'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✈️ Overseas
          </button>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No {activeRoleTab} players found matching your search.
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const draftedSlot = draftedMap.get(player.id);
            const targetInfo = targetMap.get(player.id);
            const isDrafted = draftedSlot !== undefined;
            const isTargeted = targetInfo !== undefined && targetInfo.status === 'available';
            const isLost = targetInfo !== undefined && targetInfo.status === 'lost';

            return (
              <div
                key={player.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDrafted
                    ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm'
                    : isLost
                    ? 'bg-rose-950/15 border-rose-900/30 opacity-60'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {player.id}
                      </span>
                      <span className={`text-sm font-bold truncate ${isLost ? 'line-through text-slate-500' : 'text-white'}`}>
                        {player.name}
                      </span>
                      {player.isOverseas ? (
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-medium inline-flex items-center gap-0.5">
                          <Plane className="w-2.5 h-2.5" /> OS
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">🇮🇳</span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-slate-900 rounded border border-slate-800 flex-shrink-0">
                      {player.marqueeSet}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                    <span>Base: <strong className="text-white">₹{player.basePrice.toFixed(2)} Cr</strong></span>
                    {player.previousSoldPrice && (
                      <span>• Benchmark: <strong className="text-amber-400">₹{player.previousSoldPrice.toFixed(2)} Cr</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-850">
                  <div>
                    {isDrafted ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Slot {draftedSlot}
                      </span>
                    ) : isLost ? (
                      <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Lost to Rival
                      </span>
                    ) : isTargeted ? (
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" /> Targeted
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Available</span>
                    )}
                  </div>

                  {!isDrafted && !isLost && (
                    <div className="flex items-center space-x-1.5">
                      {!isTargeted && (
                        <button
                          onClick={() => onAddTarget(player, player.previousSoldPrice || player.basePrice * 2.5, 'High')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition border border-slate-700"
                          title="Add to target shortlist"
                        >
                          + Target
                        </button>
                      )}
                      <button
                        onClick={() => onDraftPlayer(player)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shadow-sm transition flex items-center space-x-0.5 active:scale-95"
                        title="Draft into squad"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Draft</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
