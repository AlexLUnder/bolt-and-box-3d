import { useState } from 'react';
import { BarChart3, Box, Calendar, Flame, Home, Lock, Map, Play, Settings, ShoppingBag, Star } from 'lucide-react';
import { IAP_SKUS } from '../economy/config';
import { getLevelMeta, HANDCRAFTED_LEVELS } from '../engine/levelGenerator';
import { ChassisShape, EconomyState } from '../engine/types';
import {
  GiftChestIcon,
  GlossyHeartIcon,
  GoldCoinIcon,
  NoAdsMedallionIcon,
  PiggyMedallionIcon,
  StreakFlameIcon
} from './GameIcons';
import { canClaimDaily } from './LiveOpsModals';

type MenuTab = 'home' | 'stages' | 'toys' | 'shop';

interface MainMenuProps {
  economy: EconomyState;
  onPlayLevel: (level: number) => void;
  onPreviewShape: (level: number) => void;
  onBuySku: (skuId: string) => void;
  onOpenLives: () => void;
  onOpenDaily: () => void;
  onOpenRace: () => void;
  onOpenSettings: () => void;
  onOpenUa: () => void;
}

export function MainMenu({
  economy,
  onPlayLevel,
  onPreviewShape,
  onBuySku,
  onOpenLives,
  onOpenDaily,
  onOpenRace,
  onOpenSettings,
  onOpenUa
}: MainMenuProps) {
  const [tab, setTab] = useState<MenuTab>('home');
  const currentMeta = getLevelMeta(economy.level);
  const stageNumbers = Array.from({ length: 50 }, (_, i) => i + 1);
  const deepMilestones = [150, 350, 700];
  const dailyReady = canClaimDaily(economy);

  return (
    <div className={`menu-overlay ${tab === 'home' ? 'home-transparent' : 'panel-toy'}`}>
      {/* Top Resource Bar */}
      <header className="top-hud">
        <div className="hud-group">
          <button className="resource-pill" onClick={onOpenLives} title="Lives">
            <span className="res-icon">
              <GlossyHeartIcon size={18} />
            </span>
            <span className="res-val">{economy.hearts}</span>
          </button>
          <button className="resource-pill coin-pill" onClick={() => setTab('shop')}>
            <span className="res-icon">
              <GoldCoinIcon size={18} />
            </span>
            <span className="res-val">{economy.coins}</span>
            <span className="res-plus">+</span>
          </button>
        </div>

        <div className="hud-group">
          <button
            className="icon-circle-btn daily-btn"
            onClick={onOpenDaily}
            title="Daily Bonus"
            aria-label="Daily Bonus"
          >
            <Calendar size={14} strokeWidth={2.6} />
            {dailyReady && <span className="notif-dot" />}
          </button>
          <button className="icon-circle-btn" onClick={onOpenSettings} title="Settings" aria-label="Settings">
            <Settings size={15} strokeWidth={2.6} />
          </button>
          <button className="ua-chip" onClick={onOpenUa} title="UA & CPE Simulator">
            <BarChart3 size={12} strokeWidth={2.6} />
            <span>UA</span>
          </button>
        </div>
      </header>

      {/* ==================== TAB 1: HOME LOBBY ==================== */}
      {tab === 'home' && (
        <div className="home-body">
          {/* Big Hero Game Logo */}
          <div className="toy-logo-wrap">
            <div className="toy-logo-stack">
              <div className="toy-logo-top">
                <span className="logo-bolt">BOLT</span>
                <span className="logo-amp">&amp;</span>
              </div>
              <div className="toy-logo-bottom">
                <span className="logo-box">BOX</span>
                <span className="logo-3d">3D</span>
              </div>
            </div>
          </div>

          {/* Open Center Stage — lets the live 3D toy shine completely unobstructed */}
          <div className="home-stage-spacer" />

          {/* Clean Bottom Action Stack */}
          <div className="home-bottom-stack">
            <div className="toy-stage-ribbon">
              <span>LV.{currentMeta.level}</span>
              <span className="ribbon-sep">·</span>
              <span>{currentMeta.title}</span>
              {currentMeta.difficulty !== 'normal' && (
                <span className={`ribbon-tag ${currentMeta.difficulty}`}>
                  {currentMeta.difficulty === 'superhard' ? 'SUPER HARD' : 'HARD'}
                </span>
              )}
            </div>

            <div className="home-quick-row">
              <button className="quick-card race" onClick={onOpenRace}>
                <StreakFlameIcon size={30} />
                <div className="quick-card-text">
                  <span className="quick-title">Bolt Rush</span>
                  <div className="quick-bar">
                    <div
                      className="quick-bar-fill race-fill"
                      style={{ width: `${Math.min(100, Math.round((economy.raceWins / 7) * 100))}%` }}
                    />
                  </div>
                  <span className="quick-micro">{economy.raceWins}/7 Wins · 10K Pool</span>
                </div>
              </button>

              {!economy.noAds ? (
                <button className="quick-card noads" onClick={() => setTab('shop')}>
                  <NoAdsMedallionIcon size={30} />
                  <div className="quick-card-text">
                    <span className="quick-title">No-Ads Pack</span>
                    <span className="quick-sub">$4.99 · +600</span>
                  </div>
                </button>
              ) : (
                <button className="quick-card piggy" onClick={() => setTab('shop')}>
                  <PiggyMedallionIcon size={30} />
                  <div className="quick-card-text">
                    <span className="quick-title">Piggy Bank</span>
                    <div className="quick-bar">
                      <div
                        className="quick-bar-fill"
                        style={{ width: `${Math.min(100, Math.round((economy.piggyBankCoins / economy.piggyBankMax) * 100))}%` }}
                      />
                    </div>
                  </div>
                </button>
              )}
            </div>

            <button className="candy-play-btn" onClick={() => onPlayLevel(economy.level)}>
              <span className="candy-shine" />
              <Play size={24} fill="#ffffff" strokeWidth={2.5} />
              <span className="candy-play-text">PLAY</span>
              <span className="candy-lv-pill">LV.{economy.level}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: WINDING SAGA MAP ==================== */}
      {tab === 'stages' && (
        <div className="saga-scroll">
          <div className="saga-banner">
            <div className="saga-banner-title">ADVENTURE MAP</div>
            <div className="saga-cpe-row">
              {deepMilestones.map((lvl) => {
                const m = getLevelMeta(lvl);
                return (
                  <button key={lvl} className="saga-milestone-chip" onClick={() => onPlayLevel(lvl)}>
                    <GiftChestIcon size={16} />
                    <span>L{lvl} · {m.cpeTag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="saga-path">
            {stageNumbers.map((lvl, idx) => {
              const m = getLevelMeta(lvl);
              const isCurr = economy.level === lvl;
              const isDone = lvl < economy.level;
              const wave = Math.sin(idx * 0.85) * 76;

              return (
                <div key={lvl} className="saga-step" style={{ transform: `translateX(${wave}px)` }}>
                  <button
                    className={`saga-node ${m.difficulty} ${isCurr ? 'current' : ''} ${isDone ? 'done' : ''}`}
                    onClick={() => onPlayLevel(lvl)}
                  >
                    <span className="node-shine" />
                    {m.difficulty === 'hard' && !isDone && (
                      <span className="node-badge-top">
                        <Flame size={11} fill="#fef08a" color="#fef08a" />
                      </span>
                    )}
                    {m.cpeTag && <span className="node-cpe-tag">{m.cpeTag}</span>}
                    <span className="node-num">{lvl}</span>
                    {isDone && (
                      <span className="node-stars">
                        <Star size={9} fill="#fef08a" color="#b45309" />
                        <Star size={11} fill="#fef08a" color="#b45309" />
                        <Star size={9} fill="#fef08a" color="#b45309" />
                      </span>
                    )}
                  </button>
                  <div className="saga-node-caption">{m.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: 3D WORKSHOP TOY COLLECTION ==================== */}
      {tab === 'toys' && (
        <div className="saga-scroll">
          <div className="saga-banner toys-banner">
            <div className="saga-banner-title">3D WORKSHOP</div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#e0e7ff' }}>
              Unlocked: {economy.unlockedModels.length} / {HANDCRAFTED_LEVELS.length} Sculpted Models
            </div>
          </div>

          <div className="toy-shelf-grid">
            {HANDCRAFTED_LEVELS.map((m) => {
              const unlocked = economy.unlockedModels.includes(m.shape as ChassisShape) || economy.level > m.level;
              return (
                <div key={m.shape} className={`toy-shelf-card ${unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="toy-shelf-top">
                    <span className="toy-shelf-lv">LV.{m.level}</span>
                    {unlocked ? (
                      <Star size={14} fill="#fbbf24" color="#b45309" />
                    ) : (
                      <Lock size={13} color="#64748b" />
                    )}
                  </div>
                  <div className="toy-shelf-name">{m.title}</div>
                  <div className="toy-shelf-sub">{m.colorCount} Colors · {m.shape}</div>
                  {unlocked ? (
                    <button
                      className="toy-inspect-btn"
                      onClick={() => onPreviewShape(m.level)}
                    >
                      Inspect 3D
                    </button>
                  ) : (
                    <button className="toy-play-unlock-btn" onClick={() => onPlayLevel(m.level)}>
                      Play LV.{m.level}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: TOY WORKSHOP STORE ==================== */}
      {tab === 'shop' && (
        <div className="saga-scroll">
          <div className="saga-banner shop-banner">
            <div className="saga-banner-title">TREASURE SHOP</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fef3c7' }}>
              Simulated StoreKit / Play Billing + S2S Cashback
            </div>
          </div>

          <div className="shop-cards-list">
            {IAP_SKUS.map((sku) => {
              const ownedNoAds = sku.removesInterstitials && economy.noAds;
              const piggyLocked = sku.isPiggyBank && economy.piggyBankCoins < 250;
              return (
                <div key={sku.id} className={`toy-shop-card ${sku.featured ? 'featured' : ''}`}>
                  {sku.featured && <div className="best-ribbon">BEST VALUE</div>}
                  <div className="toy-shop-left">
                    <div className="toy-shop-art">
                      {sku.removesInterstitials ? (
                        <NoAdsMedallionIcon size={38} />
                      ) : sku.isPiggyBank ? (
                        <PiggyMedallionIcon size={38} />
                      ) : (
                        <GoldCoinIcon size={34} />
                      )}
                    </div>
                    <div>
                      <div className="toy-shop-name">{sku.name}</div>
                      <div className="toy-shop-sub">
                        {sku.isPiggyBank
                          ? `Banked: ${economy.piggyBankCoins} / ${economy.piggyBankMax} coins`
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
      )}

      {/* ==================== CHUNKY 4-TAB GAME BOTTOM DOCK ==================== */}
      <nav className="toy-dock-nav four-tabs" aria-label="Main Navigation">
        <button className={`dock-tab ${tab === 'stages' ? 'active' : ''}`} onClick={() => setTab('stages')}>
          <Map size={20} strokeWidth={2.5} />
          <span>Map</span>
        </button>
        <button className={`dock-tab ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <Home size={21} strokeWidth={2.5} />
          <span>Home</span>
        </button>
        <button className={`dock-tab ${tab === 'toys' ? 'active' : ''}`} onClick={() => setTab('toys')}>
          <Box size={20} strokeWidth={2.5} />
          <span>Toys</span>
        </button>
        <button className={`dock-tab ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>
          <ShoppingBag size={20} strokeWidth={2.5} />
          <span>Shop</span>
        </button>
      </nav>
    </div>
  );
}
