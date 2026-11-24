import { CPE_LADDER, GEO_PRESETS } from './config';
import { GeoPresetId } from '../engine/types';

export interface CohortSimResult {
  users: number;
  avgCpePayout: number;
  avgIaaLtv: number;
  avgNetIapLtv: number;
  avgBlendedLtv: number;
  iaaSharePct: number;
  d30RoasPct: number;
  d90RoasPct: number;
  netProfitPerUser: number;
  starterBuyerPct: number;
  whalePct: number;
}

// 1,000-user Monte Carlo stress-tester for Freecash / Scrambly CPE offerwall cohorts
export function runCpeMonteCarlo(
  geoId: GeoPresetId,
  storeFeeRate: 0.15 | 0.3,
  users = 1000
): CohortSimResult {
  const geo = GEO_PRESETS[geoId];
  let seed = 421337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  let sumPayout = 0;
  let sumIaa = 0;
  let sumNetIap = 0;
  let sumD30Ltv = 0;
  let starterBuyers = 0;
  let whales = 0;

  // Geo multiplier on IAP conversion relative to US iOS
  const iapMult = geoId === 'us_ios' ? 1.0 : geoId === 'jp_ios' ? 0.92 : geoId === 'us_android' ? 0.78 : 0.68;

  for (let i = 0; i < users; i++) {
    // User archetype: 42% early churn, 34% ad-grinder, 19% cashback starter buyer, 5% whale/deep grinder
    const r = rand();
    let maxLevel = 0;
    let boughtStarter = false;
    let grossIap = 0;
    let rvCount = 0;
    let interCount = 0;

    if (r < 0.42) {
      // Early churn before L50
      maxLevel = Math.floor(3 + rand() * 32);
      rvCount = Math.floor(maxLevel * 0.45);
      interCount = Math.max(0, maxLevel - 5);
    } else if (r < 0.76) {
      // Ad-grinder (pushes L50–L220 for rewards)
      maxLevel = Math.floor(55 + rand() * 175);
      rvCount = Math.floor(maxLevel * 0.95);
      interCount = Math.max(0, maxLevel - 5);
      if (rand() < 0.14 * iapMult) {
        boughtStarter = true;
        grossIap += 4.99;
        interCount = Math.min(interCount, 12);
      }
    } else if (r < 0.95) {
      // Offerwall Cashback Converter (buys $4.99 Starter + Piggy/Pass, reaches L150–L420)
      maxLevel = Math.floor(140 + rand() * 290);
      boughtStarter = rand() < 0.85 * iapMult;
      if (boughtStarter) grossIap += 4.99;
      if (rand() < 0.55 * iapMult) grossIap += 2.99;
      if (rand() < 0.35 * iapMult) grossIap += 9.99;
      if (rand() < 0.25 * iapMult) grossIap += 19.99;
      rvCount = Math.floor(maxLevel * 0.78);
      interCount = boughtStarter ? 6 : Math.max(0, maxLevel - 5);
    } else {
      // Deep Grinder / Whale (reaches L380–L760, buys $20–$90 IAP)
      whales++;
      maxLevel = Math.floor(360 + rand() * 410);
      boughtStarter = true;
      grossIap = 4.99 + 9.99 + 19.99 + (rand() < 0.5 ? 49.99 : 9.99) * iapMult;
      rvCount = Math.floor(maxLevel * 0.65);
      interCount = 4;
    }

    if (boughtStarter) starterBuyers++;

    const iaa = (rvCount * geo.rvEcpm + interCount * geo.interEcpm) / 1000;
    const netIap = grossIap * (1 - storeFeeRate);
    const totalLtv = iaa + netIap;
    // Hybrid IAA-led generates ~80% of D90 LTV by D30
    const d30Ltv = iaa * 0.86 + netIap * 0.72;

    // Evaluate CPE payout
    let payout = 0;
    for (const m of CPE_LADDER) {
      if (m.type === 'level' && maxLevel >= m.targetValue) payout += m.payoutUsd;
      if (m.type === 'iap_sku' && m.targetSkuId === 'starter_no_ads' && boughtStarter) payout += m.payoutUsd;
      if (m.type === 'iap_spend' && grossIap >= m.targetValue) payout += m.payoutUsd;
    }

    sumPayout += payout;
    sumIaa += iaa;
    sumNetIap += netIap;
    sumD30Ltv += d30Ltv;
  }

  const avgCpePayout = sumPayout / users;
  const avgIaaLtv = sumIaa / users;
  const avgNetIapLtv = sumNetIap / users;
  const avgBlendedLtv = avgIaaLtv + avgNetIapLtv;
  const effectiveSpend = Math.max(0.5, avgCpePayout);

  return {
    users,
    avgCpePayout,
    avgIaaLtv,
    avgNetIapLtv,
    avgBlendedLtv,
    iaaSharePct: avgBlendedLtv > 0 ? (avgIaaLtv / avgBlendedLtv) * 100 : 0,
    d30RoasPct: (sumD30Ltv / users / effectiveSpend) * 100,
    d90RoasPct: (avgBlendedLtv / effectiveSpend) * 100,
    netProfitPerUser: avgBlendedLtv - avgCpePayout,
    starterBuyerPct: (starterBuyers / users) * 100,
    whalePct: (whales / users) * 100
  };
}
