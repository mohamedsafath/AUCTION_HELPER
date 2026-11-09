import React, { useState, useRef, useEffect } from 'react';
import { Player, Slot } from '../types';
import { Search, Zap, Plane, Check, Plus, Gavel } from 'lucide-react';

interface FastRecordBarProps {
  allPlayers: Player[];
  slots: Slot[];
  onPlayerSelected: (player: Player) => void;
}

export const FastRecordBar: React.FC<FastRecordBarProps> = ({
  allPlayers,
  slots,
  onPlayerSelected,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out already drafted players
  const draftedIds = new Set(
    slots.filter((s) => s.player !== null).map((s) => s.player!.id)
  );

  const matches = query.trim()
    ? allPlayers
        .filter(
          (p) =>
            !draftedIds.has(p.id) &&
            (p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.id.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (player: Player) => {
    onPlayerSelected(player);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-xl shadow-amber-500/5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Quick Label */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
              <span>Quick Record Winning Bid</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                Fast Mode
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Just won a bid? Search any player to record winning price instantly
            </div>
          </div>
        </div>

        {/* Right: Instant Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Type player name or ID (e.g. Kohli, Bumrah, P030)..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition"
          />

          {/* Autocomplete Dropdown */}
          {isOpen && matches.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 animate-in fade-in">
              <div className="p-2 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Select Player to Log Winning Bid</span>
                <span>Base / Benchmark</span>
              </div>
              {matches.map((player) => (
                <div
                  key={player.id}
                  onClick={() => handleSelect(player)}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-800/90 cursor-pointer transition text-xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {player.id}
                    </span>
                    <span className="font-bold text-white group-hover:text-amber-400 transition">
                      {player.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {player.role}
                    </span>
                    {player.isOverseas ? (
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 rounded font-medium inline-flex items-center gap-0.5">
                        <Plane className="w-2.5 h-2.5" /> OS
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">🇮🇳</span>
                    )}
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {player.marqueeSet}
                    </span>
                  </div>

                  <div className="text-right flex items-center space-x-2">
                    <span className="text-xs font-black text-amber-400">
                      ₹{(player.previousSoldPrice || player.basePrice).toFixed(2)} Cr
                    </span>
                    <span className="p-1 rounded bg-amber-500 text-slate-950 opacity-0 group-hover:opacity-100 transition text-[10px] font-bold">
                      Pick ↵
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
