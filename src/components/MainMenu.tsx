import { useState } from 'react';
import { BarChart3, Flame, Home, Map, Play, ShoppingBag, Star, Volume2, VolumeX } from 'lucide-react';
import { IAP_SKUS } from '../economy/config';
import { getLevelMeta } from '../engine/levelGenerator';
import { EconomyState } from '../engine/types';
import {
  GiftChestIcon,
  GlossyHeartIcon,
  GoldCoinIcon,
  NoAdsMedallionIcon,
  PiggyMedallionIcon,
  StreakFlameIcon
} from './GameIcons';

type MenuTab = 'home' | 'stages' | 'shop';

interface MainMenuProps {
  economy: EconomyState;
  muted: boolean;
  onToggleMute: () => void;
  onPlayLevel: (level: number) => void;
  onBuySku: (skuId: string) => void;
  onOpenUa: () => void;
}

export function MainMenu({
  economy,
  muted,
  onToggleMute,
  onPlayLevel,
  onBuySku,
  onOpenUa
}: MainMenuProps) {
  const [tab, setTab] = useState<MenuTab>('home');
  const currentMeta = getLevelMeta(economy.level);
  const stageNumbers = Array.from({ length: 50 }, (_, i) => i + 1);
  const deepMilestones = [150, 350, 700];

  return (
    <div className={`menu-overlay ${tab === 'home' ? 'home-transparent' : 'panel-toy'}`}>
      {/* Top Resource Bar */}
      <header className="top-hud">
        <div className="hud-group">
          <div className="resource-pill">
            <span className="res-icon">
              <GlossyHeartIcon size={18} />
            </span>
            <span className="res-val">{economy.hearts}</span>
          </div>
          <button className="resource-pill coin-pill" onClick={() => setTab('shop')}>
            <span className="res-icon">
              <GoldCoinIcon size={18} />
            </span>
            <span className="res-val">{economy.coins}</span>
            <span className="res-plus">+</span>
          </button>
        </div>

        <div className="hud-group">
          <button className="icon-circle-btn" onClick={onToggleMute} title="Toggle Music & SFX" aria-label="Sound">
            {muted ? <VolumeX size={15} strokeWidth={2.6} /> : <Volume2 size={15} strokeWidth={2.6} />}
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
          {/* Playful Bouncy Toy Logo */}
          <div className="toy-logo-wrap">
            <div className="toy-logo">
              <span className="logo-bolt">BOLT</span>
              <span className="logo-amp">&amp;</span>
              <span className="logo-box">BOX</span>
              <span className="logo-3d">3D</span>
            </div>
            <div className="toy-stage-ribbon">
              <span>{currentMeta.title}</span>
              {currentMeta.difficulty !== 'normal' && (
                <span className={`ribbon-tag ${currentMeta.difficulty}`}>
                  {currentMeta.difficulty === 'superhard' ? 'SUPER HARD' : 'HARD'}
                </span>
              )}
            </div>
          </div>

          {/* Floating Illustrated Medallions flanking the live rotating 3D model */}
          <div className="home-middle">
            <div className="medallion-col">
              <button className="medallion-btn" onClick={() => setTab('shop')}>
                <div className="medallion-orb pink">
                  <PiggyMedallionIcon size={36} />
                </div>
                <span className="medallion-pill">{economy.piggyBankCoins}</span>
              </button>

              {!economy.noAds && (
                <button className="medallion-btn" onClick={() => setTab('shop')}>
                  <div className="medallion-orb gold">
                    <NoAdsMedallionIcon size={36} />
                  </div>
                  <span className="medallion-pill hot">$4.99</span>
                </button>
              )}
            </div>

            <div className="medallion-col">
              <div className="medallion-btn">
                <div className="medallion-orb fire">
                  <StreakFlameIcon size={36} />
                </div>
                <span className="medallion-pill">{economy.streak} Win</span>
              </div>

              <button className="medallion-btn" onClick={() => setTab('stages')}>
                <div className="medallion-orb sky">
                  <GiftChestIcon size={32} />
                </div>
                <span className="medallion-pill">50+ Map</span>
              </button>
            </div>
          </div>

          {/* Candy-Glossy Play Button */}
          <div className="home-cta-wrap">
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
              // Sinusoidal winding stepping-stone offset
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

      {/* ==================== TAB 3: TOY WORKSHOP STORE ==================== */}
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

      {/* ==================== CHUNKY GAME BOTTOM DOCK ==================== */}
      <nav className="toy-dock-nav" aria-label="Main Navigation">
        <button className={`dock-tab ${tab === 'stages' ? 'active' : ''}`} onClick={() => setTab('stages')}>
          <Map size={21} strokeWidth={2.5} />
          <span>Map</span>
        </button>
        <button className={`dock-tab ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <Home size={22} strokeWidth={2.5} />
          <span>Home</span>
        </button>
        <button className={`dock-tab ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>
          <ShoppingBag size={21} strokeWidth={2.5} />
          <span>Shop</span>
        </button>
      </nav>
    </div>
  );
}
