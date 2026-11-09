import { Player } from '../types';

export interface ParsedTargetItem {
  id: string;
  rawTargetName: string;
  matchedPlayer: Player | null;
  targetMaxPrice: number; // in Crores
  priority: 'Must-Have' | 'High' | 'Backup';
  rawAlternativeName?: string;
  matchedAlternative?: Player | null;
  alternativeBudget?: number; // in Crores
  notes?: string;
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
    .replace(/\b(wk|wicket-keeper|wicketkeeper|bat|batsman|batter|ar|all-rounder|allrounder|bowl|bowler|fast bowler|spinner|overseas|os|ind|india)\b/gi, '')
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
      pTokens.some((pt) => pt === qt || (qt.length >= 3 && pt.startsWith(qt)) || (pt.length >= 3 && qt.startsWith(pt)))
    );

    const tokenRatio = matchedTokens.length / Math.max(qTokens.length, pTokens.length);
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Extract budget in Crores from a string
export const extractBudget = (str: string, defaultPrice: number = 5.0): number => {
  if (!str) return defaultPrice;

  // Check for Crores e.g. "₹ 18.5 Cr", "18 Cr", "18.5 crore", "18crores", "18.5cr"
  const crMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores|c\b)/i);
  if (crMatch && crMatch[1]) {
    const val = parseFloat(crMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Check for Lakhs e.g. "50 Lakhs", "50 L", "₹50L" -> convert to Cr
  const lMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i);
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

// Extract priority from text
export const extractPriority = (str: string): 'Must-Have' | 'High' | 'Backup' => {
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
          const rawName = item.name || item.player || item.target || item.targetPlayer || '';
          if (!rawName) continue;

          const match = findBestPlayerMatch(rawName, allPlayers);
          const rawBudgetStr = String(item.budget || item.targetMaxPrice || item.maxPrice || item.price || '');
          const defaultBenchmark = match.player
            ? match.player.previousSoldPrice || match.player.basePrice * 2.5 || 5.0
            : 5.0;
          const budget = extractBudget(rawBudgetStr, defaultBenchmark);

          const priorityStr = item.priority || '';
          const priority = extractPriority(priorityStr);

          const rawAltName = item.alternative || item.backup || item.alt || item.backupPlayer || '';
          const altMatch = rawAltName ? findBestPlayerMatch(rawAltName, allPlayers) : null;
          const altBudget = item.alternativeBudget || item.backupBudget
            ? extractBudget(String(item.alternativeBudget || item.backupBudget), budget * 0.7)
            : undefined;

          results.push({
            id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            rawTargetName: rawName,
            matchedPlayer: match.player,
            targetMaxPrice: budget,
            priority,
            rawAlternativeName: rawAltName || undefined,
            matchedAlternative: altMatch?.player || null,
            alternativeBudget: altBudget,
            notes: item.notes || (rawAltName ? `Alternative: ${rawAltName}` : undefined),
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

  // 2. Try parsing Markdown Table
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const tableRows = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (tableRows.length >= 2) {
    // Header row
    const headerCells = tableRows[0]
      .split('|')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    let playerColIdx = headerCells.findIndex((c) =>
      c.includes('player') || c.includes('target') || c.includes('name')
    );
    let budgetColIdx = headerCells.findIndex((c) =>
      c.includes('budget') || c.includes('price') || c.includes('max') || c.includes('cr') || c.includes('cost')
    );
    let priorityColIdx = headerCells.findIndex((c) =>
      c.includes('priority') || c.includes('tier')
    );
    let altColIdx = headerCells.findIndex((c) =>
      c.includes('alternative') || c.includes('backup') || c.includes('plan b') || c.includes('alt')
    );
    let altBudgetColIdx = headerCells.findIndex((c) =>
      (c.includes('alt') || c.includes('backup')) && (c.includes('budget') || c.includes('price'))
    );

    if (playerColIdx !== -1) {
      // Process data rows (skip separator row with ---)
      for (let i = 1; i < tableRows.length; i++) {
        const row = tableRows[i];
        if (row.includes('---')) continue;

        const cells = row
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx) => idx > 0 && idx <= headerCells.length); // discard outside bounds

        const rawName = cells[playerColIdx] || '';
        if (!rawName || rawName.toLowerCase() === 'player') continue;

        const match = findBestPlayerMatch(rawName, allPlayers);
        const rawBudgetStr = budgetColIdx !== -1 ? cells[budgetColIdx] : '';
        const defaultBenchmark = match.player
          ? match.player.previousSoldPrice || match.player.basePrice * 2.5 || 5.0
          : 5.0;
        const budget = extractBudget(rawBudgetStr, defaultBenchmark);

        const priorityStr = priorityColIdx !== -1 ? cells[priorityColIdx] : '';
        const priority = extractPriority(priorityStr);

        const rawAltName = altColIdx !== -1 ? cells[altColIdx] : '';
        const altMatch = rawAltName ? findBestPlayerMatch(rawAltName, allPlayers) : null;

        const rawAltBudgetStr = altBudgetColIdx !== -1 ? cells[altBudgetColIdx] : '';
        const altBudget = rawAltBudgetStr
          ? extractBudget(rawAltBudgetStr, budget * 0.7)
          : undefined;

        results.push({
          id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          rawTargetName: rawName,
          matchedPlayer: match.player,
          targetMaxPrice: budget,
          priority,
          rawAlternativeName: rawAltName || undefined,
          matchedAlternative: altMatch?.player || null,
          alternativeBudget: altBudget,
          notes: rawAltName ? `Alternative: ${rawAltName}` : undefined,
          confidence: match.confidence,
          selected: match.player !== null,
        });
      }

      if (results.length > 0) return results;
    }
  }

  // 3. Line-by-line Bulleted / Numbered / Freeform parsing
  // Handle indented sub-bullets for alternatives
  let currentTarget: ParsedTargetItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check if line indicates an alternative / backup
    const isAltLine =
      /^(?:[-*•]|\d+\.)?\s*(?:alternative|backup|alt|plan b|fallback|if missed|or)\s*[:\-–]/i.test(line) ||
      rawLine.startsWith('   ') ||
      rawLine.startsWith('\t');

    if (isAltLine && currentTarget) {
      // Extract alternative from this sub-bullet
      const altContent = line.replace(/^(?:[-*•]|\d+\.)?\s*(?:alternative|backup|alt|plan b|fallback|if missed|or)\s*[:\-–]?\s*/i, '');
      const altMatch = findBestPlayerMatch(altContent, allPlayers);
      const altBudget = extractBudget(altContent, currentTarget.targetMaxPrice * 0.75);

      currentTarget.rawAlternativeName = altContent;
      currentTarget.matchedAlternative = altMatch.player;
      currentTarget.alternativeBudget = altBudget;
      currentTarget.notes = `Alternative: ${altMatch.player?.name || altContent} (₹${altBudget.toFixed(2)} Cr)`;
      continue;
    }

    // Try matching player on this line
    // Strip bullet markers: "1. ", "- ", "* ", "• ", "# "
    const cleanedLine = line.replace(/^(?:[-*•#>]|\d+[.)])\s*/, '').trim();
    if (!cleanedLine) continue;

    // Split target player vs inline alternative: e.g. "Rishabh Pant (18 Cr) | Alternative: Ishan Kishan (12 Cr)"
    const altSplit = cleanedLine.split(/(?:\||\b(?:alternative|backup|alt|plan b|fallback|if missed)\s*[:\-–])/i);
    const mainTargetPart = altSplit[0].trim();
    const inlineAltPart = altSplit.length > 1 ? altSplit[1].trim() : '';

    // Match player in mainTargetPart
    const match = findBestPlayerMatch(mainTargetPart, allPlayers);

    // If player matched with good confidence (>= 0.6)
    if (match.player && match.confidence >= 0.6) {
      const defaultBenchmark =
        match.player.previousSoldPrice || match.player.basePrice * 2.5 || 5.0;
      const budget = extractBudget(mainTargetPart, defaultBenchmark);
      const priority = extractPriority(mainTargetPart);

      let matchedAlt: Player | null = null;
      let altBudget: number | undefined = undefined;

      if (inlineAltPart) {
        const altMatch = findBestPlayerMatch(inlineAltPart, allPlayers);
        matchedAlt = altMatch.player;
        altBudget = extractBudget(inlineAltPart, budget * 0.75);
      }

      currentTarget = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        rawTargetName: match.player.name,
        matchedPlayer: match.player,
        targetMaxPrice: budget,
        priority,
        rawAlternativeName: inlineAltPart || undefined,
        matchedAlternative: matchedAlt,
        alternativeBudget: altBudget,
        notes: matchedAlt ? `Alternative: ${matchedAlt.name}` : undefined,
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

// Preset sample plan for testing / demonstration
export const SAMPLE_CHATGPT_PLAN = `# IPL AUCTION STRATEGY PLAN (Sample AI Output)

## Core Target Players & Budget Allocation:

1. **Rishabh Pant** (WK) - Target: ₹18.0 Cr | Priority: Must-Have
   - Alternative: Ishan Kishan (Budget: ₹12.0 Cr)
2. **Arshdeep Singh** (Bowler) - Target: ₹14.5 Cr | Priority: Must-Have
   - Backup: Bhuvneshwar Kumar (Budget: ₹8.0 Cr)
3. **Liam Livingstone** (All-Rounder) - Target: ₹10.0 Cr | Priority: High
   - Alternative: Marcus Stoinis (Budget: ₹8.5 Cr)
4. **Trent Boult** (Fast Bowler) - Target: ₹9.5 Cr | Priority: High
   - Backup: Akash Deep (Budget: ₹5.5 Cr)
5. **Devon Conway** (Batsman) - Target: ₹7.0 Cr | Priority: High
   - Alternative: Aiden Markram (Budget: ₹5.0 Cr)
6. **Sam Curran** (All-Rounder) - Target: ₹8.5 Cr | Priority: High
   - Backup: Mitchell Marsh (Budget: ₹6.0 Cr)
7. **Rahul Chahar** (Spinner) - Target: ₹4.5 Cr | Priority: Backup
   - Alternative: Mayank Markande (Budget: ₹3.0 Cr)
`;
