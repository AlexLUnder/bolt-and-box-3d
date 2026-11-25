import { BarChart3, ChevronDown, Flame, Home, Plus, RotateCcw, Settings } from 'lucide-react';
import { DifficultyTag, EconomyState } from '../engine/types';
import { GlossyHeartIcon, GoldCoinIcon } from './GameIcons';

interface TopHudProps {
  economy: EconomyState;
  difficulty: DifficultyTag;
  onRestart: () => void;
  onOpenHome: () => void;
  onOpenLives: () => void;
  onOpenShop: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
  onOpenUa: () => void;
}

export function TopHud({
  economy,
  difficulty,
  onRestart,
  onOpenHome,
  onOpenLives,
  onOpenShop,
  onOpenLevels,
  onOpenSettings,
  onOpenUa
}: TopHudProps) {
  return (
    <header className="top-hud">
      {/* Left: Home, Lives & Coins */}
      <div className="hud-group">
        <button className="icon-circle-btn" onClick={onOpenHome} title="Main Menu" aria-label="Home">
          <Home size={14} strokeWidth={2.5} />
        </button>
        <button className="resource-pill" onClick={onOpenLives} title="Lives">
          <span className="res-icon">
            <GlossyHeartIcon size={16} />
          </span>
          <span className="res-val">{economy.hearts}</span>
        </button>

        <button className="resource-pill coin-pill" onClick={onOpenShop} title="Open Store">
          <span className="res-icon">
            <GoldCoinIcon size={16} />
          </span>
          <span className="res-val">{economy.coins}</span>
          <span className="res-plus">
            <Plus size={11} strokeWidth={3.2} />
          </span>
        </button>
      </div>

      {/* Center: Stage Crest */}
      <button className={`stage-crest ${difficulty}`} onClick={onOpenLevels} title="Select 3D Stage">
        {difficulty === 'hard' && <Flame size={12} fill="#fef08a" color="#fef08a" />}
        <span>LV.{economy.level}</span>
        <ChevronDown size={13} strokeWidth={2.8} opacity={0.9} />
      </button>

      {/* Right: Utility & UA Controls */}
      <div className="hud-group">
        <button className="icon-circle-btn" onClick={onRestart} title="Restart Level" aria-label="Restart">
          <RotateCcw size={14} strokeWidth={2.5} />
        </button>
        <button className="icon-circle-btn" onClick={onOpenSettings} title="Settings (Music / SFX / Haptics)" aria-label="Settings">
          <Settings size={14} strokeWidth={2.5} />
        </button>
        <button className="ua-chip" onClick={onOpenUa} title="UA & Freecash / Scrambly Simulator">
          <BarChart3 size={12} strokeWidth={2.6} />
          <span>UA</span>
        </button>
      </div>
    </header>
  );
}
