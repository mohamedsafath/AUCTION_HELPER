import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, TargetPlayer } from '../types';
import {
  parseAIPlan,
  ParsedTargetItem,
  SAMPLE_CHATGPT_PLAN,
} from '../utils/aiPlanParser';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Check,
  Plane,
  ArrowRight,
  HelpCircle,
  Search,
} from 'lucide-react';

interface AIPlanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: Player[];
  onImportTargets: (
    targets: TargetPlayer[],
    mode: 'merge' | 'replace'
  ) => void;
}

export const AIPlanImportModal: React.FC<AIPlanImportModalProps> = ({
  isOpen,
  onClose,
  allPlayers,
  onImportTargets,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedTargetItem[]>([]);
  const [includeAlternativesAsTargets, setIncludeAlternativesAsTargets] = useState<boolean>(true);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isSearchingPlayerFor, setIsSearchingPlayerFor] = useState<{
    itemId: string;
    type: 'target' | 'alt';
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse text whenever rawText changes
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedItems([]);
      return;
    }
    const items = parseAIPlan(rawText, allPlayers);
    setParsedItems(items);
  }, [rawText, allPlayers]);

  // Filter candidates for manual player picker modal
  const searchCandidates = useMemo(() => {
    if (!searchQuery.trim()) return allPlayers.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return allPlayers
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allPlayers, searchQuery]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_CHATGPT_PLAN);
  };

  const handleClear = () => {
    setRawText('');
    setParsedItems([]);
  };

  const handleToggleSelectAll = (select: boolean) => {
    setParsedItems((prev) =>
      prev.map((item) => ({ ...item, selected: select }))
    );
  };

  const handleToggleItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdateBudget = (id: string, budget: number) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, targetMaxPrice: budget } : item
      )
    );
  };

  const handleUpdatePriority = (
    id: string,
    priority: 'Must-Have' | 'High' | 'Backup'
  ) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, priority } : item
      )
    );
  };

  const handleManualSelectPlayer = (player: Player) => {
    if (!isSearchingPlayerFor) return;

    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === isSearchingPlayerFor.itemId) {
          if (isSearchingPlayerFor.type === 'target') {
            return {
              ...item,
              matchedPlayer: player,
              confidence: 1.0,
              selected: true,
            };
          } else {
            return {
              ...item,
              matchedAlternative: player,
              rawAlternativeName: player.name,
              notes: `Alternative: ${player.name}`,
            };
          }
        }
        return item;
      })
    );

    setIsSearchingPlayerFor(null);
    setSearchQuery('');
  };

  const selectedItems = parsedItems.filter(
    (item) => item.selected && item.matchedPlayer !== null
  );
  const totalPlannedBudget = selectedItems.reduce(
    (sum, item) => sum + item.targetMaxPrice,
    0
  );
  const altCount = selectedItems.filter((i) => i.matchedAlternative !== null).length;

  const handleConfirmImport = () => {
    if (selectedItems.length === 0) return;

    const newTargets: TargetPlayer[] = [];
    const addedPlayerIds = new Set<string>();

    selectedItems.forEach((item) => {
      const p = item.matchedPlayer!;
      if (!addedPlayerIds.has(p.id)) {
        addedPlayerIds.add(p.id);

        let backupPlayerId = item.matchedAlternative?.id;
        let notes = item.notes;
        if (item.matchedAlternative && !notes) {
          notes = `Alternative: ${item.matchedAlternative.name}${
            item.alternativeBudget ? ` (Max ₹${item.alternativeBudget.toFixed(2)} Cr)` : ''
          }`;
        }

        newTargets.push({
          id: `target_ai_${Date.now()}_${p.id}`,
          player: p,
          targetMaxPrice: item.targetMaxPrice,
          priority: item.priority,
          status: 'available',
          notes,
          backupPlayerId,
        });
      }

      // If user also wants alternatives added to watchlist as Backup targets
      if (includeAlternativesAsTargets && item.matchedAlternative) {
        const alt = item.matchedAlternative;
        if (!addedPlayerIds.has(alt.id)) {
          addedPlayerIds.add(alt.id);
          const altBudget = item.alternativeBudget || parseFloat((item.targetMaxPrice * 0.75).toFixed(2));
          newTargets.push({
            id: `target_ai_alt_${Date.now()}_${alt.id}`,
            player: alt,
            targetMaxPrice: altBudget,
            priority: 'Backup',
            status: 'available',
            notes: `Backup alternative for ${p.name}`,
          });
        }
      }
    });

    onImportTargets(newTargets, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Import AI / ChatGPT Auction Plan
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Smart Parser
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload or paste plain text from ChatGPT, Gemini, or Claude. Auto-detects targets, alternatives & budgets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Input Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Paste Plan Text or Upload File
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Load Sample ChatGPT Plan
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.json,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3 h-3 text-slate-400" />
                  Upload File (.txt, .md)
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-rose-400 transition"
                    title="Clear text"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your AI plan here (e.g. 1. Rishabh Pant - Target: ₹18 Cr | Alt: Ishan Kishan (₹12 Cr), or paste a Markdown table / JSON)..."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition resize-y placeholder:text-slate-600"
            />
          </div>

          {/* Parsed Preview Section */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Targets Selected
                  </div>
                  <div className="text-lg font-black text-white">
                    {selectedItems.length}{' '}
                    <span className="text-xs font-medium text-slate-500">
                      / {parsedItems.length}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Planned Budget
                  </div>
                  <div className="text-lg font-black text-emerald-400">
                    ₹{totalPlannedBudget.toFixed(2)}{' '}
                    <span className="text-xs font-medium text-slate-500">Cr</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Alternatives Found
                  </div>
                  <div className="text-lg font-black text-amber-400">
                    {altCount}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Match Confidence
                  </div>
                  <div className="text-lg font-black text-indigo-400">
                    {Math.round(
                      (selectedItems.reduce((s, i) => s + i.confidence, 0) /
                        (selectedItems.length || 1)) *
                        100
                    )}
                    %
                  </div>
                </div>
              </div>

              {/* Table Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-300">
                    Detected Players ({parsedItems.length})
                  </span>
                  <button
                    onClick={() => handleToggleSelectAll(true)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => handleToggleSelectAll(false)}
                    className="text-[11px] text-slate-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeAlternativesAsTargets}
                      onChange={(e) => setIncludeAlternativesAsTargets(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-slate-300 text-xs">
                      Also add alternatives as Backup watchlist targets
                    </span>
                  </label>
                </div>
              </div>

              {/* Parsed List Items */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {parsedItems.map((item) => {
                  const p = item.matchedPlayer;
                  const alt = item.matchedAlternative;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        item.selected
                          ? 'bg-slate-850 border-slate-700/80 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      }`}
                    >
                      {/* Left: Checkbox + Player Details */}
                      <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleItem(item.id)}
                          disabled={!item.matchedPlayer}
                          className="mt-1 sm:mt-0 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
                        />

                        {p ? (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-white text-sm tracking-wide">
                                {p.name}
                              </span>
                              {p.isOverseas && (
                                <span className="text-xs" title="Overseas Player">
                                  ✈️
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {p.roleFull || p.role}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {p.marqueeSet}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Base: ₹{p.basePrice.toFixed(2)} Cr
                              </span>
                            </div>

                            {/* Alternative / Notes Line */}
                            <div className="flex items-center space-x-2 mt-1 flex-wrap text-xs">
                              {alt ? (
                                <span className="inline-flex items-center space-x-1 text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 text-[11px]">
                                  <span className="text-amber-400 font-semibold">
                                    🔄 Alt:
                                  </span>
                                  <span>{alt.name}</span>
                                  {alt.marqueeSet && (
                                    <span className="text-[10px] text-slate-400">
                                      ({alt.marqueeSet})
                                    </span>
                                  )}
                                  {item.alternativeBudget && (
                                    <span className="text-emerald-400 font-semibold">
                                      • ₹{item.alternativeBudget.toFixed(2)} Cr
                                    </span>
                                  )}
                                </span>
                              ) : item.rawAlternativeName ? (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <span>Alt: {item.rawAlternativeName}</span>
                                  <button
                                    onClick={() => {
                                      setIsSearchingPlayerFor({ itemId: item.id, type: 'alt' });
                                      setSearchQuery(item.rawAlternativeName || '');
                                    }}
                                    className="text-[10px] text-indigo-400 hover:underline"
                                  >
                                    (Match)
                                  </button>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-rose-400 text-xs">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              Unmatched: "{item.rawTargetName}" —{' '}
                              <button
                                onClick={() => {
                                  setIsSearchingPlayerFor({ itemId: item.id, type: 'target' });
                                  setSearchQuery(item.rawTargetName);
                                }}
                                className="underline font-semibold text-indigo-400 hover:text-indigo-300"
                              >
                                Find in 522 players
                              </button>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Editable Budget & Priority */}
                      <div className="flex items-center space-x-3 shrink-0 pl-7 sm:pl-0">
                        {/* Priority Selector */}
                        <div className="flex flex-col items-start">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Priority
                          </label>
                          <select
                            value={item.priority}
                            onChange={(e) =>
                              handleUpdatePriority(
                                item.id,
                                e.target.value as 'Must-Have' | 'High' | 'Backup'
                              )
                            }
                            className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Must-Have">Must-Have</option>
                            <option value="High">High</option>
                            <option value="Backup">Backup</option>
                          </select>
                        </div>

                        {/* Budget Input */}
                        <div className="flex flex-col items-start">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Target Budget (Cr)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.25"
                              min="0.20"
                              max="35.0"
                              value={item.targetMaxPrice}
                              onChange={(e) =>
                                handleUpdateBudget(item.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-24 pl-5 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Player Dialog Overlay */}
          {isSearchingPlayerFor && (
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">
                  Select matching player from Master 522 Database
                </span>
                <button
                  onClick={() => setIsSearchingPlayerFor(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1">
                {searchCandidates.map((cand) => (
                  <button
                    key={cand.id}
                    onClick={() => handleManualSelectPlayer(cand)}
                    className="w-full px-3 py-1.5 text-left text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between transition"
                  >
                    <span className="font-semibold text-white">
                      {cand.name} {cand.isOverseas && '✈️'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {cand.roleFull} • {cand.marqueeSet}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Import Mode:</span>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="text-indigo-500 focus:ring-0 bg-slate-900"
              />
              <span>Merge with existing</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-indigo-500 focus:ring-0 bg-slate-900"
              />
              <span className="text-amber-400">Replace existing targets</span>
            </label>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={selectedItems.length === 0}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Import {selectedItems.length} Target{selectedItems.length !== 1 ? 's' : ''}{' '}
                (₹{totalPlannedBudget.toFixed(2)} Cr)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
