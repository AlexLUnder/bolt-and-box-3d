import { BarChart3, ChevronDown, Flame, Home, Plus, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { DifficultyTag, EconomyState } from '../engine/types';
import { GlossyHeartIcon, GoldCoinIcon } from './GameIcons';

interface TopHudProps {
  economy: EconomyState;
  difficulty: DifficultyTag;
  muted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenHome: () => void;
  onOpenShop: () => void;
  onOpenLevels: () => void;
  onOpenUa: () => void;
}

export function TopHud({
  economy,
  difficulty,
  muted,
  onToggleMute,
  onRestart,
  onOpenHome,
  onOpenShop,
  onOpenLevels,
  onOpenUa
}: TopHudProps) {
  return (
    <header className="top-hud">
      {/* Left: Home, Lives & Coins */}
      <div className="hud-group">
        <button className="icon-circle-btn" onClick={onOpenHome} title="Main Menu" aria-label="Home">
          <Home size={14} strokeWidth={2.5} />
        </button>
        <div className="resource-pill" title="Lives">
          <span className="res-icon">
            <GlossyHeartIcon size={16} />
          </span>
          <span className="res-val">{economy.hearts}</span>
        </div>

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
        <button className="icon-circle-btn" onClick={onToggleMute} title="Toggle Sound" aria-label="Sound">
          {muted ? <VolumeX size={14} strokeWidth={2.5} /> : <Volume2 size={14} strokeWidth={2.5} />}
        </button>
        <button className="ua-chip" onClick={onOpenUa} title="UA & Freecash / Scrambly Simulator">
          <BarChart3 size={12} strokeWidth={2.6} />
          <span>UA</span>
        </button>
      </div>
    </header>
  );
}
