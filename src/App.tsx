import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, RotateCcw, RotateCw } from 'lucide-react';
import { BoosterBar } from './components/BoosterBar';
import { CollectorDock } from './components/CollectorDock';
import { HexBoltIcon } from './components/GameIcons';
import { DailyRewardsModal, getTodayKey, RACE_SURVIVOR_CURVE, StreakRaceModal } from './components/LiveOpsModals';
import { MainMenu } from './components/MainMenu';
import { ActiveAdModal, FailModal, LevelSelectModal, MockAdOverlay, ShopModal, WinModal } from './components/Modals';
import { TopHud } from './components/TopHud';
import { UaTelemetryDrawer } from './components/UaTelemetryDrawer';
import { BOLT_COLORS, BOOSTER_COSTS } from './economy/config';
import {
  createInitialEconomy,
  evaluateMilestones,
  loadEconomy,
  recordAdImpression,
  recordIapPurchase,
  saveEconomy,
  switchGeoPreset
} from './economy/store';
import { sound } from './engine/audio';
import { haptics } from './engine/haptics';
import { generateLevel, isBoltOccluded } from './engine/levelGenerator';

const IS_PLAYABLE_AD =
  import.meta.env.VITE_PLAYABLE_AD === 'true' ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('playable') === '1');

function openStoreCta() {
  const w = window as unknown as {
    mraid?: { open?: (url: string) => void };
    FbPlayableAd?: { onCTAClick?: () => void };
  };
  const storeUrl = 'https://apps.apple.com/';
  if (w.FbPlayableAd?.onCTAClick) {
    w.FbPlayableAd.onCTAClick();
  } else if (w.mraid?.open) {
    w.mraid.open(storeUrl);
  } else {
    window.open(storeUrl, '_blank');
  }
}
import { BoltScene } from './engine/ThreeScene';
import { BoltColor, CollectorBox, EconomyState, GeoPresetId, LevelConfig } from './engine/types';

function createBoxId(seq: number) {
  return `box_${seq}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function App() {
  const [economy, setEconomy] = useState<EconomyState>(() => loadEconomy());
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(() => generateLevel(loadEconomy().level));
  const [activeBoxes, setActiveBoxes] = useState<CollectorBox[]>([]);
  const [boxQueue, setBoxQueue] = useState<BoltColor[]>([]);
  const [maxBoxSlots, setMaxBoxSlots] = useState(2);
  const [buffer, setBuffer] = useState<BoltColor[]>([]);
  const [maxBufferSlots, setMaxBufferSlots] = useState(5);
  const [boltsRemaining, setBoltsRemaining] = useState(0);

  const [screen, setScreen] = useState<'menu' | 'play'>(() => (IS_PLAYABLE_AD ? 'play' : 'menu'));
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showRace, setShowRace] = useState(false);
  const [showUa, setShowUa] = useState(false);
  const [showPlayableCta, setShowPlayableCta] = useState(false);
  const [comboText, setComboText] = useState<{ key: number; label: string } | null>(null);
  const [flyingBolts2d, setFlyingBolts2d] = useState<
    Array<{ id: number; color: BoltColor; sx: number; sy: number; tx: number; ty: number }>
  >([]);
  const [confettiBurst, setConfettiBurst] = useState<number | null>(null);
  const [tutPos, setTutPos] = useState<{ x: number; y: number } | null>(null);
  const [tutStepsDone, setTutStepsDone] = useState(0);
  const [activeAd, setActiveAd] = useState<ActiveAdModal | null>(null);
  const playableTapsRef = useRef(0);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<BoltScene | null>(null);

  // Mutable refs for instant 3D tap handling without stale closures
  const levelRef = useRef<LevelConfig>(levelConfig);
  const boxesRef = useRef<CollectorBox[]>(activeBoxes);
  const queueRef = useRef<BoltColor[]>(boxQueue);
  const bufferRef = useRef<BoltColor[]>(buffer);
  const maxBufferRef = useRef<number>(maxBufferSlots);
  const boxSeqRef = useRef(1);

  boxesRef.current = activeBoxes;
  queueRef.current = boxQueue;
  bufferRef.current = buffer;
  maxBufferRef.current = maxBufferSlots;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 1800);
  }, []);

  useEffect(() => {
    saveEconomy(economy);
  }, [economy]);

  const initLevel = useCallback((lvlNum: number) => {
    const cfg = generateLevel(lvlNum);
    levelRef.current = cfg;
    setLevelConfig(cfg);

    const initialBoxes: CollectorBox[] = [];
    const q = [...cfg.boxQueue];
    for (let i = 0; i < 2 && q.length > 0; i++) {
      initialBoxes.push({ id: createBoxId(boxSeqRef.current++), color: q.shift()!, filled: 0 });
    }

    boxesRef.current = initialBoxes;
    queueRef.current = q;
    bufferRef.current = [];
    maxBufferRef.current = 5;

    setActiveBoxes(initialBoxes);
    setBoxQueue(q);
    setMaxBoxSlots(2);
    setBuffer([]);
    setMaxBufferSlots(5);
    setBoltsRemaining(cfg.bolts.length);
    setShowWin(false);
    setShowFail(false);

    sceneRef.current?.loadLevel(cfg);
  }, []);

  // Auto-seal completed boxes & drain matching bolts from buffer
  const settleBoxesAndBuffer = useCallback(
    (
      nextBoxes: CollectorBox[],
      nextQueue: BoltColor[],
      nextBuffer: BoltColor[],
      currentMaxBuf: number
    ) => {
      let boxes = nextBoxes.map((b) => ({ ...b }));
      const queue = [...nextQueue];
      let buf = [...nextBuffer];
      let combo = 0;
      let changed = true;

      while (changed) {
        changed = false;

        // 1. Seal any 3/3 full boxes & pull next color from queue
        for (let i = 0; i < boxes.length; i++) {
          if (boxes[i].filled >= 3) {
            combo++;
            sound.playBoxSnap(combo);
            haptics.boxSnap();
            setConfettiBurst(Date.now() + combo);
            setComboText({
              key: Date.now() + combo,
              label: combo >= 3 ? `AMAZING x${combo}!` : combo === 2 ? 'COMBO x2!' : 'PACKED!'
            });
            if (queue.length > 0) {
              boxes[i] = { id: createBoxId(boxSeqRef.current++), color: queue.shift()!, filled: 0 };
            } else {
              boxes.splice(i, 1);
              i--;
            }
            changed = true;
          }
        }

        // 2. Auto-drain matching bolts from buffer into open boxes
        for (let bi = 0; bi < buf.length; bi++) {
          const color = buf[bi];
          const targetBox = boxes.find((bx) => bx.color === color && bx.filled < 3);
          if (targetBox) {
            targetBox.filled++;
            buf.splice(bi, 1);
            bi--;
            changed = true;
          }
        }
      }

      boxesRef.current = boxes;
      queueRef.current = queue;
      bufferRef.current = buf;
      setActiveBoxes(boxes);
      setBoxQueue(queue);
      setBuffer(buf);

      const remBolts = levelRef.current.bolts.filter((b) => !b.removed);
      setBoltsRemaining(remBolts.length);

      // Check WIN
      if (remBolts.length === 0 && buf.length === 0) {
        sound.playWin();
        haptics.win();
        if (IS_PLAYABLE_AD) {
          setShowPlayableCta(true);
          return;
        }
        const cfg = levelRef.current;
        setEconomy((prev) => {
          const nextRaceWins = prev.raceActive ? Math.min(7, prev.raceWins + 1) : prev.raceWins;
          const nextSurvivors = prev.raceActive
            ? RACE_SURVIVOR_CURVE[Math.min(nextRaceWins, RACE_SURVIVOR_CURVE.length - 1)]
            : prev.raceSurvivors;
          const unlocked = prev.unlockedModels.includes(cfg.shape)
            ? prev.unlockedModels
            : [...prev.unlockedModels, cfg.shape];
          const next: EconomyState = {
            ...prev,
            coins: prev.coins + cfg.coinReward,
            streak: prev.streak + 1,
            piggyBankCoins: Math.min(prev.piggyBankMax, prev.piggyBankCoins + 60),
            unlockedModels: unlocked,
            raceWins: nextRaceWins,
            raceSurvivors: nextSurvivors
          };
          return evaluateMilestones({ ...next, level: prev.level + 1 });
        });
        setShowWin(true);
        return;
      }

      // Check FAIL: Buffer is full AND no exposed bolt matches any active box
      if (buf.length >= currentMaxBuf) {
        const activeColors = new Set(boxes.map((bx) => bx.color));
        const hasExposedMatch = remBolts.some(
          (b) => !isBoltOccluded(b, levelRef.current.plates) && activeColors.has(b.color)
        );
        if (!hasExposedMatch) {
          sound.playFail();
          setShowFail(true);
        }
      }
    },
    []
  );

  const handleBoltTap = useCallback(
    (boltId: string) => {
      if (showWin || showFail || showShop || showUa || activeAd) return;
      const cfg = levelRef.current;
      const bolt = cfg.bolts.find((b) => b.id === boltId);
      if (!bolt || bolt.removed) return;

      if (isBoltOccluded(bolt, cfg.plates)) {
        sound.playLocked();
        haptics.locked();
        showToast('Unscrew top plate first!');
        return;
      }

      // Check if bolt can go to an active box or buffer
      const boxes = boxesRef.current.map((b) => ({ ...b }));
      const buf = [...bufferRef.current];
      const matchBox = boxes.find((bx) => bx.color === bolt.color && bx.filled < 3);

      if (!matchBox && buf.length >= maxBufferRef.current) {
        sound.playFail();
        haptics.fail();
        setShowFail(true);
        return;
      }

      // Execute unscrew + launch 2D flying bolt arc toward target crate or buffer well
      const startPt = sceneRef.current?.getBoltScreenPosition(bolt.id);
      const shellRect = shellRef.current?.getBoundingClientRect();
      if (startPt && shellRect) {
        const matchIdx = boxes.findIndex((bx) => bx.color === bolt.color && bx.filled < 3);
        const targetEl =
          matchIdx >= 0
            ? shellRef.current?.querySelector(`[data-crate-idx="${matchIdx}"]`)
            : shellRef.current?.querySelector(`[data-rail-idx="${buf.length}"]`);
        const tRect = targetEl?.getBoundingClientRect();
        if (tRect) {
          const flyId = Date.now() + Math.random();
          setFlyingBolts2d((prev) => [
            ...prev,
            {
              id: flyId,
              color: bolt.color,
              sx: startPt.x - shellRect.left,
              sy: startPt.y - shellRect.top,
              tx: tRect.left + tRect.width / 2 - shellRect.left,
              ty: tRect.top + tRect.height / 2 - shellRect.top
            }
          ]);
          setTimeout(() => {
            setFlyingBolts2d((prev) => prev.filter((f) => f.id !== flyId));
          }, 360);
        }
      }

      bolt.removed = true;
      setTutStepsDone((n) => n + 1);
      sound.playUnscrew();
      haptics.unscrew();
      sceneRef.current?.removeBolt(bolt.id, BOLT_COLORS[bolt.color].hex);

      if (IS_PLAYABLE_AD) {
        playableTapsRef.current += 1;
        if (playableTapsRef.current >= 10) {
          setTimeout(() => setShowPlayableCta(true), 450);
        }
      }

      // Check if parent plate is now freed
      const plate = cfg.plates.find((p) => p.id === bolt.plateId);
      if (plate && !plate.dropped) {
        const stillPinned = plate.boltIds.some((id) => !cfg.bolts.find((b) => b.id === id)?.removed);
        if (!stillPinned) {
          plate.dropped = true;
          sound.playPlateDrop();
          haptics.plateDrop();
          sceneRef.current?.dropPlate(plate.id);
          sceneRef.current?.updateOcclusion(cfg.plates, cfg.bolts);
        }
      }

      if (matchBox) {
        matchBox.filled++;
      } else {
        buf.push(bolt.color);
      }

      settleBoxesAndBuffer(boxes, queueRef.current, buf, maxBufferRef.current);
    },
    [activeAd, settleBoxesAndBuffer, showFail, showShop, showToast, showUa, showWin]
  );

  // Mount Three.js scene once
  const tapCallbackRef = useRef(handleBoltTap);
  tapCallbackRef.current = handleBoltTap;

  useEffect(() => {
    if (!stageRef.current) return;
    const scene = new BoltScene(stageRef.current, (id) => tapCallbackRef.current(id));
    sceneRef.current = scene;
    initLevel(economy.level);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setShowcaseMode(screen === 'menu');
    if (screen === 'menu') {
      sound.setMood('lobby');
    } else if (levelConfig.difficulty !== 'normal') {
      sound.setMood('focus');
    } else {
      sound.setMood(levelConfig.level % 2 === 0 ? 'lounge' : 'sunny');
    }
  }, [screen, levelConfig.level, levelConfig.difficulty]);

  // Position L1 interactive tutorial hand over the first exposed matching bolt
  useEffect(() => {
    if (screen !== 'play' || levelConfig.level !== 1 || tutStepsDone >= 2 || showWin || showFail) {
      setTutPos(null);
      return;
    }
    const timer = setTimeout(() => {
      const cfg = levelRef.current;
      const activeColors = new Set(boxesRef.current.map((b) => b.color));
      const candidate = cfg.bolts.find(
        (b) => !b.removed && !isBoltOccluded(b, cfg.plates) && activeColors.has(b.color)
      );
      const pt = candidate ? sceneRef.current?.getBoltScreenPosition(candidate.id) : null;
      const sRect = shellRef.current?.getBoundingClientRect();
      if (pt && sRect) {
        setTutPos({ x: pt.x - sRect.left, y: pt.y - sRect.top });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [screen, levelConfig.level, tutStepsDone, boltsRemaining, showWin, showFail]);

  // Unlock Web Audio & start cozy BGM on first user tap/click (browser autoplay policy)
  useEffect(() => {
    const onFirstGesture = () => {
      sound.unlockAndStartMusic();
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      sound.stopMusic();
    };
  }, []);

  const triggerAd = (type: 'rv' | 'inter', placement: string, onComplete: () => void) => {
    setActiveAd({
      type,
      placement,
      onComplete: () => {
        setActiveAd(null);
        setEconomy((prev) => recordAdImpression(prev, type));
        onComplete();
      }
    });
  };

  // Unlock extra Collector Box (RV)
  const handleUnlockExtraBox = () => {
    if (maxBoxSlots >= 4) return;
    triggerAd('rv', 'Unlock Extra Collector Box', () => {
      const q = [...queueRef.current];
      const boxes = [...boxesRef.current];
      if (q.length > 0) {
        boxes.push({ id: createBoxId(boxSeqRef.current++), color: q.shift()!, filled: 0 });
      }
      setMaxBoxSlots((m) => Math.min(4, m + 1));
      settleBoxesAndBuffer(boxes, q, bufferRef.current, maxBufferRef.current);
      showToast('+1 Collector Box unlocked!');
    });
  };

  // Booster 1: +1 Buffer Slot
  const handleAddSlot = (useRv: boolean) => {
    if (maxBufferSlots >= 7) return;
    const apply = () => {
      const nextMax = Math.min(7, maxBufferRef.current + 1);
      maxBufferRef.current = nextMax;
      setMaxBufferSlots(nextMax);
      showToast('+1 Buffer Slot unlocked!');
    };
    if (useRv) {
      triggerAd('rv', 'Booster: +1 Buffer Slot', apply);
    } else if (economy.coins >= BOOSTER_COSTS.extraSlot) {
      setEconomy((prev) => ({ ...prev, coins: prev.coins - BOOSTER_COSTS.extraSlot }));
      apply();
    }
  };

  // Booster 2: Auto-Fill Magnet (fills first active box immediately from exposed/buffer bolts)
  const handleMagnet = (useRv: boolean) => {
    const apply = () => {
      const boxes = boxesRef.current.map((b) => ({ ...b }));
      const buf = [...bufferRef.current];
      const cfg = levelRef.current;
      const targetBox = boxes[0];
      if (!targetBox) return;

      let needed = 3 - targetBox.filled;
      // Pull from buffer first
      for (let i = buf.length - 1; i >= 0 && needed > 0; i--) {
        if (buf[i] === targetBox.color) {
          buf.splice(i, 1);
          targetBox.filled++;
          needed--;
        }
      }
      // Pull matching bolts directly from board (even occluded ones!)
      for (const b of cfg.bolts) {
        if (needed <= 0) break;
        if (!b.removed && b.color === targetBox.color) {
          b.removed = true;
          targetBox.filled++;
          needed--;
          sceneRef.current?.removeBolt(b.id, BOLT_COLORS[b.color].hex);
          const plate = cfg.plates.find((p) => p.id === b.plateId);
          if (plate && !plate.dropped) {
            const pinned = plate.boltIds.some((id) => !cfg.bolts.find((x) => x.id === id)?.removed);
            if (!pinned) {
              plate.dropped = true;
              sceneRef.current?.dropPlate(plate.id);
            }
          }
        }
      }
      sceneRef.current?.updateOcclusion(cfg.plates, cfg.bolts);
      settleBoxesAndBuffer(boxes, queueRef.current, buf, maxBufferRef.current);
      showToast('Magnet auto-filled box!');
    };

    if (useRv) {
      triggerAd('rv', 'Booster: Auto-Fill Magnet', apply);
    } else if (economy.coins >= BOOSTER_COSTS.magnet) {
      setEconomy((prev) => ({ ...prev, coins: prev.coins - BOOSTER_COSTS.magnet }));
      apply();
    }
  };

  // Booster 3: Clear Tray (rescues up to 3 buffer bolts directly into matching boxes or vaults them)
  const handleClearTray = (useRv: boolean) => {
    if (bufferRef.current.length === 0) return;
    const apply = () => {
      const buf = [...bufferRef.current];
      const removed = buf.splice(0, Math.min(3, buf.length));
      // Add freed bolts back to a bonus completed state so level stays completable:
      // Actually remove 1 box's worth or return them to matching future boxes by auto-filling their color!
      // Cleanest fair rescue: expand buffer by +1 if needed OR match them directly into queue boxes
      const q = [...queueRef.current];
      const boxes = boxesRef.current.map((b) => ({ ...b }));
      const keptBuf: BoltColor[] = [];
      removed.forEach((col) => {
        const b = boxes.find((x) => x.color === col && x.filled < 3);
        if (b) {
          b.filled++;
        } else {
          const qi = q.indexOf(col);
          if (qi >= 0 && boxes.length < 4) {
            boxes.push({ id: createBoxId(boxSeqRef.current++), color: q.splice(qi, 1)[0], filled: 1 });
          } else {
            keptBuf.push(col);
          }
        }
      });
      setMaxBoxSlots((m) => Math.max(m, Math.min(4, boxes.length)));
      settleBoxesAndBuffer(boxes, q, [...keptBuf, ...buf], maxBufferRef.current);
      showToast('Cleared 3 tray bolts!');
    };

    if (useRv) {
      triggerAd('rv', 'Booster: Clear Tray Rescue', apply);
    } else if (economy.coins >= BOOSTER_COSTS.clearTray) {
      setEconomy((prev) => ({ ...prev, coins: prev.coins - BOOSTER_COSTS.clearTray }));
      apply();
    }
  };

  const handleNextLevel = () => {
    const nextLvl = economy.level; // already incremented on win
    setShowWin(false);
    // Show interstitial after Level 5 if user hasn't bought No-Ads
    if (nextLvl > 5 && !economy.noAds) {
      triggerAd('inter', `Post-Level ${nextLvl - 1} Interstitial`, () => initLevel(nextLvl));
    } else {
      initLevel(nextLvl);
    }
  };

  const handleRevive = (viaRv: boolean) => {
    const doRevive = () => {
      setShowFail(false);
      // Expand buffer by 1 AND rescue 2 bolts
      const nextMax = Math.min(7, maxBufferRef.current + 1);
      maxBufferRef.current = nextMax;
      setMaxBufferSlots(nextMax);
      handleClearTray(false);
    };
    if (viaRv) {
      triggerAd('rv', 'Out-of-Space Revive', () => {
        setShowFail(false);
        const nextMax = Math.min(7, maxBufferRef.current + 1);
        maxBufferRef.current = nextMax;
        setMaxBufferSlots(nextMax);
        const buf = [...bufferRef.current];
        const q = [...queueRef.current];
        const boxes = boxesRef.current.map((b) => ({ ...b }));
        const rescued = buf.splice(0, Math.min(2, buf.length));
        rescued.forEach((col) => {
          const qi = q.indexOf(col);
          if (qi >= 0 && boxes.length < 4) {
            boxes.push({ id: createBoxId(boxSeqRef.current++), color: q.splice(qi, 1)[0], filled: 1 });
          }
        });
        setMaxBoxSlots((m) => Math.max(m, Math.min(4, boxes.length)));
        settleBoxesAndBuffer(boxes, q, buf, nextMax);
        showToast('Revived! +1 Slot & Tray Cleared');
      });
    } else if (economy.coins >= BOOSTER_COSTS.revive) {
      setEconomy((prev) => ({ ...prev, coins: prev.coins - BOOSTER_COSTS.revive }));
      doRevive();
    }
  };

  const handleBuySku = (skuId: string) => {
    setEconomy((prev) => recordIapPurchase(prev, skuId));
    showToast('Purchase verified! S2S receipt logged.');
    if (showFail && skuId === 'starter_no_ads') {
      setShowFail(false);
      const nextMax = Math.min(7, maxBufferRef.current + 1);
      maxBufferRef.current = nextMax;
      setMaxBufferSlots(nextMax);
    }
  };

  const handleGiveUp = () => {
    setShowFail(false);
    setEconomy((prev) => ({
      ...prev,
      hearts: Math.max(1, prev.hearts - 1),
      streak: prev.seasonPassOwned ? prev.streak : 0,
      raceActive: prev.seasonPassOwned ? prev.raceActive : false,
      raceWins: prev.seasonPassOwned ? prev.raceWins : 0
    }));
    initLevel(levelConfig.level);
  };

  const handleJumpLevel = (lvl: number) => {
    setEconomy((prev) =>
      evaluateMilestones({
        ...prev,
        level: lvl,
        usedDebugJump: true
      })
    );
    initLevel(lvl);
    showToast(`Jumped to Level ${lvl}`);
  };

  return (
    <div className="app-viewport">
      <div className="phone-shell" ref={shellRef}>
        {screen === 'play' && (
          <>
            <TopHud
              economy={economy}
              difficulty={levelConfig.difficulty}
              muted={muted}
              onToggleMute={() => {
                sound.muted = !muted;
                setMuted(!muted);
              }}
              onRestart={() => initLevel(levelConfig.level)}
              onOpenHome={() => setScreen('menu')}
              onOpenShop={() => setShowShop(true)}
              onOpenLevels={() => setShowLevels(true)}
              onOpenUa={() => setShowUa(true)}
            />

            <CollectorDock
              activeBoxes={activeBoxes}
              maxBoxSlots={maxBoxSlots}
              buffer={buffer}
              maxBufferSlots={maxBufferSlots}
              onUnlockExtraBox={handleUnlockExtraBox}
              onUnlockExtraSlot={() => handleAddSlot(economy.coins < BOOSTER_COSTS.extraSlot)}
            />
          </>
        )}

        <div className="stage-wrap">
          <div ref={stageRef} className="stage-canvas" />
          {screen === 'play' && (
            <>
              <div className="stage-top-bar">
                <div className="stage-title-chip">{levelConfig.title}</div>
                {economy.streak > 0 && (
                  <div className="streak-chip">
                    <Flame size={12} fill="#f59e0b" /> {economy.streak}
                  </div>
                )}
              </div>
              {comboText && (
                <div key={comboText.key} className="combo-pop">
                  {comboText.label}
                </div>
              )}
              <div className="orbit-bar">
                <button
                  className="orbit-btn"
                  onClick={() => sceneRef.current?.rotateBy(-Math.PI / 2)}
                  aria-label="Rotate Left 90 degrees"
                  title="Rotate Left 90°"
                >
                  <RotateCcw size={14} strokeWidth={2.5} />
                </button>
                <div className="orbit-progress">
                  <div className="prog-track">
                    <div
                      className="prog-fill"
                      style={{
                        width: `${
                          levelConfig.bolts.length > 0
                            ? Math.round(((levelConfig.bolts.length - boltsRemaining) / levelConfig.bolts.length) * 100)
                            : 0
                        }%`
                      }}
                    />
                  </div>
                  <span className="prog-num">
                    {levelConfig.bolts.length - boltsRemaining}/{levelConfig.bolts.length}
                  </span>
                </div>
                <button
                  className="orbit-btn"
                  onClick={() => sceneRef.current?.rotateBy(Math.PI / 2)}
                  aria-label="Rotate Right 90 degrees"
                  title="Rotate Right 90°"
                >
                  <RotateCw size={14} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>

        {screen === 'play' && (
          <BoosterBar
            coins={economy.coins}
            canAddSlot={maxBufferSlots < 7}
            canClearTray={buffer.length > 0}
            onAddSlot={handleAddSlot}
            onMagnet={handleMagnet}
            onClearTray={handleClearTray}
          />
        )}

        {screen === 'menu' && (
          <MainMenu
            economy={economy}
            muted={muted}
            onToggleMute={() => {
              const next = !muted;
              sound.muted = next;
              setMuted(next);
            }}
            onPlayLevel={(lvl) => {
              sound.unlockAndStartMusic();
              setEconomy((prev) => ({ ...prev, level: lvl }));
              initLevel(lvl);
              setScreen('play');
            }}
            onPreviewShape={(lvl) => {
              initLevel(lvl);
              showToast(`Inspecting LV.${lvl} 3D Model`);
            }}
            onBuySku={handleBuySku}
            onOpenDaily={() => setShowDaily(true)}
            onOpenRace={() => setShowRace(true)}
            onOpenUa={() => setShowUa(true)}
          />
        )}

        {/* Flying 2D Bolt Arcs (from 3D screw -> Crate / Buffer Well) */}
        {flyingBolts2d.map((fb) => (
          <div
            key={fb.id}
            className="flying-bolt-2d"
            style={{
              ['--sx' as string]: `${fb.sx}px`,
              ['--sy' as string]: `${fb.sy}px`,
              ['--tx' as string]: `${fb.tx}px`,
              ['--ty' as string]: `${fb.ty}px`
            }}
          >
            <HexBoltIcon color={fb.color} size={28} />
          </div>
        ))}

        {/* Confetti Burst on Crate Seal */}
        {confettiBurst && (
          <div key={confettiBurst} className="confetti-layer">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="confetti-bit"
                style={{
                  left: `${18 + (i * 5) % 64}%`,
                  background: ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7', '#f97316'][i % 6],
                  animationDelay: `${(i % 4) * 35}ms`,
                  ['--dx' as string]: `${(i % 2 === 0 ? 1 : -1) * (18 + (i * 9) % 45)}px`
                }}
              />
            ))}
          </div>
        )}

        {/* Level 1 Interactive Tutorial Hand */}
        {tutPos && (
          <div className="tut-hand-wrap" style={{ left: tutPos.x, top: tutPos.y }}>
            <div className="tut-ring" />
            <div className="tut-pointer">👆</div>
            <div className="tut-tip">Tap matching bolt!</div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        {showWin && (
          <WinModal
            level={levelConfig.level}
            coinReward={levelConfig.coinReward}
            streak={economy.streak}
            piggyCoins={economy.piggyBankCoins}
            piggyMax={economy.piggyBankMax}
            onNextLevel={handleNextLevel}
            onDoubleCoinsRv={() =>
              triggerAd('rv', 'Win Screen 2x Coins', () => {
                setEconomy((prev) => ({ ...prev, coins: prev.coins + levelConfig.coinReward }));
                handleNextLevel();
              })
            }
            onOpenShop={() => {
              setShowWin(false);
              setShowShop(true);
            }}
          />
        )}

        {showFail && (
          <FailModal
            coins={economy.coins}
            streak={economy.streak}
            noAds={economy.noAds}
            onReviveRv={() => handleRevive(true)}
            onReviveCoins={() => handleRevive(false)}
            onBuyStarter={() => handleBuySku('starter_no_ads')}
            onGiveUp={handleGiveUp}
          />
        )}

        {showShop && (
          <ShopModal economy={economy} onBuySku={handleBuySku} onClose={() => setShowShop(false)} />
        )}

        {showLevels && (
          <LevelSelectModal
            currentLevel={levelConfig.level}
            onSelectLevel={(lvl) => {
              setEconomy((prev) => ({ ...prev, level: lvl }));
              initLevel(lvl);
              showToast(`Loaded Level ${lvl}`);
            }}
            onClose={() => setShowLevels(false)}
          />
        )}

        {showDaily && (
          <DailyRewardsModal
            economy={economy}
            onClaim={(coins) => {
              setEconomy((prev) => ({
                ...prev,
                coins: prev.coins + coins,
                dailyDay: (prev.dailyDay % 7) + 1,
                lastDailyClaimDate: getTodayKey()
              }));
              sound.playWin();
              showToast(`+${coins} Daily Bonus Coins!`);
              setShowDaily(false);
            }}
            onClose={() => setShowDaily(false)}
          />
        )}

        {showRace && (
          <StreakRaceModal
            economy={economy}
            onClaimGrandPrize={(share) => {
              setEconomy((prev) => ({
                ...prev,
                coins: prev.coins + share,
                raceActive: true,
                raceWins: 0,
                raceSurvivors: 100
              }));
              sound.playWin();
              showToast(`Bolt Rush Won! +${share} Coins!`);
              setShowRace(false);
            }}
            onRestartRace={() => {
              setEconomy((prev) => ({
                ...prev,
                raceActive: true,
                raceWins: 0,
                raceSurvivors: 100
              }));
              showToast('New Bolt Rush Race started!');
            }}
            onClose={() => setShowRace(false)}
          />
        )}

        {showUa && (
          <UaTelemetryDrawer
            economy={economy}
            onClose={() => setShowUa(false)}
            onChangeGeo={(g: GeoPresetId) => setEconomy((prev) => switchGeoPreset(prev, g))}
            onToggleStoreFee={() =>
              setEconomy((prev) => ({ ...prev, storeFeeRate: prev.storeFeeRate === 0.15 ? 0.3 : 0.15 }))
            }
            onJumpLevel={handleJumpLevel}
            onResetEconomy={() => {
              const fresh = createInitialEconomy();
              setEconomy(fresh);
              initLevel(1);
              setShowUa(false);
              showToast('Save reset to Level 1');
            }}
          />
        )}

        {activeAd && <MockAdOverlay ad={activeAd} geoId={economy.geoPreset} />}

        {showPlayableCta && (
          <div className="modal-backdrop" style={{ zIndex: 80 }}>
            <div className="modal-card" style={{ borderColor: '#22c55e', textAlign: 'center' }}>
              <div className="modal-title">Bolt &amp; Box 3D</div>
              <div className="modal-sub">
                Can you beat Level 5? Download now for 100+ 3D puzzles &amp; daily streak rewards!
              </div>
              <button className="btn-primary" onClick={openStoreCta}>
                INSTALL FREE NOW →
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowPlayableCta(false);
                  playableTapsRef.current = 0;
                  initLevel(1);
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
