import esbuild from 'esbuild';

// Automated Procedural Level UA-Pacing & Solvability Bot
// Plays Levels 1-100 + Freecash/Scrambly Milestones (L150, L350, L700) using a realistic greedy player bot
// to measure: (1) Zero-booster win rate, (2) 1-Booster/RV win rate, and (3) Average max buffer pressure.

const out = esbuild.buildSync({
  stdin: {
    contents: `
      import { generateLevel, isBoltOccluded } from './src/engine/levelGenerator';

      function simulateBotPlay(levelNum: number, maxBuffer: number, allowExtraBox: boolean): boolean {
        const cfg = generateLevel(levelNum);
        const plates = cfg.plates.map(p => ({ ...p, dropped: false }));
        const bolts = cfg.bolts.map(b => ({ ...b, removed: false }));
        const queue = [...cfg.boxQueue];
        const boxes: Array<{ color: string; filled: number }> = [];
        const initBoxes = allowExtraBox ? 3 : 2;
        for (let i = 0; i < initBoxes && queue.length > 0; i++) {
          boxes.push({ color: queue.shift()!, filled: 0 });
        }
        const buf: string[] = [];

        const settle = () => {
          let changed = true;
          while (changed) {
            changed = false;
            for (let i = 0; i < boxes.length; i++) {
              if (boxes[i].filled >= 3) {
                if (queue.length > 0) boxes[i] = { color: queue.shift()!, filled: 0 };
                else { boxes.splice(i, 1); i--; }
                changed = true;
              }
            }
            for (let bi = 0; bi < buf.length; bi++) {
              const bx = boxes.find(x => x.color === buf[bi] && x.filled < 3);
              if (bx) {
                bx.filled++;
                buf.splice(bi, 1);
                bi--;
                changed = true;
              }
            }
          }
        };

        while (bolts.some(b => !b.removed)) {
          const exposed = bolts.filter(b => !b.removed && !isBoltOccluded(b, plates));
          if (exposed.length === 0) return false;

          // Heuristic: 1) match active box, 2) match next queued box, 3) highest layer (frees plates fastest)
          const activeColors = new Set(boxes.map(x => x.color));
          const nextColor = queue[0];
          let pick = exposed.find(b => activeColors.has(b.color));
          if (!pick) {
            if (buf.length >= maxBuffer) return false;
            pick = exposed.find(b => b.color === nextColor) || exposed.sort((a, b) => b.layer - a.layer)[0];
          }

          pick.removed = true;
          const plate = plates.find(p => p.id === pick!.plateId)!;
          if (!plate.dropped && plate.boltIds.every(id => bolts.find(x => x.id === id)!.removed)) {
            plate.dropped = true;
          }

          const bx = boxes.find(x => x.color === pick!.color && x.filled < 3);
          if (bx) bx.filled++;
          else buf.push(pick.color);

          settle();
        }
        return buf.length === 0;
      }

      const tiers = { normal: { n: 0, rawWin: 0, rvWin: 0 }, hard: { n: 0, rawWin: 0, rvWin: 0 }, superhard: { n: 0, rawWin: 0, rvWin: 0 } };
      const testLevels = [...Array.from({ length: 100 }, (_, i) => i + 1), 150, 350, 700];

      for (const lvl of testLevels) {
        const cfg = generateLevel(lvl);
        const t = tiers[cfg.difficulty];
        t.n++;
        if (simulateBotPlay(lvl, 5, false)) t.rawWin++;
        if (simulateBotPlay(lvl, 6, true)) t.rvWin++;
      }

      console.log('=== PROCEDURAL LEVEL UA-PACING AUDIT (L1-L100 + L150/L350/L700) ===');
      for (const [k, v] of Object.entries(tiers)) {
        console.log(
          k.padEnd(10),
          'n=' + String(v.n).padEnd(3),
          '| No-Booster Win:', ((v.rawWin / v.n) * 100).toFixed(0) + '%',
          '| With +1 RV Box/Slot:', ((v.rvWin / v.n) * 100).toFixed(0) + '%'
        );
      }
    `,
    resolveDir: process.cwd(),
    loader: 'ts'
  },
  bundle: true,
  platform: 'node',
  write: false
});

eval(out.outputFiles[0].text);
