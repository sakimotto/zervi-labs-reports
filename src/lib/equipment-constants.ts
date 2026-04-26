// Equipment domain constants
export const EQUIPMENT_CATEGORIES = [
  'Tensile',
  'Abrasion',
  'Pilling',
  'Colorfastness',
  'Permeability',
  'Hydrostatic',
  'Conditioning',
  'Optical/Color',
  'Mass/Dimension',
  'Safety',
  'General',
] as const;

// Suggested sub-types per category — free text but shown as suggestions
export const EQUIPMENT_SUBTYPES: Record<string, string[]> = {
  Tensile: ['Universal Testing Machine', 'Tear Tester (Elmendorf)', 'Burst Tester', 'Seam Slippage'],
  Abrasion: ['Martindale', 'Taber', 'Wyzenbeek'],
  Pilling: ['Martindale Pilling', 'ICI Pillbox', 'Random Tumble'],
  Colorfastness: ['Crockmeter', 'Perspirometer', 'Launder-Ometer', 'Xenon Arc Weatherometer', 'QUV'],
  Permeability: ['Air Permeability Tester', 'Water Vapor Transmission'],
  Hydrostatic: ['Hydrostatic Head Tester', 'Spray Rating Tester', 'Bundesmann'],
  Conditioning: ['Standard Atmosphere Chamber', 'Drying Oven', 'Climatic Chamber'],
  'Optical/Color': ['Spectrophotometer', 'Light Box (D65/TL84/A)', 'Glossmeter', 'Whiteness Meter'],
  'Mass/Dimension': ['Analytical Balance', 'GSM Cutter', 'Thickness Gauge', 'Yarn Count Reel'],
  Safety: ['Vertical Flame Tester (FMVSS 302)', '45° Flame Tester', 'LOI Tester'],
  General: ['Microscope', 'Magnifier', 'Stopwatch'],
};

export const EQUIPMENT_STATUSES = ['Active', 'Out of Service', 'Retired', 'Quarantine'] as const;
export const CAL_STATUSES = ['In Cal', 'Due Soon', 'Out of Cal'] as const;
export const MAINTENANCE_TYPES = ['Preventive', 'Corrective', 'Emergency', 'Inspection'] as const;
export const TRACEABILITY_OPTIONS = ['NIST', 'JCSS (Japan)', 'UKAS', 'DAkkS', 'NMIA', 'PTB', 'NIM (China)', 'KRISS', 'Internal Reference'] as const;

export type EquipmentCalStatus = typeof CAL_STATUSES[number];

// Returns derived calibration status from next due date
export function deriveCalStatus(nextDue: string | null | undefined): EquipmentCalStatus | null {
  if (!nextDue) return null;
  const due = new Date(nextDue);
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'Out of Cal';
  if (diffDays <= 30) return 'Due Soon';
  return 'In Cal';
}
