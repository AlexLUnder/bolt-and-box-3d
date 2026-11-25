import { BoltColor, CpeMilestone, GeoPreset, GeoPresetId, IapSku } from '../engine/types';

export const BOLT_COLORS: Record<BoltColor, { hex: string; light: string; label: string; symbol: string }> = {
  red: { hex: '#ef4444', light: '#fca5a5', label: 'Red', symbol: '●' },
  blue: { hex: '#3b82f6', light: '#93c5fd', label: 'Blue', symbol: '▲' },
  green: { hex: '#22c55e', light: '#86efac', label: 'Green', symbol: '■' },
  yellow: { hex: '#eab308', light: '#fef08a', label: 'Yellow', symbol: '★' },
  purple: { hex: '#a855f7', light: '#d8b4fe', label: 'Purple', symbol: '◆' },
  orange: { hex: '#f97316', light: '#fdba74', label: 'Orange', symbol: '✚' },
  cyan: { hex: '#06b6d4', light: '#67e8f9', label: 'Cyan', symbol: '⬟' }
};

export const HEART_REGEN_MS = 20 * 60 * 1000; // +1 Heart every 20 minutes

export const GEO_PRESETS: Record<GeoPresetId, GeoPreset> = {
  us_ios: {
    id: 'us_ios',
    label: 'US iOS (Tier-0 Profit)',
    targetCpi: 7.19,
    rvEcpm: 38.0,
    interEcpm: 18.0,
    benchmarkD30Roas: 1.38,
    benchmarkD90Roas: 1.75
  },
  us_android: {
    id: 'us_android',
    label: 'US Android (Scale)',
    targetCpi: 5.5,
    rvEcpm: 25.0,
    interEcpm: 11.5,
    benchmarkD30Roas: 1.05,
    benchmarkD90Roas: 1.32
  },
  gb_android: {
    id: 'gb_android',
    label: 'GB Android (Fast PB)',
    targetCpi: 3.41,
    rvEcpm: 19.0,
    interEcpm: 9.0,
    benchmarkD30Roas: 1.12,
    benchmarkD90Roas: 1.48
  },
  jp_ios: {
    id: 'jp_ios',
    label: 'JP iOS (B2B Arbitrage)',
    targetCpi: 4.52,
    rvEcpm: 28.0,
    interEcpm: 13.0,
    benchmarkD30Roas: 1.18,
    benchmarkD90Roas: 1.59
  }
};

export const IAP_SKUS: IapSku[] = [
  {
    id: 'starter_no_ads',
    name: 'No-Ads Starter Bundle',
    subtitle: 'Removes forced ads (keeps RVs) + 600 Coins',
    priceUsd: 4.99,
    coins: 600,
    removesInterstitials: true,
    featured: true
  },
  {
    id: 'piggy_bank',
    name: 'Piggy Bank Smash',
    subtitle: 'Claim all banked bonus coins',
    priceUsd: 2.99,
    coins: 500,
    isPiggyBank: true
  },
  {
    id: 'season_pass',
    name: 'Bolt Pass (Season)',
    subtitle: '1,200 Coins + Streak Shield + VIP Badge',
    priceUsd: 9.99,
    coins: 1200
  },
  {
    id: 'coin_pack_sm',
    name: 'Pouch of Coins',
    subtitle: '250 Coins for boosters & revives',
    priceUsd: 1.99,
    coins: 250
  },
  {
    id: 'coin_pack_lg',
    name: 'Pro Toolbox Vault',
    subtitle: '3,000 Coins (Best Offerwall Cashback)',
    priceUsd: 19.99,
    coins: 3000
  },
  {
    id: 'coin_pack_whale',
    name: 'Master Engineer Chest',
    subtitle: '9,000 Coins for deep LiveOps races',
    priceUsd: 49.99,
    coins: 9000
  }
];

export const CPE_LADDER: CpeMilestone[] = [
  {
    id: 'cpe_l10',
    label: 'Complete Level 10',
    type: 'level',
    targetValue: 10,
    payoutUsd: 0.25,
    timeCapDays: 1,
    minExpectedSeconds: 180
  },
  {
    id: 'cpe_starter_iap',
    label: 'Buy No-Ads Starter ($4.99)',
    type: 'iap_sku',
    targetValue: 4.99,
    targetSkuId: 'starter_no_ads',
    payoutUsd: 4.0,
    timeCapDays: 7,
    minExpectedSeconds: 30
  },
  {
    id: 'cpe_l50',
    label: 'Reach Level 50',
    type: 'level',
    targetValue: 50,
    payoutUsd: 1.0,
    timeCapDays: 3,
    minExpectedSeconds: 1500
  },
  {
    id: 'cpe_l150',
    label: 'Reach Level 150',
    type: 'level',
    targetValue: 150,
    payoutUsd: 3.0,
    timeCapDays: 10,
    minExpectedSeconds: 5400
  },
  {
    id: 'cpe_spend_20',
    label: 'Spend $19.99+ Cumulative IAP',
    type: 'iap_spend',
    targetValue: 19.99,
    payoutUsd: 14.0,
    timeCapDays: 30,
    minExpectedSeconds: 60
  },
  {
    id: 'cpe_l350',
    label: 'Reach Level 350',
    type: 'level',
    targetValue: 350,
    payoutUsd: 7.0,
    timeCapDays: 21,
    minExpectedSeconds: 14400
  },
  {
    id: 'cpe_l700',
    label: 'Reach Level 700',
    type: 'level',
    targetValue: 700,
    payoutUsd: 18.0,
    timeCapDays: 30,
    minExpectedSeconds: 36000
  }
];

export const BOOSTER_COSTS = {
  extraSlot: 80,
  magnet: 120,
  clearTray: 150,
  extraBox: 100,
  revive: 100,
  refillHearts: 100
};
