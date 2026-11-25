import { CPE_LADDER, GEO_PRESETS, HEART_REGEN_MS, IAP_SKUS } from './config';
import { EconomyState, GeoPresetId, PostbackEvent } from '../engine/types';

const STORAGE_KEY = 'bolt_box_3d_economy_v1';

export function createInitialEconomy(): EconomyState {
  return {
    level: 1,
    coins: 220,
    hearts: 5,
    maxHearts: 5,
    lastHeartRegenTs: Date.now(),
    musicEnabled: true,
    sfxEnabled: true,
    hapticsEnabled: true,
    streak: 0,
    noAds: false,
    piggyBankCoins: 180,
    piggyBankMax: 500,
    seasonPassOwned: false,
    unlockedModels: ['cube'],
    dailyDay: 1,
    lastDailyClaimDate: null,
    raceActive: true,
    raceWins: 0,
    raceSurvivors: 100,
    geoPreset: 'us_ios',
    storeFeeRate: 0.15,
    sessionStartTs: Date.now(),
    rvWatched: 0,
    interstitialsShown: 0,
    iaaRevenueUsd: 0,
    grossIapUsd: 0,
    purchasedSkus: [],
    completedMilestones: [],
    postbacks: [],
    usedDebugJump: false
  };
}

export function syncHeartRegen(state: EconomyState, now = Date.now()): EconomyState {
  if (state.hearts >= state.maxHearts) {
    return state.lastHeartRegenTs === now ? state : { ...state, lastHeartRegenTs: now };
  }
  const elapsed = Math.max(0, now - (state.lastHeartRegenTs || now));
  const gained = Math.floor(elapsed / HEART_REGEN_MS);
  if (gained <= 0) return state;
  const nextHearts = Math.min(state.maxHearts, state.hearts + gained);
  return {
    ...state,
    hearts: nextHearts,
    lastHeartRegenTs: nextHearts >= state.maxHearts ? now : state.lastHeartRegenTs + gained * HEART_REGEN_MS
  };
}

export function loadEconomy(): EconomyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialEconomy();
    return syncHeartRegen({ ...createInitialEconomy(), ...JSON.parse(raw) });
  } catch {
    return createInitialEconomy();
  }
}

export function saveEconomy(state: EconomyState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function getNetIapUsd(state: EconomyState): number {
  return state.grossIapUsd * (1 - state.storeFeeRate);
}

export function getBlendedLtvUsd(state: EconomyState): number {
  return state.iaaRevenueUsd + getNetIapUsd(state);
}

export function getTotalCpePayoutUsd(state: EconomyState): number {
  return CPE_LADDER.reduce(
    (sum, m) => (state.completedMilestones.includes(m.id) ? sum + m.payoutUsd : sum),
    0
  );
}

export function evaluateMilestones(state: EconomyState): EconomyState {
  const nextCompleted = [...state.completedMilestones];
  const nextPostbacks = [...state.postbacks];
  const elapsedSec = Math.max(1, Math.floor((Date.now() - state.sessionStartTs) / 1000));
  const netLtv = getBlendedLtvUsd(state);

  for (const m of CPE_LADDER) {
    if (nextCompleted.includes(m.id)) continue;
    let reached = false;
    if (m.type === 'level' && state.level > m.targetValue) reached = true;
    if (m.type === 'iap_sku' && m.targetSkuId && state.purchasedSkus.includes(m.targetSkuId)) reached = true;
    if (m.type === 'iap_spend' && state.grossIapUsd >= m.targetValue) reached = true;

    if (reached) {
      nextCompleted.push(m.id);
      const isVelocityFlag = state.usedDebugJump || elapsedSec < m.minExpectedSeconds;
      const pb: PostbackEvent = {
        timestamp: new Date().toISOString().slice(11, 19),
        milestoneId: m.id,
        event_name: m.id,
        click_id: `fc_scr_${state.geoPreset}_8842a`,
        payout_usd: m.payoutUsd,
        cumulative_net_ltv_usd: Number(netLtv.toFixed(2)),
        elapsed_sec: elapsedSec,
        receipt_verified: m.type !== 'level',
        fraud_status: isVelocityFlag ? 'VELOCITY_FLAG' : 'PASS'
      };
      nextPostbacks.unshift(pb);
    }
  }

  return {
    ...state,
    completedMilestones: nextCompleted,
    postbacks: nextPostbacks.slice(0, 20)
  };
}

export function recordAdImpression(state: EconomyState, type: 'rv' | 'inter'): EconomyState {
  const geo = GEO_PRESETS[state.geoPreset];
  const rev = (type === 'rv' ? geo.rvEcpm : geo.interEcpm) / 1000;
  return {
    ...state,
    rvWatched: state.rvWatched + (type === 'rv' ? 1 : 0),
    interstitialsShown: state.interstitialsShown + (type === 'inter' ? 1 : 0),
    iaaRevenueUsd: state.iaaRevenueUsd + rev
  };
}

export function recordIapPurchase(state: EconomyState, skuId: string): EconomyState {
  const sku = IAP_SKUS.find((s) => s.id === skuId);
  if (!sku) return state;

  const bonusCoins = sku.isPiggyBank ? Math.max(sku.coins, state.piggyBankCoins) : sku.coins;
  const updated: EconomyState = {
    ...state,
    coins: state.coins + bonusCoins,
    noAds: state.noAds || Boolean(sku.removesInterstitials),
    piggyBankCoins: sku.isPiggyBank ? 0 : state.piggyBankCoins,
    seasonPassOwned: state.seasonPassOwned || sku.id === 'season_pass',
    grossIapUsd: state.grossIapUsd + sku.priceUsd,
    purchasedSkus: [...state.purchasedSkus, sku.id]
  };
  return evaluateMilestones(updated);
}

export function switchGeoPreset(state: EconomyState, geoPreset: GeoPresetId): EconomyState {
  return { ...state, geoPreset };
}
