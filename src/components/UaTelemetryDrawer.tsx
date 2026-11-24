import { useMemo } from 'react';
import { CheckCircle2, FastForward, RefreshCw, ShieldAlert, TrendingUp, X } from 'lucide-react';
import { CPE_LADDER, GEO_PRESETS } from '../economy/config';
import { runCpeMonteCarlo } from '../economy/simulator';
import { getBlendedLtvUsd, getNetIapUsd, getTotalCpePayoutUsd } from '../economy/store';
import { EconomyState, GeoPresetId } from '../engine/types';

interface UaTelemetryDrawerProps {
  economy: EconomyState;
  onClose: () => void;
  onChangeGeo: (geo: GeoPresetId) => void;
  onToggleStoreFee: () => void;
  onJumpLevel: (lvl: number) => void;
  onResetEconomy: () => void;
}

export function UaTelemetryDrawer({
  economy,
  onClose,
  onChangeGeo,
  onToggleStoreFee,
  onJumpLevel,
  onResetEconomy
}: UaTelemetryDrawerProps) {
  const netIap = getNetIapUsd(economy);
  const blendedLtv = getBlendedLtvUsd(economy);
  const totalPayout = getTotalCpePayoutUsd(economy);
  const iaaPct = blendedLtv > 0 ? (economy.iaaRevenueUsd / blendedLtv) * 100 : 0;
  const liveMargin = blendedLtv - totalPayout;

  const sim = useMemo(
    () => runCpeMonteCarlo(economy.geoPreset, economy.storeFeeRate, 1000),
    [economy.geoPreset, economy.storeFeeRate]
  );

  return (
    <div className="ua-drawer">
      <div className="ua-header">
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={15} color="#34d399" /> UA &amp; Freecash / Scrambly CPE Sim
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            Calibrated to O&amp;O + B2B D90 Break-Even Benchmarks
          </div>
        </div>
        <button onClick={onClose} style={{ padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <div className="ua-body">
        {/* Preset Controls */}
        <div className="ua-section">
          <div className="ua-sec-title">
            <span>Geo / OS &amp; Store Fee Tier</span>
            <button
              onClick={onToggleStoreFee}
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#7dd3fc',
                fontWeight: 700
              }}
            >
              Store Cut: {Math.round(economy.storeFeeRate * 100)}% (Tap to toggle)
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(Object.keys(GEO_PRESETS) as GeoPresetId[]).map((id) => {
              const g = GEO_PRESETS[id];
              const active = economy.geoPreset === id;
              return (
                <button
                  key={id}
                  onClick={() => onChangeGeo(id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: 'left',
                    background: active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                    border: active ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#86efac' : '#cbd5e1'
                  }}
                >
                  <div>{g.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.75 }}>
                    CPI ${g.targetCpi} · RV ${g.rvEcpm} eCPM
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Session KPIs */}
        <div className="ua-grid">
          <div className="ua-kpi">
            <div className="ua-kpi-lbl">Live Session LTV</div>
            <div className="ua-kpi-val" style={{ color: '#4ade80' }}>
              ${blendedLtv.toFixed(3)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              IAA ${economy.iaaRevenueUsd.toFixed(3)} ({iaaPct.toFixed(0)}%) · Net IAP ${netIap.toFixed(2)}
            </div>
          </div>
          <div className="ua-kpi">
            <div className="ua-kpi-lbl">Session CPE Margin</div>
            <div className="ua-kpi-val" style={{ color: liveMargin >= 0 ? '#4ade80' : '#f87171' }}>
              {liveMargin >= 0 ? '+' : ''}${liveMargin.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              Payouts ${totalPayout.toFixed(2)} · RV {economy.rvWatched} / Int {economy.interstitialsShown}
            </div>
          </div>
        </div>

        {/* 1,000-User Monte Carlo Projection */}
        <div className="ua-section" style={{ borderColor: 'rgba(52, 211, 153, 0.35)' }}>
          <div className="ua-sec-title">
            <span>1,000-User Offerwall Cohort Stress-Test</span>
            <span style={{ fontSize: 10, color: '#34d399' }}>Freecash / Scrambly</span>
          </div>
          <div className="ua-grid">
            <div className="ua-kpi">
              <div className="ua-kpi-lbl">Projected D30 / D90 ROAS</div>
              <div className="ua-kpi-val" style={{ color: sim.d30RoasPct >= 100 ? '#4ade80' : '#fbbf24' }}>
                {sim.d30RoasPct.toFixed(0)}% / {sim.d90RoasPct.toFixed(0)}%
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                Blended eCPI (CPE): ${sim.avgCpePayout.toFixed(2)}
              </div>
            </div>
            <div className="ua-kpi">
              <div className="ua-kpi-lbl">Net Profit / Install</div>
              <div className="ua-kpi-val" style={{ color: sim.netProfitPerUser >= 0 ? '#4ade80' : '#f87171' }}>
                {sim.netProfitPerUser >= 0 ? '+' : ''}${sim.netProfitPerUser.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                D90 LTV ${sim.avgBlendedLtv.toFixed(2)} · {sim.iaaSharePct.toFixed(0)}% IAA
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            Mix: {sim.starterBuyerPct.toFixed(1)}% Starter Cashback buyers · {sim.whalePct.toFixed(1)}% Whales ·{' '}
            {Math.round(economy.storeFeeRate * 100)}% store fee applied.
          </div>
        </div>

        {/* Freecash / Scrambly CPE Ladder */}
        <div className="ua-section">
          <div className="ua-sec-title">
            <span>CPE Offer Ladder ({economy.completedMilestones.length}/{CPE_LADDER.length})</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Max Payout $47.25</span>
          </div>
          {CPE_LADDER.map((m) => {
            const done = economy.completedMilestones.includes(m.id);
            return (
              <div key={m.id} className={`milestone-row ${done ? 'done' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color={done ? '#22c55e' : '#475569'} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.label}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>
                      Cap: {m.timeCapDays}d · Min time: {Math.round(m.minExpectedSeconds / 60)}m
                    </div>
                  </div>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: done ? '#4ade80' : '#fcd34d' }}>
                  ${m.payoutUsd.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* S2S Postback Log */}
        <div className="ua-section">
          <div className="ua-sec-title">
            <span>S2S Postback &amp; Anti-Fraud Log</span>
            {economy.usedDebugJump && (
              <span style={{ fontSize: 10, color: '#f87171', display: 'flex', alignItems: 'center', gap: 3 }}>
                <ShieldAlert size={11} /> Velocity Flag Active
              </span>
            )}
          </div>
          <div className="postback-log">
            {economy.postbacks.length === 0
              ? '// No S2S postbacks fired yet.\n// Complete Level 10 or buy $4.99 Starter Pack to trigger.'
              : economy.postbacks.map((pb) => JSON.stringify(pb)).join('\n')}
          </div>
        </div>

        {/* Playtest Dev Shortcuts */}
        <div className="ua-section">
          <div className="ua-sec-title">
            <span>Quick Playtest Controls</span>
            <button
              onClick={onResetEconomy}
              style={{ fontSize: 10, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
            >
              <RefreshCw size={11} /> Reset Save
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 5, 10, 50].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  onJumpLevel(lvl);
                  onClose();
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.45)',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <FastForward size={11} /> Jump L{lvl}
                {lvl === 5 ? ' (Hard)' : lvl === 10 ? ' (CPE)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
