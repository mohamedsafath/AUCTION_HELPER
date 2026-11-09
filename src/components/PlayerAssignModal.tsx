import React, { useState, useMemo } from 'react';
import { Player, PlayerRole, Slot } from '../types';
import { Search, X, Plane, Check, AlertCircle, DollarSign } from 'lucide-react';

interface PlayerAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: Slot | null;
  playersList: Player[];
  onConfirmAssign: (slotId: number, player: Player, soldPrice: number) => void;
  maxSafeBid: number;
}

export const PlayerAssignModal: React.FC<PlayerAssignModalProps> = ({
  isOpen,
  onClose,
  targetSlot,
  playersList,
  onConfirmAssign,
  maxSafeBid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedOrigin, setSelectedOrigin] = useState<'ALL' | 'IND' | 'OS'>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');

  // Set initial default when modal opens or slot changes
  React.useEffect(() => {
    if (targetSlot) {
      if (targetSlot.player) {
        setSelectedPlayer(targetSlot.player);
        setPriceInput((targetSlot.soldPrice || 0).toString());
      } else {
        setSelectedPlayer(null);
        setPriceInput('');
      }
      setSelectedRole(targetSlot.suggestedRole || 'ALL');
      setSearchQuery('');
    }
  }, [targetSlot]);

  // When a player is selected from the list, set default price
  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    const benchmark = player.previousSoldPrice || player.basePrice || 0.3;
    setPriceInput(benchmark.toString());
  };

  // Quick increment price
  const handleAddIncrement = (inc: number) => {
    const cur = parseFloat(priceInput) || 0;
    setPriceInput((cur + inc).toFixed(2));
  };

  // Filtered players from the master dataset
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return playersList
      .filter((p) => {
        // Search text
        if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) {
          return false;
        }
        // Role filter
        if (selectedRole !== 'ALL' && p.role !== selectedRole) {
          return false;
        }
        // Origin filter
        if (selectedOrigin === 'IND' && p.isOverseas) {
          return false;
        }
        if (selectedOrigin === 'OS' && !p.isOverseas) {
          return false;
        }
        return true;
      })
      .slice(0, 60); // fast rendering
  }, [playersList, searchQuery, selectedRole, selectedOrigin]);

  if (!isOpen || !targetSlot) return null;

  const enteredPrice = parseFloat(priceInput) || 0;
  const isOverSafeLimit = enteredPrice > maxSafeBid && maxSafeBid > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer) {
      alert('Please select a player from the official master list');
      return;
    }

    onConfirmAssign(targetSlot.id, selectedPlayer, enteredPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                {targetSlot.id}
              </span>
              <h3 className="text-lg font-bold text-white">
                Assign to {targetSlot.slotLabel}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Suggested: <strong className="text-amber-400">{targetSlot.suggestedRole}</strong> • Official Master Dataset (522 Players)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Search & Filters */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player name or ID (e.g. Kohli, Bumrah, P008)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 text-[11px] mr-1">Role:</span>
              {['ALL', 'BAT', 'WK', 'AR', 'BOWL'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                    selectedRole === role
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}

              <span className="text-slate-500 text-[11px] ml-2 mr-1">Origin:</span>
              <button
                onClick={() => setSelectedOrigin('ALL')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                  selectedOrigin === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedOrigin('IND')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                  selectedOrigin === 'IND'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🇮🇳 Indian
              </button>
              <button
                onClick={() => setSelectedOrigin('OS')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                  selectedOrigin === 'OS'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ✈️ Overseas
              </button>
            </div>
          </div>

          {/* Player Selection List */}
          <div className="border border-slate-800 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/50">
            {filteredPlayers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No players found matching your search in the 522 master list.
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayer?.id === player.id;
                return (
                  <div
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-500/15 border-l-4 border-amber-500'
                        : 'hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'border border-slate-600'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {player.id}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {player.name}
                          </span>
                          {player.isOverseas ? (
                            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-medium">
                              ✈️ OS
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">🇮🇳</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span className="font-semibold text-slate-300">{player.role}</span>
                          <span className="text-slate-500">• {player.marqueeSet}</span>
                          {player.previousTeam && (
                            <span>• Ex-{player.previousTeam}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Benchmark Price */}
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">
                        ₹{(player.previousSoldPrice || player.basePrice).toFixed(2)} Cr
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {player.previousSoldPrice ? 'Past Sold' : 'Base Price'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Winning Auction Price Input */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Winning Bid / Purchase Price (in ₹ Crores)
              </label>
              {maxSafeBid > 0 && (
                <span className="text-[11px] text-indigo-400 font-medium">
                  Safe Ceiling: ₹{maxSafeBid.toFixed(2)} Cr
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-amber-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="e.g. 14.50"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-12 py-2 text-base font-extrabold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  Cr
                </span>
              </div>
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => handleAddIncrement(0.2)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +20 Lakhs
              </button>
              <button
                type="button"
                onClick={() => handleAddIncrement(0.5)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +50 Lakhs
              </button>
              <button
                type="button"
                onClick={() => handleAddIncrement(1.0)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +1.00 Cr
              </button>
              <button
                type="button"
                onClick={() => handleAddIncrement(2.0)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700"
              >
                +2.00 Cr
              </button>
            </div>

            {/* Warning if over safe limit */}
            {isOverSafeLimit && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center space-x-1.5 text-amber-400 text-[11px] mt-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  <strong>Budget Caution:</strong> This bid is higher than your Max Safe Bid (₹{maxSafeBid.toFixed(2)} Cr).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedPlayer}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Assign to Slot {targetSlot.id}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
