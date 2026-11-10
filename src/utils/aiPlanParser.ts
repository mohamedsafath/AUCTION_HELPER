import { Player } from '../types';

export interface ParsedTargetItem {
  id: string;
  rawTargetName: string;
  matchedPlayer: Player | null;
  targetPrice?: number; // Minimum / Ideal target budget (in Crores)
  targetMaxPrice: number; // Maximum walkaway ceiling (in Crores)
  priority: 'Must-Have' | 'High' | 'Medium' | 'Backup';
  rawAlternativeName?: string;
  matchedAlternative?: Player | null;
  alternativeBudget?: number; // in Crores
  rawBackupName?: string;
  matchedBackup?: Player | null;
  backupBudget?: number;
  notes?: string;
  form?: string;
  confidence: number; // 0.0 to 1.0
  selected: boolean;
}

// Helper to clean and normalize a string
export const cleanText = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Fuzzy/token matcher for player names
export const findBestPlayerMatch = (
  query: string,
  players: Player[]
): { player: Player | null; confidence: number } => {
  if (!query || !query.trim()) return { player: null, confidence: 0 };

  // Remove common role/filler terms from query: (WK), (BAT), (AR), (BOWL), etc.
  let cleaned = query
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(
      /\b(wk|wicket-keeper|wicketkeeper|bat|batsman|batter|ar|all-rounder|allrounder|bowl|bowler|fast bowler|spinner|overseas|os|ind|india|opener|anchor|finisher|captain)\b/gi,
      ''
    )
    .trim();

  const normQuery = cleanText(cleaned);
  if (!normQuery) return { player: null, confidence: 0 };

  // 1. Exact match
  const exact = players.find((p) => cleanText(p.name) === normQuery);
  if (exact) return { player: exact, confidence: 1.0 };

  // 2. Token overlap & substring match
  const qTokens = normQuery.split(' ').filter(Boolean);
  let bestPlayer: Player | null = null;
  let bestScore = 0;

  for (const p of players) {
    const pNorm = cleanText(p.name);
    const pTokens = pNorm.split(' ').filter(Boolean);

    // Exact inclusion
    if (pNorm === normQuery) {
      return { player: p, confidence: 1.0 };
    }

    if (pNorm.includes(normQuery) || normQuery.includes(pNorm)) {
      const score = 0.92;
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = p;
      }
    }

    // Token overlap: count matching words
    const matchedTokens = qTokens.filter((qt) =>
      pTokens.some(
        (pt) =>
          pt === qt ||
          (qt.length >= 3 && pt.startsWith(qt)) ||
          (pt.length >= 3 && qt.startsWith(pt))
      )
    );

    const tokenRatio =
      matchedTokens.length / Math.max(qTokens.length, pTokens.length);
    if (tokenRatio > bestScore && tokenRatio >= 0.5) {
      bestScore = tokenRatio;
      bestPlayer = p;
    }
  }

  // 3. Fallback: Levenshtein distance for close typos
  if (!bestPlayer || bestScore < 0.75) {
    for (const p of players) {
      const pNorm = cleanText(p.name);
      const dist = levenshtein(normQuery, pNorm);
      const maxLen = Math.max(normQuery.length, pNorm.length);
      const similarity = 1 - dist / maxLen;
      if (similarity > bestScore && similarity >= 0.75) {
        bestScore = similarity;
        bestPlayer = p;
      }
    }
  }

  return { player: bestPlayer, confidence: bestScore };
};

// Levenshtein distance implementation
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Extract budget in Crores from a string
export const extractBudget = (
  str: string,
  defaultPrice: number = 5.0
): number => {
  if (!str) return defaultPrice;

  // Check for Crores e.g. "₹ 18.5 Cr", "18 Cr", "18.5 crore", "18crores", "18.5cr"
  const crMatch = str.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores|c\b)/i
  );
  if (crMatch && crMatch[1]) {
    const val = parseFloat(crMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Check for Lakhs e.g. "50 Lakhs", "50 L", "₹50L" -> convert to Cr
  const lMatch = str.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i
  );
  if (lMatch && lMatch[1]) {
    const val = parseFloat(lMatch[1]);
    if (!isNaN(val) && val > 0) return parseFloat((val / 100).toFixed(2));
  }

  // Check for currency without explicit Cr e.g. "₹18.0", "Rs 15"
  const currMatch = str.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i);
  if (currMatch && currMatch[1]) {
    const val = parseFloat(currMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Check for standalone decimal or integer in budget contexts
  const numMatch = str.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch && numMatch[1]) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 35) {
      return val;
    }
  }

  return defaultPrice;
};

// Extract both Target (Minimum/Ideal) and Max (Ceiling) budgets from a string
export const extractTargetAndMaxBudget = (
  str: string,
  defaultBenchmark: number = 5.0
): { targetPrice: number; targetMaxPrice: number } => {
  if (!str) return { targetPrice: defaultBenchmark, targetMaxPrice: defaultBenchmark };

  // 1. Check for explicit Target and Max markers
  // e.g. "Target: ₹11 Cr | Max: ₹14 Cr" or "Target ₹11 Cr, Max ₹14 Cr"
  const targetMatch = str.match(
    /(?:target|min|ideal|base(?:\s*budget)?)\s*[:\-–]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)?/i
  );
  const maxMatch = str.match(
    /(?:max|ceiling|limit|walkaway|cap)\s*[:\-–]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)?/i
  );

  if (targetMatch && maxMatch) {
    const tVal = parseFloat(targetMatch[1]);
    const mVal = parseFloat(maxMatch[1]);
    return {
      targetPrice: tVal,
      targetMaxPrice: Math.max(tVal, mVal),
    };
  }

  // 2. Check for range: e.g. "₹11 Cr - ₹14 Cr", "11 - 14 Cr", "11 to 14 Cr"
  const rangeMatch = str.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)?\s*(?:-|to|–)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i
  );
  if (rangeMatch) {
    const val1 = parseFloat(rangeMatch[1]);
    const val2 = parseFloat(rangeMatch[2]);
    const minVal = Math.min(val1, val2);
    const maxVal = Math.max(val1, val2);
    return {
      targetPrice: minVal,
      targetMaxPrice: maxVal,
    };
  }

  // 3. Only Max is present
  if (maxMatch) {
    const mVal = parseFloat(maxMatch[1]);
    return {
      targetPrice: mVal,
      targetMaxPrice: mVal,
    };
  }

  // 4. Only Target is present
  if (targetMatch) {
    const tVal = parseFloat(targetMatch[1]);
    return {
      targetPrice: tVal,
      targetMaxPrice: tVal,
    };
  }

  // 5. Fallback to single extractBudget
  const single = extractBudget(str, defaultBenchmark);
  return {
    targetPrice: single,
    targetMaxPrice: single,
  };
};

// Extract priority from text
export const extractPriority = (
  str: string
): 'Must-Have' | 'High' | 'Medium' | 'Backup' => {
  // Check for explicit "Priority: Must-Have / High / Medium / Backup" marker first
  const explicitMatch = str.match(/priority\s*[:\-–]?\s*([a-zA-Z\-]+)/i);
  if (explicitMatch && explicitMatch[1]) {
    const val = explicitMatch[1].toLowerCase();
    if (val.includes('must')) return 'Must-Have';
    if (val.includes('high')) return 'High';
    if (val.includes('med')) return 'Medium';
    if (val.includes('backup') || val.includes('low') || val.includes('bench')) return 'Backup';
  }

  const lower = str.toLowerCase();
  if (
    lower.includes('must-have') ||
    lower.includes('must have') ||
    lower.includes('tier 1') ||
    lower.includes('p1') ||
    lower.includes('top priority') ||
    lower.includes('key target') ||
    lower.includes('core')
  ) {
    return 'Must-Have';
  }
  if (
    lower.includes('medium') ||
    lower.includes('tier 2') ||
    lower.includes('p2') ||
    lower.includes('moderate')
  ) {
    return 'Medium';
  }
  if (
    lower.includes('backup') ||
    lower.includes('plan b') ||
    lower.includes('contingency') ||
    lower.includes('secondary') ||
    lower.includes('p3') ||
    lower.includes('tier 3') ||
    lower.includes('reserve')
  ) {
    return 'Backup';
  }
  return 'High';
};

/**
 * Main parser function to parse any ChatGPT / AI text into structured target items
 */
export const parseAIPlan = (
  rawText: string,
  allPlayers: Player[]
): ParsedTargetItem[] => {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();
  const results: ParsedTargetItem[] = [];

  // 1. Try parsing JSON format first
  try {
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const parsedArray = JSON.parse(jsonStr);
      if (Array.isArray(parsedArray) && parsedArray.length > 0) {
        for (const item of parsedArray) {
          const rawName =
            item.name || item.player || item.target || item.targetPlayer || '';
          if (!rawName) continue;

          const match = findBestPlayerMatch(rawName, allPlayers);
          const rawBudgetStr = String(
            item.budget ||
              item.targetMaxPrice ||
              item.maxPrice ||
              item.price ||
              ''
          );
          const defaultBenchmark = match.player
            ? match.player.previousSoldPrice || match.player.basePrice * 2.5 || 5.0
            : 5.0;

          const budgets = extractTargetAndMaxBudget(rawBudgetStr, defaultBenchmark);
          const targetPrice =
            item.targetPrice !== undefined
              ? parseFloat(String(item.targetPrice))
              : budgets.targetPrice;
          const maxPrice =
            item.maxPrice !== undefined || item.targetMaxPrice !== undefined
              ? parseFloat(String(item.maxPrice || item.targetMaxPrice))
              : budgets.targetMaxPrice;

          const priorityStr = item.priority || '';
          const priority = extractPriority(priorityStr);

          const rawAltName =
            item.alternative || item.backup || item.alt || item.backupPlayer || '';
          const altMatch = rawAltName
            ? findBestPlayerMatch(rawAltName, allPlayers)
            : null;
          const altBudget =
            item.alternativeBudget || item.backupBudget
              ? extractBudget(
                  String(item.alternativeBudget || item.backupBudget),
                  maxPrice * 0.7
                )
              : undefined;

          results.push({
            id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            rawTargetName: rawName,
            matchedPlayer: match.player,
            targetPrice: targetPrice || maxPrice,
            targetMaxPrice: maxPrice,
            priority,
            rawAlternativeName: rawAltName || undefined,
            matchedAlternative: altMatch?.player || null,
            alternativeBudget: altBudget,
            notes:
              item.notes || (rawAltName ? `Alternative: ${rawAltName}` : undefined),
            form: item.form,
            confidence: match.confidence,
            selected: match.player !== null,
          });
        }

        if (results.length > 0) return results;
      }
    }
  } catch (e) {
    // Not valid JSON, continue to Markdown & text parsers
  }

  // 2. Line-by-line / Freeform text parser
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let currentTarget: ParsedTargetItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for Section headers to ignore
    if (
      line.startsWith('#') ||
      /^core target players/i.test(line) ||
      /^impact bench/i.test(line) ||
      /^budget allocation/i.test(line) ||
      /^priority targets/i.test(line)
    ) {
      continue;
    }

    // 2A. Check if this is a Form line: e.g. "Form: 2025 439 runs, SR 193.4; 2026 563 runs, SR 204.7."
    if (/^form\s*[:\-–]/i.test(line) && currentTarget) {
      const formText = line.replace(/^form\s*[:\-–]\s*/i, '').trim();
      currentTarget.form = formText;
      continue;
    }

    // 2B. Check if this is an Alternative line: e.g. "Alternative: Priyansh Arya (Budget: ₹4 Cr). 2025: 475 runs..."
    if (/^alternative\s*[:\-–]/i.test(line) && currentTarget) {
      const altContent = line.replace(/^alternative\s*[:\-–]\s*/i, '').trim();
      const altName = altContent.split(/\s*\(|\s*\.|\s*[-–]/)[0].trim();
      const altMatch = findBestPlayerMatch(altName, allPlayers);
      const altBudget = extractBudget(
        altContent,
        currentTarget.targetMaxPrice * 0.6
      );

      currentTarget.rawAlternativeName = altMatch.player?.name || altName;
      currentTarget.matchedAlternative = altMatch.player;
      currentTarget.alternativeBudget = altBudget;

      const altNotes = `Alt: ${altMatch.player?.name || altName} (₹${altBudget.toFixed(1)} Cr)`;
      currentTarget.notes = currentTarget.notes
        ? `${currentTarget.notes} • ${altNotes}`
        : altNotes;
      continue;
    }

    // 2C. Check if this is a Backup line: e.g. "Backup: Vaibhav Suryavanshi (already on the bench at ₹5 Cr)"
    if (/^backup\s*[:\-–]/i.test(line) && currentTarget) {
      const backupContent = line.replace(/^backup\s*[:\-–]\s*/i, '').trim();
      const backupName = backupContent.split(/\s*\(|\s*\.|\s*[-–]/)[0].trim();
      const backupMatch = findBestPlayerMatch(backupName, allPlayers);
      const backupBudget = extractBudget(
        backupContent,
        currentTarget.targetMaxPrice * 0.5
      );

      currentTarget.rawBackupName = backupMatch.player?.name || backupName;
      currentTarget.matchedBackup = backupMatch.player;
      currentTarget.backupBudget = backupBudget;

      // If no alternative was set, set this as alternative too
      if (!currentTarget.matchedAlternative && backupMatch.player) {
        currentTarget.matchedAlternative = backupMatch.player;
        currentTarget.alternativeBudget = backupBudget;
      }

      const backupNotes = `Backup: ${backupMatch.player?.name || backupName} (₹${backupBudget.toFixed(1)} Cr)`;
      currentTarget.notes = currentTarget.notes
        ? `${currentTarget.notes} • ${backupNotes}`
        : backupNotes;
      continue;
    }

    // 2D. Line containing a Player & Budget Allocation
    // Pattern: "Player Name (role/set) - Target: ₹X Cr | Max: ₹Y Cr | Priority: Z"
    // Strip bullet marks: "1. ", "- ", "* ", "• "
    const cleanedLine = line.replace(/^(?:[-*•#>]|\d+[.)])\s*/, '').trim();
    if (!cleanedLine) continue;

    // Split on dash separating player name info from budget/attributes
    // e.g. "Abhishek Sharma (Opener / spin all-rounder, Set 1) - Target: ₹11 Cr | Max: ₹14 Cr | Priority: Must-Have"
    const namePartMatch = cleanedLine.split(
      /\s*[-–—]\s*(?:target|max|min|budget|priority)/i
    );
    const potentialPlayerName = (namePartMatch[0] || '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    const match = findBestPlayerMatch(potentialPlayerName, allPlayers);

    if (match.player && match.confidence >= 0.55) {
      const defaultBenchmark =
        match.player.previousSoldPrice || match.player.basePrice * 2.5 || 5.0;

      // Extract Target & Max
      const budgets = extractTargetAndMaxBudget(cleanedLine, defaultBenchmark);
      const priority = extractPriority(cleanedLine);

      currentTarget = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        rawTargetName: match.player.name,
        matchedPlayer: match.player,
        targetPrice: budgets.targetPrice,
        targetMaxPrice: budgets.targetMaxPrice,
        priority,
        confidence: match.confidence,
        selected: true,
      };

      results.push(currentTarget);
    }
  }

  // De-duplicate results by player ID if any duplicates occurred
  const seenIds = new Set<string>();
  const uniqueResults: ParsedTargetItem[] = [];

  for (const item of results) {
    if (item.matchedPlayer) {
      if (!seenIds.has(item.matchedPlayer.id)) {
        seenIds.add(item.matchedPlayer.id);
        uniqueResults.push(item);
      }
    } else {
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
};

// Preset sample plan demonstrating Target (Min) & Max values
export const SAMPLE_CHATGPT_PLAN = `Core Target Players & Budget Allocation:

Abhishek Sharma (Opener / spin all-rounder, Set 1) - Target: ₹11 Cr | Max: ₹14 Cr | Priority: Must-Have
Form: 2025 439 runs, SR 193.4; 2026 563 runs, SR 204.7.
Alternative: Priyansh Arya (Budget: ₹4 Cr). 2025: 475 runs, SR 179.3. 2026: FLAG.
Backup: Vaibhav Suryavanshi (already on the bench at ₹5 Cr)

Prabhsimran Singh (WK-batter, opener, Set 4) - Target: ₹4.5 Cr | Max: ₹6 Cr | Priority: Must-Have
Form: 2025 549 runs, SR 160.5; 2026 510 runs, SR 168.9.
Alternative: Priyansh Arya (Budget: ₹4 Cr)
Backup: Ryan Rickelton (already on the bench at ₹3 Cr)

Sai Sudharsan (Top-order, GT opening role, Set 1) - Target: ₹10 Cr | Max: ₹13 Cr | Priority: Must-Have
Form: 2025 759 runs, SR 156.2 (Orange Cap); 2026 722 runs, SR 158.0.
Alternative: Devdutt Padikkal (Budget: ₹4 Cr). 2026: 464 runs, SR 168.7. 2025: FLAG.
Backup: Angkrish Raghuvanshi (Budget: ₹2 Cr). 2026: 422 runs. 2025: FLAG.

Shreyas Iyer (Middle-order, captain, Marquee Set 1) - Target: ₹13 Cr | Max: ₹16 Cr | Priority: Must-Have
Form: 2025 604 runs, SR 175.1; 2026 498 runs, average 55.3, SR 168.8.
Alternative: Virat Kohli (Budget: ₹14 Cr). 2025: 657 runs. 2026: 675 runs.
Backup: Shubman Gill (Budget: ₹15 Cr). 2025: 650 runs. 2026: 732 runs.

Heinrich Klaasen (Overseas WK, middle-order finisher, Marquee Set 1) - Target: ₹14 Cr | Max: ₹17 Cr | Priority: Must-Have
Form: 2025 487 runs, SR 172.7; 2026 624 runs, SR 160.0.
Alternative: KL Rahul (Budget: ₹13 Cr). 2025: 539 runs. 2026: 593 runs, SR 174.4.
Backup: Jos Buttler (Budget: ₹8 Cr). 2025: 538 runs. 2026: 526 runs.

Krunal Pandya (Spin all-rounder, Set 1) - Target: ₹4 Cr | Max: ₹6 Cr | Priority: High
Form: 2025 15 wickets; 2026 14 wickets at economy 8.42.
Alternative: Washington Sundar (Budget: ₹4 Cr). FLAG for both seasons.
Backup: Harpreet Brar (Budget: ₹1.5 Cr)

Bhuvneshwar Kumar (Swing bowler, powerplay and death, Marquee Set 1) - Target: ₹7 Cr | Max: ₹9 Cr | Priority: Must-Have
Form: 2025 15 wickets; 2026 28 wickets at economy 7.95.
Alternative: Mohammad Siraj (Budget: ₹9 Cr). 2025: 16 wickets. 2026: 19 wickets.
Backup: Mohammad Shami (Budget: ₹6 Cr). 2026: 12 wickets. 2025: FLAG.

Noor Ahmad (Overseas wrist-spinner, Marquee Set 1) - Target: ₹8 Cr | Max: ₹10 Cr | Priority: Must-Have
Form: 2025 24 wickets at economy 8.16; 2026 13 wickets at economy 8.39.
Alternative: Yuzvendra Chahal (Budget: ₹6 Cr). 2025: 16 wickets. 2026: 12 wickets.
Backup: Varun Chakravarthy (Budget: ₹7 Cr). 2025: 17 wickets at 7.66. 2026: 11 wickets at 8.78.

Prasidh Krishna (Indian fast bowler, Set 1) - Target: ₹7 Cr | Max: ₹9 Cr | Priority: High
Form: 2025 25 wickets (Purple Cap); 2026 16 wickets, but expensive at economy 10.43.
Alternative: Harshit Rana (Budget: ₹3 Cr). 2025: 15 wickets. 2026: FLAG.
Backup: Kartik Tyagi (Budget: ₹1.5 Cr). 2026: 18 wickets. 2025: FLAG.

Arshdeep Singh (Left-arm powerplay and death bowler, Marquee Set 1) - Target: ₹12 Cr | Max: ₹15 Cr | Priority: Must-Have
Form: 2025 21 wickets at economy 8.88; 2026 14 wickets.
Alternative: Jofra Archer (Budget: ₹8 Cr). 2025: 11 wickets. 2026: 25 wickets.
Backup: Mohammad Siraj (Budget: ₹9 Cr)

Eshan Malinga (Overseas fast bowler, Set 4) - Target: ₹3 Cr | Max: ₹4.5 Cr | Priority: High
Form: 2025 13 wickets; 2026 20 wickets at economy 9.33.
Alternative: Nandre Burger (Budget: ₹3 Cr). 2026: 14 wickets. 2025: FLAG.
Backup: Lungisani Ngidi (Budget: ₹3 Cr). 2026: 13 wickets at 8.23. 2025: FLAG.

Impact Bench – Additional Players:

Vaibhav Suryavanshi (Backup opener, Set 4) - Target: ₹5 Cr | Max: ₹8 Cr | Priority: High
Form: 2026 776 runs at SR 237.3, the 2026 Orange Cap winner. 2025: FLAG, not in the sources I read.
Alternative: Ayush Mhatre (Budget: ₹3 Cr). FLAG, no stats read.

Ryan Rickelton (Overseas WK-opener, Set 2) - Target: ₹3 Cr | Max: ₹4.5 Cr | Priority: High
Form: 2025 388 runs, SR 151.0; 2026 448 runs, SR 186.7.
Alternative: Finn Allen (Budget: ₹3 Cr). FLAG, no stats read.

Dhruv Jurel (WK-finisher, Set 1) - Target: ₹4 Cr | Max: ₹6 Cr | Priority: High
Form: 2026 515 runs, SR 154.7. 2025: FLAG.
Alternative: Jitesh Sharma (Budget: ₹2 Cr). FLAG, no stats read.

Harshit Rana (Indian fast bowler, Set 3) - Target: ₹3 Cr | Max: ₹4.5 Cr | Priority: High
Form: 2025 15 wickets. 2026: FLAG.
Alternative: Vaibhav Arora (Budget: ₹2 Cr)

R. Sai Kishore (Left-arm spinner, Set 3) - Target: ₹1.5 Cr | Max: ₹2.5 Cr | Priority: Medium
Form: 2025 19 wickets. 2026: FLAG.
Alternative: Digvesh Rathi (Budget: ₹1 Cr). 2025: 14 wickets. 2026: FLAG.

Vaibhav Arora (Indian fast bowler, Set 4) - Target: ₹1.2 Cr | Max: ₹2 Cr | Priority: Medium
Form: 2025 17 wickets at economy 10.11. 2026: FLAG.
Alternative: Kartik Tyagi (Budget: ₹1.5 Cr)

Jason Holder (Overseas seam all-rounder, AL2) - Target: ₹3.5 Cr | Max: ₹5 Cr | Priority: Medium
Form: 2026 17 wickets at economy 7.57. 2025: FLAG.
Alternative: Jamie Overton (Budget: ₹3 Cr). 2026: 14 wickets. 2025: FLAG.
`;
