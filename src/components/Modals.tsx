import { useEffect, useState } from 'react';
import { Clock, Flame, Music, Smartphone, Volume2, X } from 'lucide-react';
import { BOOSTER_COSTS, GEO_PRESETS, HEART_REGEN_MS, IAP_SKUS } from '../economy/config';
import { HANDCRAFTED_LEVELS } from '../engine/levelGenerator';
import { EconomyState } from '../engine/types';
import {
  AdBadgeIcon,
  GlossyHeartIcon,
  GoldCoinIcon,
  NoAdsMedallionIcon,
  PiggyMedallionIcon,
  StreakFlameIcon
} from './GameIcons';

export interface ActiveAdModal {
  type: 'rv' | 'inter';
  placement: string;
  onComplete: () => void;
}

export function MockAdOverlay({
  ad,
  geoId
}: {
  ad: ActiveAdModal;
  geoId: EconomyState['geoPreset'];
}) {
  const [secs, setSecs] = useState(ad.type === 'rv' ? 3 : 2);
  const geo = GEO_PRESETS[geoId];
  const ecpm = ad.type === 'rv' ? geo.rvEcpm : geo.interEcpm;

  useEffect(() => {
    if (secs <= 0) {
      const t = setTimeout(ad.onComplete, 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, ad]);

  return (
    <div className="modal-backdrop" style={{ zIndex: 70 }}>
      <div className="modal-card" style={{ textAlign: 'center', borderColor: '#22c55e' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#86efac', textTransform: 'uppercase' }}>
          Simulated {ad.type === 'rv' ? 'Rewarded Video' : 'Interstitial'} · {geo.label}
        </div>
        <div className="modal-title">{ad.placement}</div>
        <div className="modal-sub">
          Mock AppLovin MAX / LevelPlay impression.
          <br />
          eCPM: <b>${ecpm.toFixed(2)}</b> (+${(ecpm / 1000).toFixed(4)} IAA)
        </div>
        <div
          style={{
            margin: '8px auto',
            width: 58,
            height: 58,
            borderRadius: '50%',
            border: '3px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 900
          }}
        >
          {secs > 0 ? secs : '✓'}
        </div>
      </div>
    </div>
  );
}

function VictoryStar({ size = 42, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className="victory-star"
      style={{ animationDelay: `${delay}ms` }}
    >
      <defs>
        <linearGradient id="vStarG" x1="24" y1="3" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M24 4L29.9 16.2L43.2 18.1L33.5 27.5L35.8 40.8L24 34.5L12.2 40.8L14.5 27.5L4.8 18.1L18.1 16.2L24 4Z"
        fill="url(#vStarG)"
        stroke="#92400e"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M24 8.5L27.2 15.5L21 18L16.5 16L24 8.5Z"
        fill="#ffffff"
        opacity="0.5"
      />
    </svg>
  );
}

export function WinModal({
  level,
  coinReward,
  streak,
  raceWins,
  piggyCoins,
  piggyMax,
  onNextLevel,
  onDoubleCoinsRv,
  onOpenShop
}: {
  level: number;
  coinReward: number;
  streak: number;
  raceWins: number;
  piggyCoins: number;
  piggyMax: number;
  onNextLevel: () => void;
  onDoubleCoinsRv: () => void;
  onOpenShop: () => void;
}) {
  const piggyPct = Math.min(100, Math.round((piggyCoins / piggyMax) * 100));

  return (
    <div className="modal-backdrop">
      <div className="victory-card">
        {/* Sunburst Glow + 3 Animated 3D Stars */}
        <div className="victory-stars-row">
          <div style={{ transform: 'rotate(-14deg) translateY(8px)' }}>
            <VictoryStar size={44} delay={60} />
          </div>
          <div style={{ transform: 'translateY(-4px)' }}>
            <VictoryStar size={58} delay={180} />
          </div>
          <div style={{ transform: 'rotate(14deg) translateY(8px)' }}>
            <VictoryStar size={44} delay={300} />
          </div>
        </div>

        {/* Glossy Ribbon Banner */}
        <div className="victory-ribbon">
          <span>LEVEL {level} CLEARED!</span>
        </div>

        {/* Reward Summary Strip */}
        <div className="victory-rewards-row">
          <div className="reward-pill-box">
            <GoldCoinIcon size={28} />
            <div className="reward-pill-info">
              <span className="reward-big">+{coinReward}</span>
              <span className="reward-lbl">Coins</span>
            </div>
          </div>

          <div className="reward-pill-box streak-box">
            <StreakFlameIcon size={28} />
            <div className="reward-pill-info">
              <span className="reward-big">{streak}</span>
              <span className="reward-lbl">Rush {Math.min(7, raceWins)}/7</span>
            </div>
          </div>
        </div>

        {/* Piggy Bank Progress Card */}
        <div className="victory-piggy-card">
          <PiggyMedallionIcon size={36} />
          <div className="victory-piggy-mid">
            <div className="victory-piggy-top">
              <span>Piggy Bank</span>
              <span>
                {piggyCoins}/{piggyMax}
              </span>
            </div>
            <div className="quick-bar">
              <div className="quick-bar-fill" style={{ width: `${piggyPct}%` }} />
            </div>
          </div>
          {piggyCoins >= piggyMax && (
            <button className="candy-buy-btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onOpenShop}>
              $2.99
            </button>
          )}
        </div>

        {/* Candy-Glossy CTAs */}
        <div className="victory-actions">
          <button className="candy-gold-btn" onClick={onDoubleCoinsRv}>
            <span className="candy-shine" />
            <AdBadgeIcon size={16} />
            <span>CLAIM 2× COINS (+{coinReward * 2})</span>
          </button>

          <button className="candy-play-btn" style={{ height: 54 }} onClick={onNextLevel}>
            <span className="candy-shine" />
            <span className="candy-play-text" style={{ fontSize: 20 }}>
              NEXT LEVEL →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function FailModal({
  coins,
  streak,
  noAds,
  onReviveRv,
  onReviveCoins,
  onBuyStarter,
  onGiveUp
}: {
  coins: number;
  streak: number;
  noAds: boolean;
  onReviveRv: () => void;
  onReviveCoins: () => void;
  onBuyStarter: () => void;
  onGiveUp: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="victory-card fail-card">
        <div className="victory-ribbon fail-ribbon">
          <span>TRAY FULL!</span>
        </div>

        <div className="modal-sub" style={{ fontWeight: 700, color: '#334155', marginTop: 2 }}>
          {streak > 0 ? (
            <>
              Don&apos;t lose your <b style={{ color: '#ea580c' }}>{streak}-win streak</b> &amp; Bolt Rush progress!
            </>
          ) : (
            <>You&apos;re just a few bolts away! Clear tray slots to keep going.</>
          )}
        </div>

        <div className="victory-actions">
          <button className="candy-play-btn" style={{ height: 52 }} onClick={onReviveRv}>
            <span className="candy-shine" />
            <AdBadgeIcon size={17} />
            <span className="candy-play-text" style={{ fontSize: 18 }}>
              FREE REVIVE
            </span>
          </button>

          <button
            className="candy-gold-btn"
            disabled={coins < BOOSTER_COSTS.revive}
            style={{ opacity: coins < BOOSTER_COSTS.revive ? 0.5 : 1 }}
            onClick={onReviveCoins}
          >
            <span className="candy-shine" />
            <GoldCoinIcon size={18} />
            <span>REVIVE · {BOOSTER_COSTS.revive} COINS</span>
          </button>
        </div>

        {!noAds && (
          <div className="toy-shop-card featured" style={{ marginTop: 2 }}>
            <div className="best-ribbon">REVIVE + NO ADS</div>
            <div className="toy-shop-left">
              <NoAdsMedallionIcon size={34} />
              <div>
                <div className="toy-shop-name" style={{ fontSize: 13 }}>
                  Starter Pack
                </div>
                <div className="toy-shop-sub">No Forced Ads + 600 Coins</div>
              </div>
            </div>
            <button className="candy-buy-btn" onClick={onBuyStarter}>
              $4.99
            </button>
          </div>
        )}

        <button className="btn-secondary" onClick={onGiveUp}>
          <Flame size={14} color="#ef4444" /> Retry Level (-1 Heart)
        </button>
      </div>
    </div>
  );
}

export function ShopModal({
  economy,
  onBuySku,
  onClose
}: {
  economy: EconomyState;
  onBuySku: (skuId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="victory-card">
        <button className="modal-x-btn" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={2.8} />
        </button>
        <div className="victory-ribbon gold-ribbon">
          <span>TREASURE SHOP</span>
        </div>

        <div className="modal-sub" style={{ fontWeight: 700 }}>
          Simulated StoreKit / Play Billing · Fires live S2S Cashback postbacks
        </div>

        <div className="shop-cards-list" style={{ maxHeight: 340, overflowY: 'auto', paddingTop: 4 }}>
          {IAP_SKUS.map((sku) => {
            const ownedNoAds = sku.removesInterstitials && economy.noAds;
            const piggyLocked = sku.isPiggyBank && economy.piggyBankCoins < 250;
            return (
              <div key={sku.id} className={`toy-shop-card ${sku.featured ? 'featured' : ''}`}>
                {sku.featured && <div className="best-ribbon">BEST VALUE</div>}
                <div className="toy-shop-left">
                  <div className="toy-shop-art">
                    {sku.removesInterstitials ? (
                      <NoAdsMedallionIcon size={34} />
                    ) : sku.isPiggyBank ? (
                      <PiggyMedallionIcon size={34} />
                    ) : (
                      <GoldCoinIcon size={30} />
                    )}
                  </div>
                  <div>
                    <div className="toy-shop-name" style={{ fontSize: 13.5 }}>
                      {sku.name}
                    </div>
                    <div className="toy-shop-sub">
                      {sku.isPiggyBank
                        ? `Banked: ${economy.piggyBankCoins}/${economy.piggyBankMax}`
                        : sku.subtitle}
                    </div>
                  </div>
                </div>
                <button
                  className="candy-buy-btn"
                  disabled={ownedNoAds || piggyLocked}
                  style={{ opacity: ownedNoAds || piggyLocked ? 0.45 : 1 }}
                  onClick={() => onBuySku(sku.id)}
                >
                  {ownedNoAds ? 'OWNED' : `$${sku.priceUsd.toFixed(2)}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LevelSelectModal({
  currentLevel,
  onSelectLevel,
  onClose
}: {
  currentLevel: number;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="victory-card">
        <button className="modal-x-btn" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={2.8} />
        </button>
        <div className="victory-ribbon">
          <span>3D PUZZLE STAGES</span>
        </div>

        <div className="modal-sub" style={{ fontWeight: 700 }}>
          10 sculpted 3D models + infinite seeded levels after LV.10
        </div>

        <div className="level-grid" style={{ maxHeight: 330, overflowY: 'auto' }}>
          {HANDCRAFTED_LEVELS.map((lvl) => {
            const isCurr = currentLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                className={`level-card ${lvl.difficulty} ${isCurr ? 'current' : ''}`}
                onClick={() => {
                  onSelectLevel(lvl.level);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#1e293b' }}>LV.{lvl.level}</span>
                  {lvl.difficulty === 'hard' && (
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#ea580c' }}>HARD</span>
                  )}
                  {lvl.difficulty === 'superhard' && (
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#9333ea' }}>SUPER</span>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{lvl.title}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{lvl.colorCount} Colors</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  musicEnabled,
  sfxEnabled,
  hapticsEnabled,
  onToggleMusic,
  onToggleSfx,
  onToggleHaptics,
  onClose
}: {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onToggleHaptics: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="victory-card">
        <button className="modal-x-btn" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={2.8} />
        </button>
        <div className="victory-ribbon">
          <span>SETTINGS</span>
        </div>

        <div className="settings-list">
          <button className="setting-row" onClick={onToggleMusic}>
            <div className="setting-left">
              <Music size={18} color="#2563eb" />
              <span>Background Music</span>
            </div>
            <span className={`toggle-pill ${musicEnabled ? 'on' : 'off'}`}>{musicEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button className="setting-row" onClick={onToggleSfx}>
            <div className="setting-left">
              <Volume2 size={18} color="#16a34a" />
              <span>ASMR Sound FX</span>
            </div>
            <span className={`toggle-pill ${sfxEnabled ? 'on' : 'off'}`}>{sfxEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button className="setting-row" onClick={onToggleHaptics}>
            <div className="setting-left">
              <Smartphone size={18} color="#9333ea" />
              <span>Haptic Vibration</span>
            </div>
            <span className={`toggle-pill ${hapticsEnabled ? 'on' : 'off'}`}>{hapticsEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <button className="candy-play-btn" style={{ height: 48 }} onClick={onClose}>
          <span className="candy-shine" />
          <span className="candy-play-text" style={{ fontSize: 18 }}>
            DONE
          </span>
        </button>
      </div>
    </div>
  );
}

export function OutOfLivesModal({
  economy,
  onWatchAdHeart,
  onBuyFullRefill,
  onClose
}: {
  economy: EconomyState;
  onWatchAdHeart: () => void;
  onBuyFullRefill: () => void;
  onClose: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, HEART_REGEN_MS - (now - (economy.lastHeartRegenTs || now)));
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="modal-backdrop">
      <div className="victory-card fail-card">
        <button className="modal-x-btn" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={2.8} />
        </button>
        <div className="victory-ribbon fail-ribbon">
          <span>{economy.hearts <= 0 ? 'OUT OF LIVES!' : 'REFILL LIVES'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <GlossyHeartIcon size={44} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
              {economy.hearts} / {economy.maxHearts} Lives
            </div>
            {economy.hearts < economy.maxHearts && (
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Next life in {mins}:{String(secs).padStart(2, '0')}
              </div>
            )}
          </div>
        </div>

        <div className="victory-actions">
          <button className="candy-play-btn" style={{ height: 50 }} onClick={onWatchAdHeart}>
            <span className="candy-shine" />
            <AdBadgeIcon size={16} />
            <span className="candy-play-text" style={{ fontSize: 17 }}>
              +1 FREE LIFE
            </span>
          </button>

          <button
            className="candy-gold-btn"
            disabled={economy.coins < BOOSTER_COSTS.refillHearts}
            style={{ opacity: economy.coins < BOOSTER_COSTS.refillHearts ? 0.5 : 1 }}
            onClick={onBuyFullRefill}
          >
            <span className="candy-shine" />
            <GoldCoinIcon size={18} />
            <span>FULL REFILL · {BOOSTER_COSTS.refillHearts} COINS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
