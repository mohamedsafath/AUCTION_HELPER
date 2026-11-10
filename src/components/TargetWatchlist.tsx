import React, { useState } from 'react';
import { TargetPlayer, Player, Slot, PlayerRole } from '../types';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Plane,
  AlertCircle,
  Star,
  Search,
  Sparkles,
  Zap,
  Edit2,
  Check,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface TargetWatchlistProps {
  targets: TargetPlayer[];
  onAddTarget: (player: Player, targetMaxPrice: number, priority: 'Must-Have' | 'High' | 'Medium' | 'Backup', targetPrice?: number) => void;
  onRemoveTarget: (targetId: string) => void;
  onMarkLost: (targetId: string, player: Player) => void;
  onQuickBuyTarget: (target: TargetPlayer) => void;
  onFindAlternative: (player: Player) => void;
  onUpdateTargetBudget: (targetId: string, newMaxBudget: number, newTargetPrice?: number) => void;
  allPlayers: Player[];
  slots: Slot[];
  onOpenAIImport?: () => void;
}

export const TargetWatchlist: React.FC<TargetWatchlistProps> = ({
  targets,
  onAddTarget,
  onRemoveTarget,
  onMarkLost,
  onQuickBuyTarget,
  onFindAlternative,
  onUpdateTargetBudget,
  allPlayers,
  slots,
  onOpenAIImport,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'BOUGHT' | 'LOST'>('ACTIVE');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTargetQuery, setSearchTargetQuery] = useState('');
  const [selectedPlayerForTarget, setSelectedPlayerForTarget] = useState<Player | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState<string>('8.0');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('11.0');
  const [targetPriority, setTargetPriority] = useState<'Must-Have' | 'High' | 'Medium' | 'Backup'>('Must-Have');

  // Inline budget editing state
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingTargetPriceValue, setEditingTargetPriceValue] = useState<string>('');
  const [editingMaxPriceValue, setEditingMaxPriceValue] = useState<string>('');

  // Filtered targets
  const filteredTargets = targets.filter((t) => {
    if (filterTab === 'ACTIVE') return t.status === 'available';
    if (filterTab === 'BOUGHT') return t.status === 'bought';
    if (filterTab === 'LOST') return t.status === 'lost';
    return true;
  });

  // Filtered players for adding target
  const candidatePlayers = allPlayers
    .filter((p) => {
      if (!searchTargetQuery.trim()) return true;
      return (
        p.name.toLowerCase().includes(searchTargetQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTargetQuery.toLowerCase())
      );
    })
    .slice(0, 15);

  const handleSelectCandidate = (player: Player) => {
    setSelectedPlayerForTarget(player);
    const benchmark = player.previousSoldPrice || player.basePrice * 2.5 || 5.0;
    setTargetPriceInput(benchmark.toFixed(1));
    setMaxPriceInput((benchmark * 1.3).toFixed(1));
  };

  const handleConfirmAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForTarget) {
      alert('Please select a player to target');
      return;
    }
    const targetPrice = parseFloat(targetPriceInput) || 5.0;
    const maxPrice = parseFloat(maxPriceInput) || targetPrice;
    onAddTarget(selectedPlayerForTarget, Math.max(targetPrice, maxPrice), targetPriority, targetPrice);
    setIsAddingNew(false);
    setSelectedPlayerForTarget(null);
    setSearchTargetQuery('');
  };

  const handleStartEditBudget = (target: TargetPlayer) => {
    setEditingBudgetId(target.id);
    setEditingTargetPriceValue((target.targetPrice || target.targetMaxPrice).toString());
    setEditingMaxPriceValue(target.targetMaxPrice.toString());
  };

  const handleSaveBudget = (targetId: string) => {
    const tVal = parseFloat(editingTargetPriceValue);
    const mVal = parseFloat(editingMaxPriceValue);
    if (!isNaN(mVal) && mVal > 0) {
      onUpdateTargetBudget(targetId, mVal, !isNaN(tVal) ? tVal : mVal);
    }
    setEditingBudgetId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Target Wishlist & Budgets
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {targets.filter((t) => t.status === 'available').length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Set target budget limits, click <strong>Got Player</strong> to record winning bid, and track savings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onOpenAIImport && (
            <button
              onClick={onOpenAIImport}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              title="Import plan from ChatGPT or AI text"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import AI Plan</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingNew ? 'Close Form' : '+ Add Target Player'}</span>
          </button>
        </div>
      </div>

      {/* Add Target Drawer */}
      {isAddingNew && (
        <form
          onSubmit={handleConfirmAddTarget}
          className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Add Player to Wishlist
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Search Player from 522 Master Dataset
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTargetQuery}
                onChange={(e) => setSearchTargetQuery(e.target.value)}
                placeholder="Type player name or ID..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick candidate list */}
            {searchTargetQuery && (
              <div className="border border-slate-800 rounded-lg max-h-36 overflow-y-auto divide-y divide-slate-800 bg-slate-900/90 text-xs">
                {candidatePlayers.map((cp) => (
                  <div
                    key={cp.id}
                    onClick={() => handleSelectCandidate(cp)}
                    className={`p-2 flex items-center justify-between cursor-pointer hover:bg-slate-800 ${
                      selectedPlayerForTarget?.id === cp.id
                        ? 'bg-amber-500/20 text-white font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>
                      {cp.id} - {cp.name} ({cp.role}) • {cp.marqueeSet} {cp.isOverseas ? '✈️' : '🇮🇳'}
                    </span>
                    <span className="text-amber-400 text-[11px]">
                      {cp.previousSoldPrice
                        ? `₹${cp.previousSoldPrice}Cr`
                        : `Base ₹${cp.basePrice}Cr`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPlayerForTarget && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Selected: {selectedPlayerForTarget.name} ({selectedPlayerForTarget.role})
              </span>
              <span className="text-sky-400">
                {selectedPlayerForTarget.isOverseas ? '✈️ Overseas' : '🇮🇳 Indian'} •{' '}
                {selectedPlayerForTarget.marqueeSet}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                Target / Min Value (₹ Cr)
              </label>
              <input
                type="number"
                step="0.25"
                value={targetPriceInput}
                onChange={(e) => setTargetPriceInput(e.target.value)}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                placeholder="e.g. 10.0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">
                Max Ceiling Limit (₹ Cr)
              </label>
              <input
                type="number"
                step="0.25"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                placeholder="e.g. 13.0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority Tier
              </label>
              <select
                value={targetPriority}
                onChange={(e) => setTargetPriority(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Must-Have">⭐ Must-Have</option>
                <option value="High">🔥 High Priority</option>
                <option value="Medium">⚡ Medium</option>
                <option value="Backup">🔄 Backup Plan</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedPlayerForTarget}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition"
          >
            Add to Target Wishlist
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 text-xs pb-1">
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            filterTab === 'ACTIVE'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Targets ({targets.filter((t) => t.status === 'available').length})
        </button>
        <button
          onClick={() => setFilterTab('BOUGHT')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            filterTab === 'BOUGHT'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Won ({targets.filter((t) => t.status === 'bought').length})
        </button>
        <button
          onClick={() => setFilterTab('LOST')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            filterTab === 'LOST'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Lost to Rival ({targets.filter((t) => t.status === 'lost').length})
        </button>
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            filterTab === 'ALL'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({targets.length})
        </button>
      </div>

      {/* Targets List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredTargets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Target Wishlist is Empty</div>
              <div className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                No targeted players added yet. Click <strong className="text-amber-400">+ Add Target Player</strong> above or click <strong className="text-amber-400">+ Target</strong> on any player in the Scouting Hub below to start building your wishlist!
              </div>
            </div>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Target</span>
            </button>
          </div>
        ) : (
          filteredTargets.map((target) => {
            const p = target.player;
            const isBought = target.status === 'bought';
            const isLost = target.status === 'lost';
            const winningPrice = target.soldPrice;
            const savings =
              winningPrice !== undefined ? target.targetMaxPrice - winningPrice : 0;

            return (
              <div
                key={target.id}
                className={`p-3 rounded-xl border transition-all ${
                  isBought
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isLost
                    ? 'bg-rose-950/20 border-rose-900/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Player Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isBought
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isLost
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : target.priority === 'Must-Have'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isBought ? '✓' : isLost ? '✕' : target.priority === 'Must-Have' ? '⭐' : '🎯'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {p.id}
                        </span>
                        <span
                          className={`text-sm font-bold truncate ${
                            isLost ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {p.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {p.role}
                        </span>
                        {p.isOverseas ? (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-medium">
                            ✈️ OS
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">🇮🇳</span>
                        )}
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                          {p.marqueeSet}
                        </span>
                      </div>

                      {/* Form statistics if present */}
                      {target.form && (
                        <div className="text-[10px] text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 inline-flex items-center gap-1 mt-1">
                          <span className="text-amber-400 font-bold">📊 Form:</span>
                          <span>{target.form}</span>
                        </div>
                      )}

                      {/* Notes / Alternative representation if present */}
                      {target.notes && (
                        <div className="text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30 inline-flex items-center gap-1 mt-1">
                          <span>🔄 {target.notes}</span>
                        </div>
                      )}

                      {/* Budget Details & Inline Editing */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                        {editingBudgetId === target.id ? (
                          <div
                            className="flex items-center space-x-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-amber-400 font-bold">Target: ₹</span>
                            <input
                              type="number"
                              step="0.25"
                              value={editingTargetPriceValue}
                              onChange={(e) => setEditingTargetPriceValue(e.target.value)}
                              className="w-14 bg-slate-800 text-amber-300 text-xs font-bold px-1 py-0.5 rounded border border-amber-500/60"
                              title="Target / Min price"
                            />
                            <span className="text-[10px] text-emerald-400 font-bold">Max: ₹</span>
                            <input
                              type="number"
                              step="0.25"
                              value={editingMaxPriceValue}
                              onChange={(e) => setEditingMaxPriceValue(e.target.value)}
                              className="w-14 bg-slate-800 text-emerald-300 text-xs font-bold px-1 py-0.5 rounded border border-emerald-500/60"
                              title="Maximum walkaway limit"
                            />
                            <button
                              onClick={() => handleSaveBudget(target.id)}
                              className="p-1 bg-amber-500 text-slate-950 rounded hover:bg-amber-400 text-xs font-bold"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                              <span className="text-[10px] text-slate-400">Target:</span>
                              <strong className="text-amber-400 font-bold">
                                ₹{(target.targetPrice || target.targetMaxPrice).toFixed(1)} Cr
                              </strong>
                              <span className="text-slate-600">|</span>
                              <span className="text-[10px] text-slate-400">Max:</span>
                              <strong className="text-emerald-400 font-bold">
                                ₹{target.targetMaxPrice.toFixed(1)} Cr
                              </strong>
                            </span>
                            {!isBought && !isLost && (
                              <button
                                onClick={() => handleStartEditBudget(target)}
                                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                                title="Edit target and max budget"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>•</span>
                        <span>{target.priority}</span>

                        {/* When Bought: Show Winning Bid & Savings */}
                        {isBought && winningPrice !== undefined && (
                          <div className="flex items-center space-x-1.5 pl-1 border-l border-slate-700">
                            <span className="text-white font-bold">
                              Got for: ₹{winningPrice.toFixed(2)} Cr
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 ${
                                savings >= 0
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {savings >= 0 ? (
                                <>
                                  <TrendingDown className="w-3 h-3" />
                                  <span>Saved ₹{savings.toFixed(2)}Cr</span>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Over ₹{(-savings).toFixed(2)}Cr</span>
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0 self-end sm:self-center">
                    {target.status === 'available' ? (
                      <>
                        {/* Got Him Button -> Prompts Winning Bid Modal */}
                        <button
                          onClick={() => onQuickBuyTarget(target)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
                          title="Enter winning bid and update purse"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Got Player</span>
                        </button>

                        {/* Lost to Rival Button */}
                        <button
                          onClick={() => onMarkLost(target.id, p)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold flex items-center space-x-1 transition"
                          title="Lost to rival team - triggers alternative player suggestions"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sold to Rival</span>
                        </button>
                      </>
                    ) : isBought ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> In XI (₹{winningPrice?.toFixed(2)} Cr)
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onFindAlternative(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-1 transition"
                          title="View recommended backup alternatives"
                        >
                          <Zap className="w-3 h-3" />
                          <span>View Alternatives</span>
                        </button>
                        <span className="text-xs text-rose-400 font-semibold px-2 py-1">
                          Lost
                        </span>
                      </div>
                    )}

                    {/* Delete Target */}
                    <button
                      onClick={() => onRemoveTarget(target.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Remove from target list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
