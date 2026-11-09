export type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';
export type SlotCategory = 'xi' | 'impact' | 'bench';

export interface Player {
  id: string; // e.g. "P001"
  name: string;
  role: PlayerRole;
  roleFull?: string; // "Wicket-Keeper", "Batsman", "All-Rounder", "Bowler"
  marqueeSet: string; // "Marquee Set 1", "Set 1", "WK1", "FA1", etc.
  isOverseas: boolean;
  basePrice: number; // in Crores
  previousSoldPrice?: number | null; // in Crores
  previousTeam?: string;
  isCapped?: boolean;
}

export interface Slot {
  id: number; // 1 to 25
  slotLabel: string;
  category: SlotCategory; // 'xi' (1-11), 'impact' (12), 'bench' (13-25)
  suggestedRole: PlayerRole;
  isMandatory: boolean; // Slots 1-18 are mandatory (min 18), 19-25 are optional expansion (max 25)
  player: Player | null;
  soldPrice: number | null; // in Crores
}

export interface TargetPlayer {
  id: string;
  player: Player;
  targetMaxPrice: number; // in Crores
  priority: 'Must-Have' | 'High' | 'Backup';
  status: 'available' | 'bought' | 'lost';
  soldPrice?: number;
  soldTo?: string; // e.g. 'CSK', 'MI', 'Rival'
  notes?: string;
  backupPlayerId?: string;
}

export interface AuctionSettings {
  teamName: string;
  totalPurse: number; // in Crores
  minBasePrice: number; // default 0.30 Cr (30 Lakhs)
  maxOverseasInXI: number; // 4
  maxOverseasInSquad: number; // 8
  minSquadSize: number; // 18 (Mandatory minimum)
  maxSquadSize: number; // 25 (Squad ceiling)
}
