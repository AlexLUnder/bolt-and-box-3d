import { useEffect, useState } from 'react';
import { Award, Coins, Flame, Layers, PiggyBank, Play, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';
import { BOOSTER_COSTS, GEO_PRESETS, IAP_SKUS } from '../economy/config';
import { HANDCRAFTED_LEVELS } from '../engine/levelGenerator';
import { EconomyState } from '../engine/types';

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

export function WinModal({
  level,
  coinReward,
  streak,
  piggyCoins,
  piggyMax,
  onNextLevel,
  onDoubleCoinsRv,
  onOpenShop
}: {
  level: number;
  coinReward: number;
  streak: number;
  piggyCoins: number;
  piggyMax: number;
  onNextLevel: () => void;
  onDoubleCoinsRv: () => void;
  onOpenShop: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Award size={44} color="#fbbf24" />
        </div>
        <div className="modal-title">Level {level} Cleared!</div>
        <div className="modal-sub">
          +{coinReward} Coins earned · Win Streak: <b style={{ color: '#fcd34d' }}>{streak}</b>
        </div>

        <div className="shop-item" style={{ background: 'rgba(251, 191, 36, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PiggyBank size={20} color="#f472b6" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Piggy Bank</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {piggyCoins} / {piggyMax} Coins banked
              </div>
            </div>
          </div>
          {piggyCoins >= piggyMax && (
            <button className="price-btn" onClick={onOpenShop}>
              Smash $2.99
            </button>
          )}
        </div>

        <button className="btn-gold" onClick={onDoubleCoinsRv}>
          <Play size={15} fill="currentColor" /> Claim 2× Coins (+{coinReward})
        </button>
        <button className="btn-primary" onClick={onNextLevel}>
          Next Level →
        </button>
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
      <div className="modal-card" style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}>
        <div className="modal-title" style={{ color: '#fca5a5' }}>
          Tray Full!
        </div>
        <div className="modal-sub">
          {streak > 0 ? (
            <>
              Don&apos;t lose your <b style={{ color: '#fcd34d' }}>{streak}-win streak</b>! Clear 3 buffer bolts &amp; keep playing.
            </>
          ) : (
            <>You&apos;re just a few bolts away! Clear 3 tray slots to continue.</>
          )}
        </div>

        <button className="btn-primary" onClick={onReviveRv}>
          <Play size={15} fill="currentColor" /> Watch Ad to Revive (Free)
        </button>

        <button
          className="btn-gold"
          disabled={coins < BOOSTER_COSTS.revive}
          style={{ opacity: coins < BOOSTER_COSTS.revive ? 0.5 : 1 }}
          onClick={onReviveCoins}
        >
          <Coins size={15} /> Revive for {BOOSTER_COSTS.revive} Coins
        </button>

        {!noAds && (
          <div className="shop-item featured">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fde68a', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={12} /> Starter Pack + Revive
              </div>
              <div style={{ fontSize: 10, color: '#cbd5e1' }}>No Forced Ads + 600 Coins (Freecash $4 Cashback!)</div>
            </div>
            <button className="price-btn" onClick={onBuyStarter}>
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
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 16 }}>
            <ShoppingBag size={18} color="#fbbf24" /> Store (Simulated IAP)
          </div>
          <button onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Purchases simulate StoreKit / Play Billing receipt validation &amp; fire Freecash/Scrambly S2S postbacks.
        </div>

        {IAP_SKUS.map((sku) => {
          const ownedNoAds = sku.removesInterstitials && economy.noAds;
          const piggyLocked = sku.isPiggyBank && economy.piggyBankCoins < 250;
          return (
            <div key={sku.id} className={`shop-item ${sku.featured ? 'featured' : ''}`}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {sku.name}
                  {sku.removesInterstitials && <ShieldCheck size={13} color="#0284c7" />}
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  {sku.isPiggyBank
                    ? `Current bank: ${economy.piggyBankCoins}/${economy.piggyBankMax} coins`
                    : sku.subtitle}
                </div>
              </div>
              <button
                className="price-btn"
                disabled={ownedNoAds || piggyLocked}
                style={{ opacity: ownedNoAds || piggyLocked ? 0.45 : 1 }}
                onClick={() => onBuySku(sku.id)}
              >
                {ownedNoAds ? 'Owned' : `$${sku.priceUsd.toFixed(2)}`}
              </button>
            </div>
          );
        })}
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
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 16 }}>
            <Layers size={18} color="#2563eb" /> 3D Puzzle Stages
          </div>
          <button onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#64748b' }}>
          10 hand-crafted 3D toy models + infinite seeded stages after Level 10.
        </div>

        <div className="level-grid">
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
