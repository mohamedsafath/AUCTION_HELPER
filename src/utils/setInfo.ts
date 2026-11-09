import { Player, PlayerRole } from '../types';

export interface SetMeta {
  code: string;
  name: string;
  shortLabel: string;
  category: 'Marquee' | 'Special' | 'Capped' | 'Uncapped' | 'Other';
  role: PlayerRole | 'MIXED';
  roleLabel: string;
  icon: string;
  colorClass: string;
}

export const getSetMeta = (code?: string): SetMeta => {
  const c = (code || '').trim();

  if (c === 'Marquee Set 1') {
    return {
      code: c,
      name: 'Marquee Set 1',
      shortLabel: 'Marquee 1',
      category: 'Marquee',
      role: 'MIXED',
      roleLabel: 'Elite Marquee Players',
      icon: '👑',
      colorClass: 'from-amber-500/20 to-yellow-600/10 border-amber-500/40 text-amber-300',
    };
  }

  if (c.startsWith('Set ')) {
    return {
      code: c,
      name: `Special ${c}`,
      shortLabel: c,
      category: 'Special',
      role: 'MIXED',
      roleLabel: 'Core Auction Pool',
      icon: '⭐',
      colorClass: 'from-blue-500/20 to-indigo-600/10 border-blue-500/40 text-blue-300',
    };
  }

  // Capped sets
  if (c.startsWith('BA')) {
    const num = c.replace('BA', '');
    return {
      code: c,
      name: `Capped Batsmen (Set ${num})`,
      shortLabel: c,
      category: 'Capped',
      role: 'BAT',
      roleLabel: 'Batsmen',
      icon: '🏏',
      colorClass: 'from-rose-500/20 to-red-600/10 border-rose-500/40 text-rose-300',
    };
  }

  if (c.startsWith('AL')) {
    const num = c.replace('AL', '');
    return {
      code: c,
      name: `Capped All-Rounders (Set ${num})`,
      shortLabel: c,
      category: 'Capped',
      role: 'AR',
      roleLabel: 'All-Rounders',
      icon: '⚡',
      colorClass: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-300',
    };
  }

  if (c.startsWith('WK')) {
    const num = c.replace('WK', '');
    return {
      code: c,
      name: `Capped Wicket-Keepers (Set ${num})`,
      shortLabel: c,
      category: 'Capped',
      role: 'WK',
      roleLabel: 'Wicket-Keepers',
      icon: '🧤',
      colorClass: 'from-purple-500/20 to-violet-600/10 border-purple-500/40 text-purple-300',
    };
  }

  if (c.startsWith('FA')) {
    const num = c.replace('FA', '');
    return {
      code: c,
      name: `Capped Fast Bowlers (Set ${num})`,
      shortLabel: c,
      category: 'Capped',
      role: 'BOWL',
      roleLabel: 'Fast Bowlers',
      icon: '🎯',
      colorClass: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/40 text-cyan-300',
    };
  }

  if (c.startsWith('SP')) {
    const num = c.replace('SP', '');
    return {
      code: c,
      name: `Capped Spinners (Set ${num})`,
      shortLabel: c,
      category: 'Capped',
      role: 'BOWL',
      roleLabel: 'Spinners',
      icon: '🌀',
      colorClass: 'from-teal-500/20 to-emerald-600/10 border-teal-500/40 text-teal-300',
    };
  }

  // Uncapped sets
  if (c.startsWith('UBA')) {
    const num = c.replace('UBA', '');
    return {
      code: c,
      name: `Uncapped Batsmen (Set ${num})`,
      shortLabel: c,
      category: 'Uncapped',
      role: 'BAT',
      roleLabel: 'Uncapped Batsmen',
      icon: '🏏',
      colorClass: 'from-orange-500/20 to-amber-600/10 border-orange-500/40 text-orange-300',
    };
  }

  if (c.startsWith('UAL')) {
    const num = c.replace('UAL', '');
    return {
      code: c,
      name: `Uncapped All-Rounders (Set ${num})`,
      shortLabel: c,
      category: 'Uncapped',
      role: 'AR',
      roleLabel: 'Uncapped All-Rounders',
      icon: '⚡',
      colorClass: 'from-lime-500/20 to-green-600/10 border-lime-500/40 text-lime-300',
    };
  }

  if (c.startsWith('UWK')) {
    const num = c.replace('UWK', '');
    return {
      code: c,
      name: `Uncapped Wicket-Keepers (Set ${num})`,
      shortLabel: c,
      category: 'Uncapped',
      role: 'WK',
      roleLabel: 'Uncapped Wicket-Keepers',
      icon: '🧤',
      colorClass: 'from-fuchsia-500/20 to-pink-600/10 border-fuchsia-500/40 text-fuchsia-300',
    };
  }

  if (c.startsWith('UFA')) {
    const num = c.replace('UFA', '');
    return {
      code: c,
      name: `Uncapped Fast Bowlers (Set ${num})`,
      shortLabel: c,
      category: 'Uncapped',
      role: 'BOWL',
      roleLabel: 'Uncapped Fast Bowlers',
      icon: '🎯',
      colorClass: 'from-sky-500/20 to-cyan-600/10 border-sky-500/40 text-sky-300',
    };
  }

  if (c.startsWith('USP')) {
    const num = c.replace('USP', '');
    return {
      code: c,
      name: `Uncapped Spinners (Set ${num})`,
      shortLabel: c,
      category: 'Uncapped',
      role: 'BOWL',
      roleLabel: 'Uncapped Spinners',
      icon: '🌀',
      colorClass: 'from-emerald-500/20 to-green-600/10 border-emerald-500/40 text-emerald-300',
    };
  }

  return {
    code: c,
    name: c || 'General Set',
    shortLabel: c || 'Set',
    category: 'Other',
    role: 'MIXED',
    roleLabel: 'General Pool',
    icon: '📋',
    colorClass: 'from-slate-700/30 to-slate-800/20 border-slate-700 text-slate-300',
  };
};

export interface SetSummary {
  meta: SetMeta;
  players: Player[];
  totalPlayers: number;
  overseasCount: number;
  cappedCount: number;
}

export const getOrderedSetSummaries = (players: Player[]): SetSummary[] => {
  if (!Array.isArray(players) || players.length === 0) return [];

  // Preserve chronological order of sets as they appear in the player database
  const seen = new Set<string>();
  const setCodes: string[] = [];

  players.forEach((p) => {
    if (!p) return;
    const s = p.marqueeSet || 'Unspecified Set';
    if (!seen.has(s)) {
      seen.add(s);
      setCodes.push(s);
    }
  });

  return setCodes.map((code) => {
    const setPlayers = players.filter((p) => p && (p.marqueeSet || 'Unspecified Set') === code);
    return {
      meta: getSetMeta(code),
      players: setPlayers,
      totalPlayers: setPlayers.length,
      overseasCount: setPlayers.filter((p) => p?.isOverseas).length,
      cappedCount: setPlayers.filter((p) => p?.isCapped).length,
    };
  });
};
