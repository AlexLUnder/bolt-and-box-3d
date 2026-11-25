import { Lock } from 'lucide-react';
import { BOLT_COLORS } from '../economy/config';
import { BoltColor, CollectorBox } from '../engine/types';
import { AdBadgeIcon, HexBoltIcon } from './GameIcons';

interface CollectorDockProps {
  activeBoxes: CollectorBox[];
  nextBoxColor?: BoltColor;
  maxBoxSlots: number;
  buffer: BoltColor[];
  maxBufferSlots: number;
  onUnlockExtraBox: () => void;
  onUnlockExtraSlot: () => void;
}

export function CollectorDock({
  activeBoxes,
  nextBoxColor,
  maxBoxSlots,
  buffer,
  maxBufferSlots,
  onUnlockExtraBox,
  onUnlockExtraSlot
}: CollectorDockProps) {
  const lockedBoxCount = Math.max(0, 4 - maxBoxSlots);
  const lockedBufferCount = Math.max(0, 7 - maxBufferSlots);
  const danger = buffer.length >= maxBufferSlots - 1;

  return (
    <section className="dock-area" aria-label="Collector Boxes and Holding Tray">
      {/* Top Enamel Color Crates */}
      <div className="boxes-row">
        {Array.from({ length: maxBoxSlots }).map((_, idx) => {
          const box = activeBoxes[idx];
          if (!box) {
            return (
              <div key={`empty_${idx}`} className="crate-slot done">
                <span>CLEAR</span>
              </div>
            );
          }
          const c = BOLT_COLORS[box.color];
          return (
            <div
              key={box.id}
              data-crate-idx={idx}
              className="crate-slot active"
              style={{
                ['--crate-main' as string]: c.hex,
                ['--crate-light' as string]: c.light
              }}
            >
              <div className="crate-lid" />
              <div className="crate-holes">
                {[0, 1, 2].map((h) => (
                  <div key={h} className={`crate-well ${h < box.filled ? 'filled' : ''}`}>
                    {h < box.filled && <div className="crate-pin" style={{ background: c.light }} />}
                  </div>
                ))}
              </div>
              <span className="crate-label">
                {c.symbol} {c.label}
              </span>
            </div>
          );
        })}

        {Array.from({ length: lockedBoxCount }).map((_, idx) => (
          <button key={`lock_box_${idx}`} className="crate-slot locked" onClick={onUnlockExtraBox}>
            <div className="lock-cluster">
              <Lock size={13} strokeWidth={2.6} />
              <AdBadgeIcon size={13} />
            </div>
            <span className="lock-label">ADD BOX</span>
          </button>
        ))}
      </div>

      {/* Machined Buffer Organizer Rail + Strategic NEXT Box Preview */}
      <div className="rail-and-next">
        <div className={`buffer-rail ${danger ? 'danger' : ''}`}>
          {Array.from({ length: maxBufferSlots }).map((_, idx) => {
            const color = buffer[idx];
            return (
              <div key={`buf_${idx}`} data-rail-idx={idx} className={`rail-well ${danger && !color ? 'warn' : ''}`}>
                {color && (
                  <div className="bolt-pop" title={`${BOLT_COLORS[color].label} (${BOLT_COLORS[color].symbol})`}>
                    <HexBoltIcon color={color} size={27} />
                  </div>
                )}
              </div>
            );
          })}

          {Array.from({ length: lockedBufferCount }).map((_, idx) => (
            <button
              key={`lock_buf_${idx}`}
              className="rail-well locked"
              onClick={onUnlockExtraSlot}
              title="Unlock extra holding slot"
            >
              <AdBadgeIcon size={13} />
            </button>
          ))}
        </div>

        {nextBoxColor && (
          <div
            className="next-box-chip"
            title={`Next box: ${BOLT_COLORS[nextBoxColor].label}`}
            style={{ borderColor: BOLT_COLORS[nextBoxColor].hex }}
          >
            <span className="next-lbl">NEXT</span>
            <span className="next-dot" style={{ background: BOLT_COLORS[nextBoxColor].hex }}>
              {BOLT_COLORS[nextBoxColor].symbol}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
