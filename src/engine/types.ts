export type BoltColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'cyan';

export type FaceId = 'front' | 'back' | 'left' | 'right';

export interface PlateData {
  id: string;
  face: FaceId;
  layer: number; // 0 = deepest (against chassis), 1 = middle, 2 = outer
  u: number;
  v: number;
  w: number;
  h: number;
  tint: string;
  boltIds: string[];
  dropped: boolean;
}

export interface BoltData {
  id: string;
  plateId: string;
  face: FaceId;
  layer: number;
  u: number;
  v: number;
  color: BoltColor;
  removed: boolean;
}

export type DifficultyTag = 'normal' | 'hard' | 'superhard';

export type ChassisShape =
  | 'cube'
  | 'house'
  | 'rocket'
  | 'arcade'
  | 'robot'
  | 'pyramid'
  | 'tower'
  | 'chest'
  | 'castle'
  | 'vault';

export interface LevelConfig {
  level: number;
  title: string;
  shape: ChassisShape;
  difficulty: DifficultyTag;
  plates: PlateData[];
  bolts: BoltData[];
  boxQueue: BoltColor[];
  coinReward: number;
}

export interface CollectorBox {
  id: string;
  color: BoltColor;
  filled: number; // 0..3
}

export type GeoPresetId = 'us_ios' | 'us_android' | 'gb_android' | 'jp_ios';

export interface GeoPreset {
  id: GeoPresetId;
  label: string;
  targetCpi: number;
  rvEcpm: number;
  interEcpm: number;
  benchmarkD30Roas: number;
  benchmarkD90Roas: number;
}

export interface IapSku {
  id: string;
  name: string;
  subtitle: string;
  priceUsd: number;
  coins: number;
  removesInterstitials?: boolean;
  boosters?: number;
  featured?: boolean;
  isPiggyBank?: boolean;
}

export interface CpeMilestone {
  id: string;
  label: string;
  type: 'level' | 'iap_sku' | 'iap_spend';
  targetValue: number;
  targetSkuId?: string;
  payoutUsd: number;
  timeCapDays: number;
  minExpectedSeconds: number;
}

export interface PostbackEvent {
  timestamp: string;
  milestoneId: string;
  event_name: string;
  click_id: string;
  payout_usd: number;
  cumulative_net_ltv_usd: number;
  elapsed_sec: number;
  receipt_verified: boolean;
  fraud_status: 'PASS' | 'VELOCITY_FLAG';
}

export interface EconomyState {
  level: number;
  coins: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  noAds: boolean;
  piggyBankCoins: number;
  piggyBankMax: number;
  seasonPassOwned: boolean;
  geoPreset: GeoPresetId;
  storeFeeRate: 0.15 | 0.3;
  sessionStartTs: number;
  rvWatched: number;
  interstitialsShown: number;
  iaaRevenueUsd: number;
  grossIapUsd: number;
  purchasedSkus: string[];
  completedMilestones: string[];
  postbacks: PostbackEvent[];
  usedDebugJump: boolean;
}
