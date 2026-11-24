import { Calendar, Check, Flame, Trophy, Users, X } from 'lucide-react';
import { EconomyState } from '../engine/types';
import { GiftChestIcon, GoldCoinIcon } from './GameIcons';

export const DAILY_REWARDS = [
  { day: 1, coins: 60, label: 'Day 1' },
  { day: 2, coins: 100, label: 'Day 2' },
  { day: 3, coins: 150, label: 'Day 3' },
  { day: 4, coins: 220, label: 'Day 4' },
  { day: 5, coins: 300, label: 'Day 5' },
  { day: 6, coins: 450, label: 'Day 6' },
  { day: 7, coins: 800, label: 'Day 7' }
];

export const RACE_SURVIVOR_CURVE = [100, 68, 44, 28, 17, 10, 6, 4];
export const RACE_PRIZE_POOL = 10000;

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function canClaimDaily(economy: EconomyState): boolean {
  return economy.lastDailyClaimDate !== getTodayKey();
}

export function DailyRewardsModal({
  economy,
  onClaim,
  onClose
}: {
  economy: EconomyState;
  onClaim: (coins: number) => void;
  onClose: () => void;
}) {
  const claimable = canClaimDaily(economy);
  const currentReward = DAILY_REWARDS[(economy.dailyDay - 1) % 7];

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 17 }}>
            <Calendar size={18} color="#2563eb" /> Daily Bonus
          </div>
          <button onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-sub">
          Log in every day to build your coin stash for Hard levels!
        </div>

        <div className="daily-grid">
          {DAILY_REWARDS.map((r) => {
            const isPast = r.day < economy.dailyDay;
            const isCurrent = r.day === economy.dailyDay;
            return (
              <div
                key={r.day}
                className={`daily-tile ${isCurrent ? 'today' : ''} ${isPast ? 'claimed' : ''} ${r.day === 7 ? 'grand' : ''}`}
              >
                <span className="daily-day">{r.label}</span>
                {r.day === 7 ? <GiftChestIcon size={26} /> : <GoldCoinIcon size={22} />}
                <span className="daily-amt">+{r.coins}</span>
                {isPast && (
                  <span className="daily-check">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="btn-primary"
          disabled={!claimable}
          style={{ opacity: claimable ? 1 : 0.5 }}
          onClick={() => onClaim(currentReward.coins)}
        >
          {claimable ? `Claim Day ${economy.dailyDay} (+${currentReward.coins} Coins)` : 'Claimed Today ✓'}
        </button>
      </div>
    </div>
  );
}

export function StreakRaceModal({
  economy,
  onClaimGrandPrize,
  onRestartRace,
  onClose
}: {
  economy: EconomyState;
  onClaimGrandPrize: (share: number) => void;
  onRestartRace: () => void;
  onClose: () => void;
}) {
  const finished = economy.raceWins >= 7;
  const share = Math.round(RACE_PRIZE_POOL / Math.max(1, economy.raceSurvivors));

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ borderColor: '#f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 17, color: '#b45309' }}>
            <Flame size={19} fill="#f97316" color="#ea580c" /> Bolt Rush Race
          </div>
          <button onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="race-hero">
          <div className="race-pool">
            <Trophy size={22} color="#fef08a" />
            <span>{RACE_PRIZE_POOL.toLocaleString()} COINS POOL</span>
          </div>
          <div className="race-meta">
            <span><Users size={12} /> {economy.raceSurvivors} / 100 players left</span>
            <span>·</span>
            <span>Est. share: <b>+{share}</b></span>
          </div>
        </div>

        <div className="modal-sub">
          Win <b>7 levels in a row</b> without failing to split the 10,000 Coin Grand Prize!
        </div>

        {/* 7-Step Bridge */}
        <div className="race-steps">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => {
            const done = step <= economy.raceWins;
            const curr = step === economy.raceWins + 1;
            return (
              <div key={step} className={`race-node ${done ? 'done' : ''} ${curr ? 'curr' : ''}`}>
                {done ? <Check size={13} strokeWidth={3} /> : step}
              </div>
            );
          })}
        </div>

        {finished ? (
          <button className="btn-gold" onClick={() => onClaimGrandPrize(share)}>
            Claim Your Share (+{share} Coins!)
          </button>
        ) : !economy.raceActive ? (
          <button className="btn-primary" onClick={onRestartRace}>
            Start New 7-Win Race
          </button>
        ) : (
          <button className="btn-primary" onClick={onClose}>
            Keep Racing ({economy.raceWins}/7 Wins)
          </button>
        )}
      </div>
    </div>
  );
}
