import { BoltColor, BoltData, ChassisShape, DifficultyTag, FaceId, LevelConfig, PlateData } from './types';

const ALL_COLORS: BoltColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
const PLATE_TINTS = ['#38bdf8', '#fb7185', '#a78bfa', '#34d399', '#fbbf24', '#fb923c', '#60a5fa'];

export interface LevelMeta {
  level: number;
  title: string;
  shape: ChassisShape;
  difficulty: DifficultyTag;
  colorCount: number;
  cpeTag?: string;
}

export const CPE_MILESTONE_LEVELS: Record<number, string> = {
  10: 'CPE $0.25',
  50: 'CPE $1.00',
  150: 'CPE $3.00',
  350: 'CPE $7.00',
  700: 'CPE $18.00'
};

export const HANDCRAFTED_LEVELS: LevelMeta[] = [
  { level: 1, title: 'Wooden Toy Block', shape: 'cube', difficulty: 'normal', colorCount: 2 },
  { level: 2, title: 'Cozy Mini House', shape: 'house', difficulty: 'normal', colorCount: 3 },
  { level: 3, title: 'Star Rocket', shape: 'rocket', difficulty: 'normal', colorCount: 3 },
  { level: 4, title: 'Retro Arcade', shape: 'arcade', difficulty: 'normal', colorCount: 4 },
  { level: 5, title: 'Mecha Bot', shape: 'robot', difficulty: 'hard', colorCount: 5 },
  { level: 6, title: 'Golden Pyramid', shape: 'pyramid', difficulty: 'normal', colorCount: 4 },
  { level: 7, title: 'Harbor Lighthouse', shape: 'tower', difficulty: 'normal', colorCount: 5 },
  { level: 8, title: 'Pirate Chest', shape: 'chest', difficulty: 'normal', colorCount: 5 },
  { level: 9, title: 'Royal Castle', shape: 'castle', difficulty: 'normal', colorCount: 5 },
  { level: 10, title: 'Titan Vault', shape: 'vault', difficulty: 'superhard', colorCount: 6, cpeTag: 'CPE $0.25' }
];

export function getLevelMeta(level: number): LevelMeta {
  if (level <= HANDCRAFTED_LEVELS.length) return HANDCRAFTED_LEVELS[level - 1];
  const base = HANDCRAFTED_LEVELS[(level - 1) % HANDCRAFTED_LEVELS.length];
  const tier = Math.floor((level - 1) / 10) + 1;
  const difficulty = getDifficultyForLevel(level);
  const colorCount =
    difficulty === 'superhard'
      ? Math.min(7, 6 + Math.floor(level / 40))
      : difficulty === 'hard'
        ? Math.min(6, 5 + Math.floor(level / 30))
        : Math.min(6, 4 + Math.floor(level / 12));
  return {
    level,
    title: `${base.title} Mk.${tier}`,
    shape: base.shape,
    difficulty,
    colorCount,
    cpeTag: CPE_MILESTONE_LEVELS[level]
  };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isBoltOccluded(bolt: BoltData, plates: PlateData[]): boolean {
  if (bolt.removed) return false;
  for (const p of plates) {
    if (p.dropped) continue;
    if (p.face !== bolt.face) continue;
    if (p.layer <= bolt.layer) continue;
    const halfW = p.w / 2 + 0.04;
    const halfH = p.h / 2 + 0.04;
    if (Math.abs(bolt.u - p.u) <= halfW && Math.abs(bolt.v - p.v) <= halfH) {
      return true;
    }
  }
  return false;
}

export function getDifficultyForLevel(level: number): DifficultyTag {
  if (level >= 10 && level % 10 === 0) return 'superhard';
  if (level >= 5 && level % 5 === 0) return 'hard';
  return 'normal';
}

interface RawPlateSpec {
  face: FaceId;
  layer: number;
  u: number;
  v: number;
  w: number;
  h: number;
  bolts: Array<[number, number]>;
}

// 4 distinct face-layout archetypes so procedural levels (L1-L700+) stay fresh and varied
function buildFacePlates(face: FaceId, archetype: number, addLayer2: boolean): RawPlateSpec[] {
  const res: RawPlateSpec[] = [];

  if (archetype === 0) {
    // Classic Horizontal Bars + Twin Vertical Pillars
    res.push(
      { face, layer: 0, u: 0, v: 0.54, w: 1.74, h: 0.62, bolts: [[-0.6, 0.54], [0, 0.54], [0.6, 0.54]] },
      { face, layer: 0, u: 0, v: -0.54, w: 1.74, h: 0.62, bolts: [[-0.6, -0.54], [0, -0.54], [0.6, -0.54]] },
      { face, layer: 1, u: -0.44, v: 0, w: 0.7, h: 1.5, bolts: [[-0.44, 0.48], [-0.44, 0], [-0.44, -0.48]] },
      { face, layer: 1, u: 0.44, v: 0, w: 0.7, h: 1.5, bolts: [[0.44, 0.48], [0.44, 0], [0.44, -0.48]] }
    );
  } else if (archetype === 1) {
    // Wide Base + Center Shield Window
    res.push(
      { face, layer: 0, u: 0, v: 0.52, w: 1.74, h: 0.64, bolts: [[-0.6, 0.52], [0, 0.52], [0.6, 0.52]] },
      { face, layer: 0, u: 0, v: -0.52, w: 1.74, h: 0.64, bolts: [[-0.6, -0.52], [0, -0.52], [0.6, -0.52]] },
      { face, layer: 1, u: 0, v: 0, w: 1.44, h: 1.42, bolts: [[-0.46, 0.44], [0.46, 0.44], [0, -0.44]] }
    );
  } else if (archetype === 2) {
    // Vertical Base Pillars + Horizontal Crossbar Lock
    res.push(
      { face, layer: 0, u: -0.52, v: 0, w: 0.64, h: 1.72, bolts: [[-0.52, 0.58], [-0.52, 0], [-0.52, -0.58]] },
      { face, layer: 0, u: 0.52, v: 0, w: 0.64, h: 1.72, bolts: [[0.52, 0.58], [0.52, 0], [0.52, -0.58]] },
      { face, layer: 1, u: 0, v: 0.42, w: 1.56, h: 0.66, bolts: [[-0.52, 0.42], [0, 0.42], [0.52, 0.42]] },
      { face, layer: 1, u: 0, v: -0.42, w: 1.56, h: 0.66, bolts: [[-0.52, -0.42], [0, -0.42], [0.52, -0.42]] }
    );
  } else {
    // Staggered Bricks (asymmetric visual silhouette)
    res.push(
      { face, layer: 0, u: -0.18, v: 0.54, w: 1.48, h: 0.6, bolts: [[-0.66, 0.54], [-0.18, 0.54], [0.3, 0.54]] },
      { face, layer: 0, u: 0.18, v: -0.54, w: 1.48, h: 0.6, bolts: [[-0.3, -0.54], [0.18, -0.54], [0.66, -0.54]] },
      { face, layer: 1, u: 0, v: 0.04, w: 1.38, h: 1.24, bolts: [[-0.44, 0.36], [0.44, 0.36], [0, -0.34]] }
    );
  }

  if (addLayer2) {
    res.push({
      face,
      layer: 2,
      u: 0,
      v: 0,
      w: 1.06,
      h: 0.96,
      bolts: [[-0.34, 0.26], [0.34, 0.26], [0, -0.26]]
    });
  }

  return res;
}

function buildGeometrySpec(level: number, rand: () => number): {
  rawPlates: RawPlateSpec[];
  meta: LevelMeta;
} {
  const meta = getLevelMeta(level);

  if (level === 1) {
    return {
      meta,
      rawPlates: [
        { face: 'front', layer: 0, u: 0, v: 0.48, w: 1.72, h: 0.68, bolts: [[-0.58, 0.48], [0, 0.48], [0.58, 0.48]] },
        { face: 'front', layer: 0, u: 0, v: -0.48, w: 1.72, h: 0.68, bolts: [[-0.58, -0.48], [0, -0.48], [0.58, -0.48]] },
        { face: 'front', layer: 1, u: -0.38, v: 0, w: 0.82, h: 1.38, bolts: [[-0.38, 0.45], [-0.38, 0], [-0.38, -0.45]] },
        { face: 'front', layer: 1, u: 0.38, v: 0, w: 0.82, h: 1.38, bolts: [[0.38, 0.45], [0.38, 0], [0.38, -0.45]] }
      ]
    };
  }

  if (level === 2) {
    return {
      meta,
      rawPlates: [
        ...buildFacePlates('front', 1, false),
        ...buildFacePlates('right', 3, false)
      ]
    };
  }

  const faces: FaceId[] = level === 3 ? ['front', 'right', 'left'] : ['front', 'right', 'back', 'left'];
  const addLayer2 = meta.difficulty === 'superhard' || (meta.difficulty === 'hard' && level >= 25);
  const rawPlates: RawPlateSpec[] = [];

  faces.forEach((face, idx) => {
    const archetype =
      meta.difficulty === 'hard' || meta.difficulty === 'superhard'
        ? (idx + level) % 2 === 0
          ? 0
          : 2
        : Math.floor((level + idx + rand() * 2) % 4);
    rawPlates.push(...buildFacePlates(face, archetype, addLayer2));
  });

  return { meta, rawPlates };
}

export function generateLevel(level: number): LevelConfig {
  const rand = mulberry32(level * 2654435761 + 1013904223);
  const { rawPlates, meta } = buildGeometrySpec(level, rand);

  const plates: PlateData[] = [];
  const bolts: BoltData[] = [];
  let boltIdx = 0;

  rawPlates.forEach((rp, pIdx) => {
    const plateId = `p_${level}_${pIdx}`;
    const boltIds: string[] = [];
    rp.bolts.forEach(([u, v]) => {
      const bId = `b_${level}_${boltIdx++}`;
      boltIds.push(bId);
      bolts.push({
        id: bId,
        plateId,
        face: rp.face,
        layer: rp.layer,
        u,
        v,
        color: 'red',
        removed: false
      });
    });
    plates.push({
      id: plateId,
      face: rp.face,
      layer: rp.layer,
      u: rp.u,
      v: rp.v,
      w: rp.w,
      h: rp.h,
      tint: PLATE_TINTS[(pIdx + level * 2) % PLATE_TINTS.length],
      boltIds,
      dropped: false
    });
  });

  const totalBoxes = Math.floor(bolts.length / 3);
  const palette = ALL_COLORS.slice(0, meta.colorCount);

  const boxQueue: BoltColor[] = [];
  for (let i = 0; i < totalBoxes; i++) {
    boxQueue.push(palette[i % palette.length]);
  }
  for (let i = boxQueue.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [boxQueue[i], boxQueue[j]] = [boxQueue[j], boxQueue[i]];
  }

  const colorPool: BoltColor[] = [];
  boxQueue.forEach((c) => colorPool.push(c, c, c));

  const sortedBolts = [...bolts].sort((a, b) => {
    const occA = isBoltOccluded(a, plates) ? 1 : 0;
    const occB = isBoltOccluded(b, plates) ? 1 : 0;
    if (occA !== occB) return occA - occB;
    if (b.layer !== a.layer) return b.layer - a.layer;
    return rand() - 0.5;
  });

  // UA-calibrated difficulty tension curve:
  // L1-L2: smooth onboarding (window 2)
  // Normal: gentle flow (window 5)
  // Hard (every 5th): buffer pressure drives RV/Starter Pack (window 9)
  // Super Hard (every 10th & CPE walls): high tension (window 13)
  const scrambleWindow =
    meta.difficulty === 'superhard' ? 13 : meta.difficulty === 'hard' ? 9 : level <= 2 ? 2 : 5;

  const assignedColors = [...colorPool];
  for (let i = 0; i < assignedColors.length; i++) {
    if (i < 5) continue;
    const maxSwap = Math.min(assignedColors.length - 1, i + scrambleWindow);
    const swapIdx = i + Math.floor(rand() * (maxSwap - i + 1));
    [assignedColors[i], assignedColors[swapIdx]] = [assignedColors[swapIdx], assignedColors[i]];
  }

  sortedBolts.forEach((b, idx) => {
    b.color = assignedColors[idx];
  });

  const coinReward = meta.difficulty === 'superhard' ? 80 : meta.difficulty === 'hard' ? 55 : 35;

  return {
    level,
    title: meta.title,
    shape: meta.shape,
    difficulty: meta.difficulty,
    plates,
    bolts,
    boxQueue,
    coinReward
  };
}
