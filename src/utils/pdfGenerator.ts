import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Slot, AuctionSettings } from '../types';

export const generateTeamPDF = (
  teamName: string,
  settings: AuctionSettings,
  slots: Slot[],
  spentPurse: number,
  remainingPurse: number
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  const xiSlots = slots.filter((s) => s.category === 'xi');
  const impactSlots = slots.filter((s) => s.category === 'impact');
  const benchSlots = slots.filter((s) => s.category === 'bench');

  const boughtPlayers = slots.filter((s) => s.player !== null);
  const xiBought = xiSlots.filter((s) => s.player !== null);
  const xiOverseas = xiBought.filter((s) => s.player?.isOverseas).length;
  const totalOverseas = boughtPlayers.filter((s) => s.player?.isOverseas).length;
  const wkBought = xiBought.filter((s) => s.player?.role === 'WK').length;

  // Header background banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Gold accent bar
  doc.setFillColor(234, 179, 8); // amber-500
  doc.rect(0, 39, pageWidth, 2, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(teamName.toUpperCase() + ' - SQUAD ROSTER', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Official IPL 25-Player Squad Report • Playing XI + Impact + Bench • Generated: ${dateStr}`, 14, 27);

  // Summary Metrics Cards (5 cards across page)
  const cardY = 46;
  const cardGap = 3;
  const cardWidth = (pageWidth - 28 - cardGap * 4) / 5;
  const cardHeight = 18;

  const metrics = [
    { label: 'PURSE SPENT', value: `₹${spentPurse.toFixed(2)} Cr`, color: [180, 83, 9] },
    { label: 'REMAINING PURSE', value: `₹${remainingPurse.toFixed(2)} Cr`, color: [22, 101, 52] },
    { label: 'XI OVERSEAS', value: `${xiOverseas}/4 ${xiOverseas > 4 ? '⚠️' : '✓'}`, color: xiOverseas > 4 ? [225, 29, 72] : [30, 41, 59] },
    { label: 'SQUAD OVERSEAS', value: `${totalOverseas}/8 ${totalOverseas > 8 ? '⚠️' : '✓'}`, color: totalOverseas > 8 ? [225, 29, 72] : [30, 41, 59] },
    { label: 'TOTAL SQUAD', value: `${boughtPlayers.length}/25`, color: [30, 41, 59] },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Accent line
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.rect(x, cardY, cardWidth, 1.5, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, cardY + 7);

    // Value
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, x + 3, cardY + 14);
  });

  // Function to build table data
  const mapSlotToRow = (slot: Slot) => {
    if (!slot.player) {
      return [
        slot.id.toString(),
        slot.slotLabel,
        '-- Empty Spot --',
        slot.suggestedRole,
        '--',
        '--',
        '₹0.00 Cr',
        'Vacant',
      ];
    }
    const p = slot.player;
    return [
      slot.id.toString(),
      slot.slotLabel,
      `${p.id} - ${p.name}`,
      p.role,
      p.marqueeSet || '-',
      p.isOverseas ? 'Overseas (✈️)' : 'Indian (🇮🇳)',
      `₹${(slot.soldPrice || 0).toFixed(2)} Cr`,
      p.previousSoldPrice ? `₹${p.previousSoldPrice.toFixed(2)} Cr` : (p.basePrice ? `₹${p.basePrice.toFixed(2)} Cr` : '-'),
    ];
  };

  // Section 1: Playing XI Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. STARTING PLAYING XI (MAX 4 OVERSEAS)', 14, 71);

  autoTable(doc, {
    startY: 74,
    head: [['#', 'Position', 'Player Name', 'Role', 'Set', 'Origin', 'Winning Bid', 'Benchmark']],
    body: xiSlots.map(mapSlotToRow),
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32 },
      2: { fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22, fontStyle: 'bold', halign: 'right', textColor: [22, 101, 52] },
      7: { cellWidth: 22, halign: 'right', textColor: [100, 116, 139] },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.raw && (data.row.raw as string[])[2] === '-- Empty Spot --') {
        data.cell.styles.textColor = [156, 163, 175];
        data.cell.styles.fontStyle = 'italic';
      }
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // Section 2: Impact Player
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TACTICAL IMPACT PLAYER SPOT', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Position', 'Player Name', 'Role', 'Set', 'Origin', 'Winning Bid', 'Benchmark']],
    body: impactSlots.map(mapSlotToRow),
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6], // amber-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32 },
      2: { fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22, fontStyle: 'bold', halign: 'right', textColor: [22, 101, 52] },
      7: { cellWidth: 22, halign: 'right', textColor: [100, 116, 139] },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.raw && (data.row.raw as string[])[2] === '-- Empty Spot --') {
        data.cell.styles.textColor = [156, 163, 175];
        data.cell.styles.fontStyle = 'italic';
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Section 3: Bench & Reserves (13 spots)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. BENCH & SQUAD RESERVES (SLOTS 13 - 25)', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Position', 'Player Name', 'Role', 'Set', 'Origin', 'Winning Bid', 'Benchmark']],
    body: benchSlots.map(mapSlotToRow),
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32 },
      2: { fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22, fontStyle: 'bold', halign: 'right', textColor: [22, 101, 52] },
      7: { cellWidth: 22, halign: 'right', textColor: [100, 116, 139] },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.raw && (data.row.raw as string[])[2] === '-- Empty Spot --') {
        data.cell.styles.textColor = [156, 163, 175];
        data.cell.styles.fontStyle = 'italic';
      }
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY;

  // If table went into page 2 or near bottom, check remaining space
  let complianceY = finalTableY + 5;
  if (complianceY > 260) {
    doc.addPage();
    complianceY = 20;
  }

  // Compliance & Rules Summary Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, complianceY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL IPL SQUAD & OVERSEAS COMPLIANCE AUDIT:', 20, complianceY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const xiOsStatus = xiOverseas <= 4 ? `✓ Playing XI Overseas: ${xiOverseas}/4 (Within Limit)` : `⚠️ VIOLATION: ${xiOverseas}/4 in XI (Max 4 allowed)`;
  const squadOsStatus = totalOverseas <= 8 ? `✓ Total Squad Overseas: ${totalOverseas}/8 (Within Limit)` : `⚠️ VIOLATION: ${totalOverseas}/8 in Squad (Max 8 allowed)`;
  const wkStatus = wkBought >= 1 ? `✓ Wicketkeeper: ${wkBought} Primary WK in XI` : `⚠️ WARNING: No Primary WK in XI`;
  
  const isMinMet = boughtPlayers.length >= 18;
  const squadSizeStatus = isMinMet
    ? `✓ Official Squad Size: ${boughtPlayers.length}/25 (Min 18 Met • ${25 - boughtPlayers.length} Open)`
    : `⚠️ DEFICIT: Only ${boughtPlayers.length}/18 Players (Need ${18 - boughtPlayers.length} for IPL Minimum)`;

  doc.text(`• ${xiOsStatus}`, 20, complianceY + 12);
  doc.text(`• ${squadOsStatus}`, 20, complianceY + 17);
  doc.text(`• ${wkStatus}`, 115, complianceY + 12);
  doc.text(`• ${squadSizeStatus}`, 115, complianceY + 17);

  // Save PDF
  const filename = `${teamName.toLowerCase().replace(/\s+/g, '_')}_25_squad_report.pdf`;
  doc.save(filename);
};
