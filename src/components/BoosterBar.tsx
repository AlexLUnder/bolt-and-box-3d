import { BOOSTER_COSTS } from '../economy/config';
import { AdBadgeIcon, GoldCoinIcon, MagnetBoosterIcon, SlotBoosterIcon, SweepBoosterIcon } from './GameIcons';

interface BoosterBarProps {
  coins: number;
  canAddSlot: boolean;
  canClearTray: boolean;
  onAddSlot: (useRv: boolean) => void;
  onMagnet: (useRv: boolean) => void;
  onClearTray: (useRv: boolean) => void;
}

export function BoosterBar({
  coins,
  canAddSlot,
  canClearTray,
  onAddSlot,
  onMagnet,
  onClearTray
}: BoosterBarProps) {
  const slotRv = coins < BOOSTER_COSTS.extraSlot;
  const magnetRv = coins < BOOSTER_COSTS.magnet;
  const clearRv = coins < BOOSTER_COSTS.clearTray;

  return (
    <footer className="booster-dock" aria-label="Power-ups">
      <button className="booster-pad" disabled={!canAddSlot} onClick={() => onAddSlot(slotRv)}>
        <div className="booster-medallion">
          <SlotBoosterIcon size={32} />
        </div>
        <span className="booster-name">+1 Slot</span>
        <span className={`booster-tag ${slotRv ? 'ad' : 'coin'}`}>
          {slotRv ? (
            <>
              <AdBadgeIcon size={11} /> FREE
            </>
          ) : (
            <>
              <GoldCoinIcon size={11} /> {BOOSTER_COSTS.extraSlot}
            </>
          )}
        </span>
      </button>

      <button className="booster-pad" onClick={() => onMagnet(magnetRv)}>
        <div className="booster-medallion">
          <MagnetBoosterIcon size={32} />
        </div>
        <span className="booster-name">Magnet</span>
        <span className={`booster-tag ${magnetRv ? 'ad' : 'coin'}`}>
          {magnetRv ? (
            <>
              <AdBadgeIcon size={11} /> FREE
            </>
          ) : (
            <>
              <GoldCoinIcon size={11} /> {BOOSTER_COSTS.magnet}
            </>
          )}
        </span>
      </button>

      <button className="booster-pad" disabled={!canClearTray} onClick={() => onClearTray(clearRv)}>
        <div className="booster-medallion">
          <SweepBoosterIcon size={32} />
        </div>
        <span className="booster-name">Sweep</span>
        <span className={`booster-tag ${clearRv ? 'ad' : 'coin'}`}>
          {clearRv ? (
            <>
              <AdBadgeIcon size={11} /> FREE
            </>
          ) : (
            <>
              <GoldCoinIcon size={11} /> {BOOSTER_COSTS.clearTray}
            </>
          )}
        </span>
      </button>
    </footer>
  );
}
