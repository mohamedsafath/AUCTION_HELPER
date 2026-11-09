# IPL Auction Helper & 25-Player Squad Builder 🏏

A modern, fast, and feature-rich IPL auction helper web application built with React, TypeScript, Tailwind CSS, and Vite.

## ✨ Key Features

- **25 Squad Spots**:
  - **Starting Playing XI (Slots 1–11)**: Opener to specialist spinner.
  - **Tactical Impact Player (Slot 12)**: Dedicated impact sub spot.
  - **Core Bench & Reserves (Slots 13–25)**: Complete 25-player roster.
- **Official IPL Squad Regulations**:
  - **Min 18 to Max 25 Players**: Mandatory minimum reserve calculations prevent running out of budget before hitting 18 players.
  - **Dual Overseas Quota**: Enforces **$\le 4$ Overseas in Playing XI** and **$\le 8$ Overseas in Total Squad**.
  - **Wicketkeeper Verification**: Ensures at least 1 primary keeper is drafted in the starting XI.
- **Exclusive Drag & Drop**:
  - Move players between Playing XI, Impact, and Bench with drag-and-drop or 1-click swap.
  - Ensures a player exists in only one slot exclusively (no duplicates).
- **Official 522 Master Player Dataset**:
  - Sourced directly from `ipl_auction_master_dataset_updated.csv`.
  - Roles categorized: Wicket-Keepers (57), Batsmen (86), All-Rounders (180), and Bowlers (199).
  - Filterable by Marquee Set (`Marquee Set 1`, `Set 1-4`, `WK1`, `FA1`, `AL1`, `SP1`, etc.) and Nationality (🇮🇳 / ✈️).
- **Smart Next-Alternative Suggestions**:
  - When a target player is lost to a rival team, the system automatically suggests the top 5 available alternatives in the same role that fit your remaining purse and overseas quota.
- **Winning Bid Modal**:
  - Prompts winning bid amount, tracks variance against planned target budget, and shows live purse impact.
- **Official PDF Roster Export**:
  - 1-click download of a publication-ready PDF squad report with budget metrics, player details, and compliance audit.

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/mohamedsafath/AUCTION_HELPER.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
