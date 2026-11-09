import React, { useState, useEffect } from 'react';
import { Player, Slot, TargetPlayer, AuctionSettings, PlayerRole } from './types';
import rawPlayers from './data/players.json';
import { PurseMetrics } from './components/PurseMetrics';
import { FastRecordBar } from './components/FastRecordBar';
import { SquadBoard } from './components/SquadBoard';
import { TargetWatchlist } from './components/TargetWatchlist';
import { RoleScoutingHub } from './components/RoleScoutingHub';
import { SetWiseAuctionTracker } from './components/SetWiseAuctionTracker';
import { AIPlanImportModal } from './components/AIPlanImportModal';
import { PlayerAssignModal } from './components/PlayerAssignModal';
import { AlternativeSuggestionModal } from './components/AlternativeSuggestionModal';
import { WinningBidModal } from './components/WinningBidModal';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { generateTeamPDF } from './utils/pdfGenerator';
import { Undo2, CheckCircle2, ShieldCheck, HelpCircle, Sparkles, Layers, Eye, Users } from 'lucide-react';

const INITIAL_25_SLOTS: Slot[] = [
  // 1 to 11: Starting Playing XI (Mandatory Core)
  { id: 1, slotLabel: 'Opener 1', category: 'xi', suggestedRole: 'BAT', isMandatory: true, player: null, soldPrice: null },
  { id: 2, slotLabel: 'Opener 2', category: 'xi', suggestedRole: 'BAT', isMandatory: true, player: null, soldPrice: null },
  { id: 3, slotLabel: 'No. 3 Anchor', category: 'xi', suggestedRole: 'BAT', isMandatory: true, player: null, soldPrice: null },
  { id: 4, slotLabel: 'No. 4 Middle Order', category: 'xi', suggestedRole: 'BAT', isMandatory: true, player: null, soldPrice: null },
  { id: 5, slotLabel: 'No. 5 Wicketkeeper', category: 'xi', suggestedRole: 'WK', isMandatory: true, player: null, soldPrice: null },
  { id: 6, slotLabel: 'No. 6 Finisher', category: 'xi', suggestedRole: 'AR', isMandatory: true, player: null, soldPrice: null },
  { id: 7, slotLabel: 'No. 7 Spin All-Rounder', category: 'xi', suggestedRole: 'AR', isMandatory: true, player: null, soldPrice: null },
  { id: 8, slotLabel: 'No. 8 Pace All-Rounder', category: 'xi', suggestedRole: 'AR', isMandatory: true, player: null, soldPrice: null },
  { id: 9, slotLabel: 'No. 9 Fast Bowler 1', category: 'xi', suggestedRole: 'BOWL', isMandatory: true, player: null, soldPrice: null },
  { id: 10, slotLabel: 'No. 10 Death Specialist', category: 'xi', suggestedRole: 'BOWL', isMandatory: true, player: null, soldPrice: null },
  { id: 11, slotLabel: 'No. 11 Specialist Spinner', category: 'xi', suggestedRole: 'BOWL', isMandatory: true, player: null, soldPrice: null },

  // 12: Tactical Impact Player Spot (Mandatory Core)
  { id: 12, slotLabel: 'Impact Player Spot', category: 'impact', suggestedRole: 'AR', isMandatory: true, player: null, soldPrice: null },

  // 13 to 18: Core Bench (Completes Mandatory 18)
  { id: 13, slotLabel: 'Backup Batsman 1', category: 'bench', suggestedRole: 'BAT', isMandatory: true, player: null, soldPrice: null },
  { id: 14, slotLabel: 'Backup Batsman 2', category: 'bench', suggestedRole: 'BAT', isMandatory: true, player: null, soldPrice: null },
  { id: 15, slotLabel: 'Backup Wicketkeeper', category: 'bench', suggestedRole: 'WK', isMandatory: true, player: null, soldPrice: null },
  { id: 16, slotLabel: 'Backup All-Rounder 1', category: 'bench', suggestedRole: 'AR', isMandatory: true, player: null, soldPrice: null },
  { id: 17, slotLabel: 'Backup All-Rounder 2', category: 'bench', suggestedRole: 'AR', isMandatory: true, player: null, soldPrice: null },
  { id: 18, slotLabel: 'Backup Fast Bowler 1', category: 'bench', suggestedRole: 'BOWL', isMandatory: true, player: null, soldPrice: null },

  // 19 to 25: Optional Expansion (Up to max 25)
  { id: 19, slotLabel: 'Backup Fast Bowler 2', category: 'bench', suggestedRole: 'BOWL', isMandatory: false, player: null, soldPrice: null },
  { id: 20, slotLabel: 'Backup Spinner', category: 'bench', suggestedRole: 'BOWL', isMandatory: false, player: null, soldPrice: null },
  { id: 21, slotLabel: 'Reserve Spot 1', category: 'bench', suggestedRole: 'AR', isMandatory: false, player: null, soldPrice: null },
  { id: 22, slotLabel: 'Reserve Spot 2', category: 'bench', suggestedRole: 'BOWL', isMandatory: false, player: null, soldPrice: null },
  { id: 23, slotLabel: 'Reserve Spot 3', category: 'bench', suggestedRole: 'BAT', isMandatory: false, player: null, soldPrice: null },
  { id: 24, slotLabel: 'Reserve Spot 4', category: 'bench', suggestedRole: 'BOWL', isMandatory: false, player: null, soldPrice: null },
  { id: 25, slotLabel: 'Reserve Spot 5', category: 'bench', suggestedRole: 'AR', isMandatory: false, player: null, soldPrice: null },
];

const DEFAULT_SETTINGS: AuctionSettings = {
  teamName: 'Chennai Super Kings',
  totalPurse: 120.0, // in Cr
  minBasePrice: 0.3, // 30 Lakhs
  maxOverseasInXI: 4,
  maxOverseasInSquad: 8,
  minSquadSize: 18,
  maxSquadSize: 25,
};

export const App: React.FC = () => {
  const allPlayers: Player[] = rawPlayers as Player[];

  // Toast notification state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Settings
  const [settings, setSettings] = useState<AuctionSettings>(() => {
    const saved = localStorage.getItem('ipl_v7_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // 25 Squad Slots (Playing XI + Impact + Bench)
  const [slots, setSlots] = useState<Slot[]>(() => {
    const saved = localStorage.getItem('ipl_v7_slots');
    if (saved) {
      try {
        const parsed: Slot[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 25) {
          return parsed.map((s) => {
            if (s && s.player && !allPlayers.some((p) => p.id === s.player!.id)) {
              return { ...s, player: null, soldPrice: null };
            }
            return s;
          });
        }
      } catch (e) {}
    }
    return INITIAL_25_SLOTS;
  });

  // Target Watchlist: Starts completely CLEAN with 0 players until user assigns them
  const [targets, setTargets] = useState<TargetPlayer[]>(() => {
    const saved = localStorage.getItem('ipl_v7_targets');
    if (saved) {
      try {
        const parsed: TargetPlayer[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t) => t && t.player && t.player.id && allPlayers.some((p) => p.id === t.player.id));
        }
      } catch (e) {}
    }
    // Starts empty - user adds players explicitly
    return [];
  });

  // Undo history state
  const [history, setHistory] = useState<{ slots: Slot[]; targets: TargetPlayer[] }[]>([]);

  // Assign modal state (when user clicks an empty slot directly)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  // Dedicated Winning Bid Modal state
  const [isWinningBidModalOpen, setIsWinningBidModalOpen] = useState(false);
  const [winningBidPlayer, setWinningBidPlayer] = useState<Player | null>(null);
  const [winningBidTarget, setWinningBidTarget] = useState<TargetPlayer | null>(null);
  const [winningBidDefaultSlotId, setWinningBidDefaultSlotId] = useState<number | null>(null);

  // Alternative suggestions modal state
  const [isAlternativeModalOpen, setIsAlternativeModalOpen] = useState(false);
  const [lostPlayerForAlternative, setLostPlayerForAlternative] = useState<Player | null>(null);

  // AI / ChatGPT Plan Import Modal state
  const [isAIImportModalOpen, setIsAIImportModalOpen] = useState(false);

  // Currently active live auction set (persisted)
  const [liveSetCode, setLiveSetCode] = useState<string>(() => {
    return localStorage.getItem('ipl_v7_live_set') || 'Marquee Set 1';
  });

  // Active section view filter ('ALL' | 'SQUAD' | 'SETS' | 'SCOUTING')
  const [activeSectionTab, setActiveSectionTab] = useState<'ALL' | 'SQUAD' | 'SETS' | 'SCOUTING'>('ALL');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ipl_v7_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ipl_v7_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('ipl_v7_targets', JSON.stringify(targets));
  }, [targets]);

  useEffect(() => {
    localStorage.setItem('ipl_v7_live_set', liveSetCode);
  }, [liveSetCode]);

  // Save state for undo
  const saveSnapshot = () => {
    setHistory((prev) => [...prev.slice(-10), { slots, targets }]);
  };

  // Import parsed targets from AI / ChatGPT plan
  const handleImportTargets = (
    newTargets: TargetPlayer[],
    mode: 'merge' | 'replace'
  ) => {
    saveSnapshot();

    if (mode === 'replace') {
      setTargets(newTargets);
    } else {
      // Merge with existing: updates budget/priority/backup if player already targeted, else appends
      setTargets((prev) => {
        const map = new Map<string, TargetPlayer>();
        prev.forEach((t) => map.set(t.player.id, t));

        newTargets.forEach((nt) => {
          if (map.has(nt.player.id)) {
            const existing = map.get(nt.player.id)!;
            map.set(nt.player.id, {
              ...existing,
              targetMaxPrice: nt.targetMaxPrice,
              priority: nt.priority,
              backupPlayerId: nt.backupPlayerId || existing.backupPlayerId,
              notes: nt.notes || existing.notes,
            });
          } else {
            map.set(nt.player.id, nt);
          }
        });

        return Array.from(map.values());
      });
    }

    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'AI Auction Plan Imported',
      description: `Loaded ${newTargets.length} target players & budgets. Set-wise separation updated!`,
      canUndo: true,
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setSlots(previous.slots);
    setTargets(previous.targets);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Action Undone',
      description: 'Restored previous squad and target state.',
    });
  };

  // Purse math across Min 18 / Max 25 squad spots
  const boughtSlots = slots.filter((s) => s.player !== null);
  const totalSpent = boughtSlots.reduce((sum, s) => sum + (s.soldPrice || 0), 0);
  const remainingPurse = Math.max(0, settings.totalPurse - totalSpent);

  const minRequired = settings.minSquadSize || 18;
  const isMinMet = boughtSlots.length >= minRequired;
  const neededToMin = Math.max(0, minRequired - boughtSlots.length);

  // If under min (18), reserve 0.30 Cr for each remaining mandatory spot
  let maxSafeBid = remainingPurse;
  if (!isMinMet) {
    const mandatoryReserve = Math.max(0, neededToMin - 1) * settings.minBasePrice;
    maxSafeBid = Math.max(0, remainingPurse - mandatoryReserve);
  }

  // SWAP / MOVE PLAYER HANDLER (Drag & Drop or Quick Move)
  // Ensures when a player moves from XI to Bench, they are in Bench ONLY (not both!)
  const handleSwapSlots = (sourceSlotId: number, targetSlotId: number) => {
    if (sourceSlotId === targetSlotId) return;

    saveSnapshot();

    setSlots((prev) => {
      const sourceSlot = prev.find((s) => s.id === sourceSlotId);
      const targetSlot = prev.find((s) => s.id === targetSlotId);
      if (!sourceSlot || !targetSlot) return prev;

      return prev.map((s) => {
        if (s.id === sourceSlotId) {
          // Source takes whatever was in target (or null)
          return {
            ...s,
            player: targetSlot.player,
            soldPrice: targetSlot.soldPrice,
          };
        }
        if (s.id === targetSlotId) {
          // Target takes source player
          return {
            ...s,
            player: sourceSlot.player,
            soldPrice: sourceSlot.soldPrice,
          };
        }
        return s;
      });
    });

    const sourcePlayer = slots.find((s) => s.id === sourceSlotId)?.player;
    const destSlot = slots.find((s) => s.id === targetSlotId);
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: `Moved ${sourcePlayer?.name || 'Player'} to ${destSlot?.slotLabel || 'Slot'}`,
      description: `Player is now in Slot ${targetSlotId} exclusively.`,
      canUndo: true,
    });
  };

  // Open player select modal for a specific slot
  const handleOpenAssignModal = (slotId: number) => {
    setActiveSlotId(slotId);
    setIsAssignModalOpen(true);
  };

  // Confirm assign from PlayerAssignModal
  const handleConfirmAssign = (slotId: number, player: Player, soldPrice: number) => {
    saveSnapshot();

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          return { ...s, player, soldPrice };
        }
        return s;
      })
    );

    // Also mark as bought in targets if present
    setTargets((prev) =>
      prev.map((t) => {
        if (t.player.id === player.id || t.player.name.toLowerCase() === player.name.toLowerCase()) {
          return { ...t, status: 'bought', soldPrice };
        }
        return t;
      })
    );

    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: `Added ${player.name}`,
      description: `Assigned to Slot ${slotId} for ₹${soldPrice.toFixed(2)} Cr.`,
      canUndo: true,
    });
  };

  // Confirm purchase from WinningBidModal
  const handleConfirmPurchase = (
    slotId: number,
    player: Player,
    purchasePrice: number,
    targetId?: string
  ) => {
    saveSnapshot();

    // Assign player and price to the selected slot
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          return { ...s, player, soldPrice: purchasePrice };
        }
        return s;
      })
    );

    // Mark as bought in targets and record winning bid price
    setTargets((prev) =>
      prev.map((t) => {
        if (
          (targetId && t.id === targetId) ||
          t.player.id === player.id ||
          t.player.name.toLowerCase() === player.name.toLowerCase()
        ) {
          return { ...t, status: 'bought', soldPrice: purchasePrice };
        }
        return t;
      })
    );

    const destSlot = slots.find((s) => s.id === slotId);
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: `Won Bid: ${player.name} (₹${purchasePrice.toFixed(2)} Cr)`,
      description: `Placed in Slot ${slotId} (${destSlot?.slotLabel || 'Squad'}). Remaining purse updated.`,
      canUndo: true,
    });
  };

  // Remove player from slot
  const handleRemovePlayer = (slotId: number) => {
    const slotToRemove = slots.find((s) => s.id === slotId);
    if (!slotToRemove?.player) return;

    saveSnapshot();
    const removedPlayerId = slotToRemove.player.id;
    const removedPlayerName = slotToRemove.player.name;

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          return { ...s, player: null, soldPrice: null };
        }
        return s;
      })
    );

    // Revert target status to available if it was bought
    setTargets((prev) =>
      prev.map((t) => {
        if (
          t.player.id === removedPlayerId ||
          t.player.name.toLowerCase() === removedPlayerName.toLowerCase()
        ) {
          return { ...t, status: 'available', soldPrice: undefined };
        }
        return t;
      })
    );

    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: `Removed ${removedPlayerName}`,
      description: `Slot ${slotId} is now vacant. Purse refunded.`,
      canUndo: true,
    });
  };

  // Inline slot price update
  const handleUpdateSlotPrice = (slotId: number, newPrice: number) => {
    saveSnapshot();
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, soldPrice: newPrice } : s))
    );
  };

  // Update target planned budget
  const handleUpdateTargetBudget = (targetId: string, newBudget: number) => {
    saveSnapshot();
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, targetMaxPrice: newBudget } : t))
    );
  };

  // Reset all 25 slots
  const handleResetXI = () => {
    if (window.confirm('Are you sure you want to clear all 25 squad spots?')) {
      saveSnapshot();
      setSlots(INITIAL_25_SLOTS);
      setTargets((prev) =>
        prev.map((t) => (t.status === 'bought' ? { ...t, status: 'available' } : t))
      );
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Squad Reset',
        description: 'All 25 roster spots cleared.',
        canUndo: true,
      });
    }
  };

  // Quick buy from target watchlist -> opens WinningBidModal
  const handleQuickBuyTarget = (target: TargetPlayer) => {
    setWinningBidPlayer(target.player);
    setWinningBidTarget(target);

    // Find suggested vacant slot
    let matchingVacant = slots.find(
      (s) => s.category === 'xi' && s.player === null && s.suggestedRole === target.player.role
    );
    if (!matchingVacant) {
      matchingVacant = slots.find((s) => s.category === 'xi' && s.player === null);
    }
    if (!matchingVacant) {
      matchingVacant = slots.find((s) => s.category === 'impact' && s.player === null);
    }
    if (!matchingVacant) {
      matchingVacant = slots.find((s) => s.player === null);
    }

    setWinningBidDefaultSlotId(matchingVacant ? matchingVacant.id : 1);
    setIsWinningBidModalOpen(true);
  };

  // Draft player from Scouting Hub, Fast Record Bar, or Alternative Modal -> opens WinningBidModal
  const handleDraftPlayer = (player: Player) => {
    const existingTarget = targets.find((t) => t.player.id === player.id) || null;
    setWinningBidPlayer(player);
    setWinningBidTarget(existingTarget);

    let matchingVacant = slots.find(
      (s) => s.category === 'xi' && s.player === null && s.suggestedRole === player.role
    );
    if (!matchingVacant) {
      matchingVacant = slots.find((s) => s.category === 'xi' && s.player === null);
    }
    if (!matchingVacant) {
      matchingVacant = slots.find((s) => s.category === 'impact' && s.player === null);
    }
    if (!matchingVacant) {
      matchingVacant = slots.find((s) => s.player === null);
    }

    setWinningBidDefaultSlotId(matchingVacant ? matchingVacant.id : 1);
    setIsWinningBidModalOpen(true);
  };

  // Mark target lost & automatically trigger next-alternative suggestion
  const handleMarkLost = (targetId: string, player: Player) => {
    saveSnapshot();
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, status: 'lost' } : t))
    );

    // Open alternative suggestion engine
    setLostPlayerForAlternative(player);
    setIsAlternativeModalOpen(true);
  };

  // Explicitly find alternative
  const handleFindAlternative = (player: Player) => {
    setLostPlayerForAlternative(player);
    setIsAlternativeModalOpen(true);
  };

  // Target an alternative
  const handleTargetAlternative = (player: Player, targetMaxPrice: number) => {
    handleAddTarget(player, targetMaxPrice, 'High');
  };

  // Add new target
  const handleAddTarget = (
    player: Player,
    targetMaxPrice: number,
    priority: 'Must-Have' | 'High' | 'Backup'
  ) => {
    saveSnapshot();
    const newTarget: TargetPlayer = {
      id: `target_${Date.now()}`,
      player,
      targetMaxPrice,
      priority,
      status: 'available',
    };
    setTargets((prev) => [newTarget, ...prev]);
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: `Target Added: ${player.name}`,
      description: `Planned Budget: ₹${targetMaxPrice.toFixed(2)} Cr (${priority})`,
      canUndo: true,
    });
  };

  // Remove target
  const handleRemoveTarget = (targetId: string) => {
    saveSnapshot();
    setTargets((prev) => prev.filter((t) => t.id !== targetId));
  };

  // Export PDF with full 25 squad spots
  const handleExportPDF = () => {
    generateTeamPDF(settings.teamName, settings, slots, totalSpent, remainingPurse);
  };

  const activeSlot = slots.find((s) => s.id === activeSlotId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🏏</span>
          <div>
            <span className="font-black text-lg text-white tracking-wide">
              IPL AUCTION HELPER
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              522 Master Players • Drag & Drop XI/Bench
            </span>
          </div>
        </div>

        {/* Undo & Export & AI Import */}
        <div className="flex items-center space-x-2.5">
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700/60"
              title="Undo last action"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo ({history.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsAIImportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition active:scale-95"
            title="Import target players, alternatives & budgets from ChatGPT plan"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import AI Plan</span>
            <span className="sm:hidden">AI Plan</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <span className="hidden sm:inline">Download 25-Player PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 flex-1">
        {/* 1. Header & Purse KPIs */}
        <PurseMetrics
          settings={settings}
          onUpdateSettings={setSettings}
          slots={slots}
          onResetXI={handleResetXI}
          onExportPDF={handleExportPDF}
        />

        {/* 2. Fast Record Win Bar (Quick Instant Action) */}
        <FastRecordBar
          allPlayers={allPlayers}
          slots={slots}
          onPlayerSelected={handleDraftPlayer}
        />

        {/* Section View Tabs & AI Import Quick Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSectionTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSectionTab === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setActiveSectionTab('SQUAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSectionTab === 'SQUAD'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad & Watchlist</span>
            </button>
            <button
              onClick={() => setActiveSectionTab('SETS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSectionTab === 'SETS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Set-Wise Tracker</span>
              {targets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-300">
                  {targets.filter((t) => t.status === 'available').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSectionTab('SCOUTING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSectionTab === 'SCOUTING'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Role Scouting</span>
            </button>
          </div>

          <button
            onClick={() => setIsAIImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload / Paste ChatGPT Plan</span>
          </button>
        </div>

        {/* 3. Grid: 25-Spot Squad Board (Drag & Drop) + Target Watchlist */}
        {(activeSectionTab === 'ALL' || activeSectionTab === 'SQUAD') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Squad Board (7 cols on lg) */}
            <div className="lg:col-span-7">
              <SquadBoard
                slots={slots}
                onOpenAssignModal={handleOpenAssignModal}
                onRemovePlayer={handleRemovePlayer}
                onUpdateSlotPrice={handleUpdateSlotPrice}
                onSwapSlots={handleSwapSlots}
              />
            </div>

            {/* Right Column: Targeted Players & Watchlist (5 cols on lg) */}
            <div className="lg:col-span-5">
              <TargetWatchlist
                targets={targets}
                onAddTarget={handleAddTarget}
                onRemoveTarget={handleRemoveTarget}
                onMarkLost={handleMarkLost}
                onQuickBuyTarget={handleQuickBuyTarget}
                onFindAlternative={handleFindAlternative}
                onUpdateTargetBudget={handleUpdateTargetBudget}
                allPlayers={allPlayers}
                slots={slots}
                onOpenAIImport={() => setIsAIImportModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* 4. Set-Wise Auction Tracker & Strategy Separation */}
        {(activeSectionTab === 'ALL' || activeSectionTab === 'SETS') && (
          <SetWiseAuctionTracker
            allPlayers={allPlayers}
            slots={slots}
            targets={targets}
            liveSetCode={liveSetCode}
            onSetLiveSetCode={setLiveSetCode}
            onDraftPlayer={handleDraftPlayer}
            onMarkLost={handleMarkLost}
            onAddTarget={handleAddTarget}
            onUpdateTargetBudget={handleUpdateTargetBudget}
          />
        )}

        {/* 5. Role Scouting & Alternative Hub (Wicket-Keepers, Batsmen, All-Rounders, Bowlers) */}
        {(activeSectionTab === 'ALL' || activeSectionTab === 'SCOUTING') && (
          <RoleScoutingHub
            allPlayers={allPlayers}
            slots={slots}
            targets={targets}
            onDraftPlayer={handleDraftPlayer}
            onAddTarget={handleAddTarget}
          />
        )}
      </main>

      {/* 6. AI / ChatGPT Plan Import Modal */}
      <AIPlanImportModal
        isOpen={isAIImportModalOpen}
        onClose={() => setIsAIImportModalOpen(false)}
        allPlayers={allPlayers}
        onImportTargets={handleImportTargets}
      />

      {/* 7. Winning Bid Prompt Modal */}
      <WinningBidModal
        isOpen={isWinningBidModalOpen}
        onClose={() => setIsWinningBidModalOpen(false)}
        player={winningBidPlayer}
        targetInfo={winningBidTarget}
        slots={slots}
        defaultSlotId={winningBidDefaultSlotId}
        remainingPurse={remainingPurse}
        maxSafeBid={maxSafeBid}
        onConfirmPurchase={handleConfirmPurchase}
      />

      {/* 8. Slot Player Assign Modal */}
      <PlayerAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        targetSlot={activeSlot}
        playersList={allPlayers}
        onConfirmAssign={handleConfirmAssign}
        maxSafeBid={maxSafeBid}
      />

      {/* 9. Alternative Suggestion Modal */}
      <AlternativeSuggestionModal
        isOpen={isAlternativeModalOpen}
        onClose={() => setIsAlternativeModalOpen(false)}
        lostPlayer={lostPlayerForAlternative}
        allPlayers={allPlayers}
        slots={slots}
        targets={targets}
        maxSafeBid={maxSafeBid}
        onTargetAlternative={handleTargetAlternative}
        onDraftAlternative={handleDraftPlayer}
      />

      {/* 10. Toast Feedback with 1-Click Undo */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
        onUndo={handleUndo}
      />
    </div>
  );
};

export default App;
