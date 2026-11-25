import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BOLT_COLORS } from '../economy/config';
import { isBoltOccluded } from './levelGenerator';
import { BoltData, ChassisShape, FaceId, LevelConfig, PlateData } from './types';

interface FlyingBolt {
  mesh: THREE.Group;
  vel: THREE.Vector3;
  spin: number;
  life: number;
}

interface FallingPlate {
  mesh: THREE.Group;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

const CHASSIS_HALF = 1.05;

function faceTransform(
  face: FaceId,
  u: number,
  v: number,
  offset: number
): { pos: THREE.Vector3; quat: THREE.Quaternion; normal: THREE.Vector3 } {
  const q = new THREE.Quaternion();
  const n = new THREE.Vector3();
  const p = new THREE.Vector3();
  const d = CHASSIS_HALF + offset;

  switch (face) {
    case 'front':
      p.set(u, v, d);
      n.set(0, 0, 1);
      break;
    case 'back':
      p.set(-u, v, -d);
      n.set(0, 0, -1);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      break;
    case 'right':
      p.set(d, v, -u);
      n.set(1, 0, 0);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
      break;
    case 'left':
      p.set(-d, v, u);
      n.set(-1, 0, 0);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
      break;
  }
  return { pos: p, quat: q, normal: n };
}

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export class BoltScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pivot: THREE.Group;
  private chassisGroup: THREE.Group;
  private animatedParts: THREE.Object3D[] = [];
  private pmrem: THREE.PMREMGenerator;
  private envRT: THREE.WebGLRenderTarget;
  private raycaster = new THREE.Raycaster();
  private elapsedTime = 0;

  private plateMeshes = new Map<string, THREE.Group>();
  private boltMeshes = new Map<
    string,
    { group: THREE.Group; headMat: THREE.MeshStandardMaterial; normal: THREE.Vector3 }
  >();
  private hintBoltId: string | null = null;
  private levelDisposables: Array<{ dispose: () => void }> = [];
  private flyingBolts: FlyingBolt[] = [];
  private fallingPlates: FallingPlate[] = [];
  private particles: Particle[] = [];

  private theta = 0.42;
  private targetTheta: number | null = null;
  private phi = 0.28;
  private velTheta = 0;
  private velPhi = 0;
  private dragging = false;
  private showcaseMode = false;
  private pointerDownPos = { x: 0, y: 0 };
  private lastPointerPos = { x: 0, y: 0 };
  private shakeTime = 0;

  private rafId = 0;
  private clock = new THREE.Clock();
  private onBoltClick: (boltId: string) => void;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, onBoltClick: (boltId: string) => void) {
    this.container = container;
    this.onBoltClick = onBoltClick;

    this.scene = new THREE.Scene();

    const w = Math.max(container.clientWidth, 300);
    const h = Math.max(container.clientHeight, 300);
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 0.42, 6.75);
    this.updateCameraFraming(w, h);
    this.camera.lookAt(0, 0.08, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;

    const hemi = new THREE.HemisphereLight(0xffffff, 0xbfdbfe, 0.92);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfffbeb, 1.38);
    key.position.set(4.5, 7.5, 6.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x93c5fd, 0.58);
    fill.position.set(-5, 2, -4);
    this.scene.add(fill);

    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.85, 32),
      new THREE.MeshBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.13 })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.set(0, -1.85, 0);
    this.scene.add(shadowDisc);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this.chassisGroup = new THREE.Group();
    this.pivot.add(this.chassisGroup);

    this.buildChassis('cube');

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    window.addEventListener('resize', this.onWindowResize);

    this.animate();
  }

  private onWindowResize = () => {
    this.handleResize();
  };

  public setShowcaseMode(enabled: boolean) {
    this.showcaseMode = enabled;
    if (enabled) {
      this.targetTheta = null;
      this.phi = 0.24;
    }
  }

  public setHintBolt(boltId: string | null) {
    if (this.hintBoltId && this.hintBoltId !== boltId) {
      const prev = this.boltMeshes.get(this.hintBoltId);
      if (prev) {
        prev.group.scale.setScalar(1.02);
        prev.headMat.emissiveIntensity = 0.16;
      }
    }
    this.hintBoltId = boltId;
  }

  private disposeLevelResources() {
    for (const d of this.levelDisposables) {
      try {
        d.dispose();
      } catch {
        // ignore already disposed
      }
    }
    this.levelDisposables = [];
  }

  public rotateBy(deltaRad: number) {
    this.velTheta = 0;
    this.targetTheta = (this.targetTheta ?? this.theta) + deltaRad;
  }

  public getBoltScreenPosition(boltId: string): { x: number; y: number } | null {
    const entry = this.boltMeshes.get(boltId);
    if (!entry) return null;
    this.pivot.updateMatrixWorld(true);
    const worldPos = new THREE.Vector3();
    entry.group.getWorldPosition(worldPos);
    worldPos.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + ((worldPos.x + 1) / 2) * rect.width,
      y: rect.top + ((-worldPos.y + 1) / 2) * rect.height
    };
  }

  private buildChassis(shape: ChassisShape) {
    while (this.chassisGroup.children.length > 0) {
      this.chassisGroup.remove(this.chassisGroup.children[0]);
    }
    this.animatedParts = [];

    const palettes: Record<ChassisShape, { body: number; accent: number; secondary: number; glow: number }> = {
      cube: { body: 0xd9a066, accent: 0x92400e, secondary: 0xfde68a, glow: 0xf59e0b },
      house: { body: 0xfef3c7, accent: 0xdc2626, secondary: 0x38bdf8, glow: 0xfde047 },
      rocket: { body: 0xf1f5f9, accent: 0xef4444, secondary: 0x2563eb, glow: 0x38bdf8 },
      arcade: { body: 0x312e81, accent: 0xec4899, secondary: 0x22d3ee, glow: 0x38bdf8 },
      robot: { body: 0x334155, accent: 0x06b6d4, secondary: 0xf59e0b, glow: 0x22d3ee },
      pyramid: { body: 0xf59e0b, accent: 0xfef08a, secondary: 0xb45309, glow: 0xfde047 },
      tower: { body: 0xe2e8f0, accent: 0xef4444, secondary: 0x1e293b, glow: 0xfef08a },
      chest: { body: 0x78350f, accent: 0xfbbf24, secondary: 0x451a03, glow: 0xfde047 },
      castle: { body: 0x94a3b8, accent: 0x2563eb, secondary: 0xe2e8f0, glow: 0xfbbf24 },
      vault: { body: 0x1e293b, accent: 0xf59e0b, secondary: 0x64748b, glow: 0x38bdf8 }
    };

    const pal = palettes[shape];
    const bodyMat = new THREE.MeshStandardMaterial({
      color: pal.body,
      roughness: shape === 'cube' || shape === 'chest' ? 0.52 : 0.28,
      metalness: shape === 'vault' || shape === 'robot' ? 0.58 : 0.14
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: pal.accent,
      roughness: 0.22,
      metalness: 0.42
    });
    const secMat = new THREE.MeshStandardMaterial({
      color: pal.secondary,
      roughness: 0.24,
      metalness: 0.48
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: pal.glow,
      emissive: pal.glow,
      emissiveIntensity: 0.7,
      roughness: 0.15
    });

    // Beveled / Chamfered Core Chassis (with corner trim pillars so it feels sculpted, not raw box)
    const coreGeo = new THREE.BoxGeometry(CHASSIS_HALF * 2, CHASSIS_HALF * 2, CHASSIS_HALF * 2);
    const core = new THREE.Mesh(coreGeo, bodyMat);
    core.castShadow = true;
    core.receiveShadow = true;
    this.chassisGroup.add(core);

    // Sculpted corner bevel pillars & base plinth
    const pillarGeo = new THREE.CylinderGeometry(0.11, 0.11, CHASSIS_HALF * 2.02, 10);
    const cOff = CHASSIS_HALF - 0.04;
    [[-cOff, -cOff], [cOff, -cOff], [-cOff, cOff], [cOff, cOff]].forEach(([cx, cz]) => {
      const p = new THREE.Mesh(pillarGeo, shape === 'chest' || shape === 'vault' ? accentMat : secMat);
      p.position.set(cx, 0, cz);
      this.chassisGroup.add(p);
    });

    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(CHASSIS_HALF * 2.12, 0.18, CHASSIS_HALF * 2.12),
      shape === 'house' ? accentMat : secMat
    );
    basePlinth.position.set(0, -CHASSIS_HALF - 0.08, 0);
    this.chassisGroup.add(basePlinth);

    const topY = CHASSIS_HALF;

    if (shape === 'cube') {
      // Wooden Toy Block: inlaid top wooden frame + brass corner rivets
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 1.75), accentMat);
      topFrame.position.set(0, topY + 0.07, 0);
      this.chassisGroup.add(topFrame);
      const topInlay = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 1.35), secMat);
      topInlay.position.set(0, topY + 0.09, 0);
      this.chassisGroup.add(topInlay);
    } else if (shape === 'house') {
      // Cozy Cottage: overhanging pitched roof + brick chimney + attic window
      const eave = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 2.3), accentMat);
      eave.position.set(0, topY + 0.07, 0);
      this.chassisGroup.add(eave);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.68, 1.05, 4), accentMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0, topY + 0.62, 0);
      this.chassisGroup.add(roof);
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.32), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }));
      chimney.position.set(0.5, topY + 0.68, -0.32);
      this.chassisGroup.add(chimney);
      const atticWin = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), glowMat);
      atticWin.position.set(0, topY + 0.48, 0.72);
      atticWin.rotation.x = -0.58;
      this.chassisGroup.add(atticWin);
    } else if (shape === 'rocket') {
      // Star Rocket: nose cone + metallic ring + 4 angled tail fins + glowing blue thruster nozzles
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.02, 0.2, 20), secMat);
      collar.position.set(0, topY + 0.1, 0);
      this.chassisGroup.add(collar);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.12, 20), accentMat);
      nose.position.set(0, topY + 0.74, 0);
      this.chassisGroup.add(nose);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), glowMat);
      tip.position.set(0, topY + 1.3, 0);
      this.chassisGroup.add(tip);
      // 4 side fins at base
      for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.55), accentMat);
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        fin.position.set(Math.cos(angle) * 1.25, -0.78, Math.sin(angle) * 1.25);
        fin.rotation.y = -angle;
        this.chassisGroup.add(fin);
      }
      // Thruster bell underneath
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.35, 16), secMat);
      nozzle.position.set(0, -CHASSIS_HALF - 0.26, 0);
      this.chassisGroup.add(nozzle);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 14), glowMat);
      flame.rotation.x = Math.PI;
      flame.position.set(0, -CHASSIS_HALF - 0.52, 0);
      this.chassisGroup.add(flame);
      this.animatedParts.push(flame);
    } else if (shape === 'arcade') {
      // Retro Arcade Cabinet: slanted glowing marquee, joystick, 3 glowing buttons
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.58, 0.65), bodyMat);
      hood.position.set(0, topY + 0.29, -0.45);
      this.chassisGroup.add(hood);
      const marquee = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.34, 0.08), glowMat);
      marquee.position.set(0, topY + 0.34, -0.11);
      this.chassisGroup.add(marquee);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 10), secMat);
      stick.position.set(-0.42, topY + 0.17, 0.42);
      this.chassisGroup.add(stick);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), accentMat);
      knob.position.set(-0.42, topY + 0.36, 0.42);
      this.chassisGroup.add(knob);
      [0.12, 0.4, 0.68].forEach((bx, idx) => {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.09, 14), idx === 1 ? accentMat : glowMat);
        btn.position.set(bx, topY + 0.05, 0.42 + (idx % 2) * 0.14);
        this.chassisGroup.add(btn);
      });
    } else if (shape === 'robot') {
      // Mecha Bot: sculpted head + twin glowing eyes + ear pods + shoulder pauldrons + antenna + feet
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.18, 12), secMat);
      neck.position.set(0, topY + 0.08, 0);
      this.chassisGroup.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.66, 1.04), bodyMat);
      head.position.set(0, topY + 0.48, 0);
      this.chassisGroup.add(head);
      const visorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.26, 0.1), secMat);
      visorFrame.position.set(0, topY + 0.5, 0.52);
      this.chassisGroup.add(visorFrame);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.12), glowMat);
      visor.position.set(0, topY + 0.5, 0.54);
      this.chassisGroup.add(visor);
      [-0.68, 0.68].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12), accentMat);
        ear.rotation.z = Math.PI / 2;
        ear.position.set(ex, topY + 0.5, 0);
        this.chassisGroup.add(ear);
      });
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8), secMat);
      ant.position.set(0, topY + 1.0, 0);
      this.chassisGroup.add(ant);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), glowMat);
      bulb.position.set(0, topY + 1.22, 0);
      this.chassisGroup.add(bulb);
      // Chunky mech feet
      [-0.56, 0.56].forEach((fx) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 1.1), bodyMat);
        foot.position.set(fx, -CHASSIS_HALF - 0.24, 0.15);
        this.chassisGroup.add(foot);
      });
    } else if (shape === 'pyramid') {
      const tier1 = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.26, 1.66), bodyMat);
      tier1.position.set(0, topY + 0.13, 0);
      this.chassisGroup.add(tier1);
      const tier2 = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.26, 1.24), secMat);
      tier2.position.set(0, topY + 0.39, 0);
      this.chassisGroup.add(tier2);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.68, 4), glowMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.set(0, topY + 0.85, 0);
      this.chassisGroup.add(cap);
    } else if (shape === 'tower') {
      // Harbor Lighthouse with balcony & rotating beacon
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.12, 0.18, 20), accentMat);
      deck.position.set(0, topY + 0.09, 0);
      this.chassisGroup.add(deck);
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.58, 0.52, 20),
        new THREE.MeshPhysicalMaterial({ color: 0xfffbeb, transparent: true, opacity: 0.72, roughness: 0.1 })
      );
      glass.position.set(0, topY + 0.44, 0);
      this.chassisGroup.add(glass);
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.78), glowMat);
      beacon.position.set(0, topY + 0.44, 0);
      this.chassisGroup.add(beacon);
      this.animatedParts.push(beacon);
      const dome = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.46, 20), accentMat);
      dome.position.set(0, topY + 0.92, 0);
      this.chassisGroup.add(dome);
    } else if (shape === 'chest') {
      // Domed Treasure Chest with gold straps & front lock clasp
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 2.04, 20, 1, false, 0, Math.PI), bodyMat);
      lid.rotation.z = Math.PI / 2;
      lid.rotation.y = Math.PI / 2;
      lid.position.set(0, topY, 0);
      this.chassisGroup.add(lid);
      [-0.72, 0, 0.72].forEach((x) => {
        const band = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.065, 10, 20, Math.PI), accentMat);
        band.rotation.y = Math.PI / 2;
        band.position.set(x, topY, 0);
        this.chassisGroup.add(band);
      });
      const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.14), glowMat);
      clasp.position.set(0, topY + 0.04, 1.06);
      this.chassisGroup.add(clasp);
    } else if (shape === 'castle') {
      // 4-Turret Royal Castle with battlements & central keep
      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 1.1), secMat);
      keep.position.set(0, topY + 0.21, 0);
      this.chassisGroup.add(keep);
      [[-0.78, -0.78], [0.78, -0.78], [-0.78, 0.78], [0.78, 0.78]].forEach(([x, z]) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.62, 14), bodyMat);
        t.position.set(x, topY + 0.31, z);
        this.chassisGroup.add(t);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.48, 14), accentMat);
        roof.position.set(x, topY + 0.85, z);
        this.chassisGroup.add(roof);
      });
    } else if (shape === 'vault') {
      // Titan Bank Vault with armored steel hub + rotating wheel + glowing status ring
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.86, 0.24, 20), accentMat);
      hub.position.set(0, topY + 0.12, 0);
      this.chassisGroup.add(hub);
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(0, topY + 0.38, 0);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 12, 28), secMat);
      wheel.rotation.x = Math.PI / 2;
      wheelGroup.add(wheel);
      for (let i = 0; i < 4; i++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.18, 10), secMat);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.y = (i * Math.PI) / 4;
        wheelGroup.add(spoke);
      }
      const coreLed = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), glowMat);
      wheelGroup.add(coreLed);
      this.chassisGroup.add(wheelGroup);
      this.animatedParts.push(wheelGroup);
    }
  }

  public loadLevel(config: LevelConfig) {
    this.hintBoltId = null;
    this.buildChassis(config.shape);

    for (const g of this.plateMeshes.values()) this.pivot.remove(g);
    for (const b of this.boltMeshes.values()) this.pivot.remove(b.group);
    for (const f of this.flyingBolts) this.pivot.remove(f.mesh);
    for (const fp of this.fallingPlates) this.pivot.remove(fp.mesh);
    for (const pt of this.particles) this.pivot.remove(pt.mesh);
    this.disposeLevelResources();

    this.plateMeshes.clear();
    this.boltMeshes.clear();
    this.flyingBolts = [];
    this.fallingPlates = [];
    this.particles = [];

    this.theta = config.level === 1 ? 0.22 : 0.52;
    this.targetTheta = null;
    this.phi = 0.26;
    this.velTheta = 0;
    this.velPhi = 0;

    const ringGeo = new THREE.RingGeometry(0.11, 0.16, 18);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.levelDisposables.push(ringGeo, ringMat);

    for (const plate of config.plates) {
      const group = new THREE.Group();
      const shape = createRoundedRectShape(plate.w, plate.h, 0.14);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.085,
        bevelEnabled: true,
        bevelThickness: 0.022,
        bevelSize: 0.022,
        bevelSegments: 3
      });
      geo.center();

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(plate.tint),
        transparent: true,
        opacity: 0.72,
        roughness: 0.12,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      const edgeGeo = new THREE.EdgesGeometry(geo, 28);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      group.add(new THREE.LineSegments(edgeGeo, edgeMat));
      this.levelDisposables.push(geo, mat, edgeGeo, edgeMat);

      const plateBolts = config.bolts.filter((b) => b.plateId === plate.id);
      for (const pb of plateBolts) {
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pb.u - plate.u, pb.v - plate.v, 0.068);
        group.add(ring);
      }

      const offset = 0.085 + plate.layer * 0.175;
      const tf = faceTransform(plate.face, plate.u, plate.v, offset);
      group.position.copy(tf.pos);
      group.quaternion.copy(tf.quat);

      this.pivot.add(group);
      this.plateMeshes.set(plate.id, group);
    }

    const washerGeo = new THREE.CylinderGeometry(0.175, 0.185, 0.036, 20);
    washerGeo.rotateX(Math.PI / 2);
    const headGeo = new THREE.CylinderGeometry(0.142, 0.148, 0.115, 6);
    headGeo.rotateX(Math.PI / 2);
    const domeGeo = new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeo.rotateX(Math.PI / 2);
    const slotGeo1 = new THREE.BoxGeometry(0.145, 0.034, 0.03);
    const slotGeo2 = new THREE.BoxGeometry(0.034, 0.145, 0.03);
    const hitGeo = new THREE.SphereGeometry(0.25, 10, 10);

    const washerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.85, roughness: 0.18 });
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (const bolt of config.bolts) {
      const group = new THREE.Group();
      const colorInfo = BOLT_COLORS[bolt.color];
      const headMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorInfo.hex),
        roughness: 0.16,
        metalness: 0.25,
        emissive: new THREE.Color(colorInfo.hex),
        emissiveIntensity: 0.08
      });

      const washer = new THREE.Mesh(washerGeo, washerMat);
      washer.position.z = 0.012;
      group.add(washer);

      const head = new THREE.Mesh(headGeo, headMat);
      head.position.z = 0.078;
      head.castShadow = true;
      group.add(head);

      const dome = new THREE.Mesh(domeGeo, headMat);
      dome.position.z = 0.115;
      dome.scale.set(1, 1, 0.35);
      group.add(dome);

      const s1 = new THREE.Mesh(slotGeo1, slotMat);
      s1.position.z = 0.152;
      group.add(s1);
      const s2 = new THREE.Mesh(slotGeo2, slotMat);
      s2.position.z = 0.152;
      group.add(s2);

      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.position.z = 0.09;
      hit.userData = { boltId: bolt.id };
      group.add(hit);
      head.userData = { boltId: bolt.id };

      const offset = 0.125 + bolt.layer * 0.175;
      const tf = faceTransform(bolt.face, bolt.u, bolt.v, offset);
      group.position.copy(tf.pos);
      group.quaternion.copy(tf.quat);

      this.pivot.add(group);
      this.boltMeshes.set(bolt.id, { group, headMat, normal: tf.normal });
    }

    this.updateOcclusion(config.plates, config.bolts);
  }

  public updateOcclusion(plates: PlateData[], bolts: BoltData[]) {
    for (const b of bolts) {
      const entry = this.boltMeshes.get(b.id);
      if (!entry) continue;
      const occluded = isBoltOccluded(b, plates);
      entry.headMat.emissiveIntensity = occluded ? 0.0 : 0.16;
      entry.headMat.roughness = occluded ? 0.72 : 0.15;
      entry.group.scale.setScalar(occluded ? 0.86 : 1.02);
    }
  }

  public removeBolt(boltId: string, colorHex: string) {
    const entry = this.boltMeshes.get(boltId);
    if (!entry) return;
    this.boltMeshes.delete(boltId);

    this.spawnBurst(entry.group.position, colorHex, 9);

    const vel = entry.normal.clone().multiplyScalar(2.8).add(new THREE.Vector3(0, 2.6, 0));
    this.flyingBolts.push({
      mesh: entry.group,
      vel,
      spin: 22,
      life: 0.38
    });
  }

  public dropPlate(plateId: string) {
    const group = this.plateMeshes.get(plateId);
    if (!group) return;
    this.plateMeshes.delete(plateId);

    this.shakeTime = 0.12;
    this.fallingPlates.push({
      mesh: group,
      vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, -1.6, (Math.random() - 0.5) * 1.5),
      rotVel: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
      life: 0.9
    });
  }

  private spawnBurst(origin: THREE.Vector3, colorHex: string, count: number) {
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(origin);
      this.pivot.add(m);
      this.particles.push({
        mesh: m,
        vel: new THREE.Vector3((Math.random() - 0.5) * 4.2, (Math.random() - 0.15) * 4.4, (Math.random() - 0.5) * 4.2),
        life: 0.44
      });
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.showcaseMode) return;
    this.dragging = true;
    this.targetTheta = null;
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
    this.velTheta = 0;
    this.velPhi = 0;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
    this.theta += dx * 0.0085;
    this.phi = Math.max(-0.9, Math.min(0.9, this.phi + dy * 0.0085));
    this.velTheta = dx * 0.005;
    this.velPhi = dy * 0.005;
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dist < 10) {
      this.pickBolt(e.clientX, e.clientY);
    }
  };

  private pickBolt(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);

    const targets: THREE.Object3D[] = [];
    for (const b of this.boltMeshes.values()) {
      targets.push(...b.group.children);
    }
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      const boltId = hits[0].object.userData?.boltId as string | undefined;
      if (boltId) this.onBoltClick(boltId);
    }
  }

  private updateCameraFraming(w: number, h: number) {
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Adaptive framing: narrow Fold cover screen pulls camera back slightly;
    // square unfolded Fold inner screen zooms in slightly for rich 3D presence
    const zDist = aspect < 0.52 ? 7.6 : aspect > 0.78 ? 6.15 : 6.75;
    this.camera.position.z = zDist;
    this.camera.updateProjectionMatrix();
  }

  private handleResize() {
    const w = Math.max(this.container.clientWidth, 100);
    const h = Math.max(this.container.clientHeight, 100);
    this.updateCameraFraming(w, h);
    this.renderer.setSize(w, h);
  }

  private animate = () => {
    this.rafId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsedTime += dt;

    if (this.showcaseMode) {
      this.theta += dt * 0.55;
    } else if (!this.dragging) {
      if (this.targetTheta !== null) {
        const diff = this.targetTheta - this.theta;
        this.theta += diff * Math.min(1, dt * 11);
        if (Math.abs(diff) < 0.005) {
          this.theta = this.targetTheta;
          this.targetTheta = null;
        }
      } else {
        this.theta += this.velTheta;
        this.phi = Math.max(-0.9, Math.min(0.9, this.phi + this.velPhi));
        this.velTheta *= 0.91;
        this.velPhi *= 0.91;
      }
    }

    this.pivot.rotation.y = this.theta;
    this.pivot.rotation.x = this.phi;
    this.pivot.position.y = Math.sin(this.elapsedTime * 1.8) * 0.05;

    // Spin animated model accents (lighthouse beacon, vault wheel, rocket flame)
    for (const part of this.animatedParts) {
      part.rotation.y += dt * 1.8;
    }

    // Gentle passive hint pulse on suggested bolt
    if (this.hintBoltId) {
      const hintEntry = this.boltMeshes.get(this.hintBoltId);
      if (hintEntry) {
        const pulse = Math.sin(this.elapsedTime * 7);
        hintEntry.group.scale.setScalar(1.06 + pulse * 0.11);
        hintEntry.headMat.emissiveIntensity = 0.25 + (pulse * 0.5 + 0.5) * 0.45;
      }
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      this.camera.position.x = (Math.random() - 0.5) * 0.07;
      this.camera.position.y = 0.42 + (Math.random() - 0.5) * 0.07;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 0.42;
    }

    for (let i = this.flyingBolts.length - 1; i >= 0; i--) {
      const f = this.flyingBolts[i];
      f.life -= dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      f.mesh.rotateZ(f.spin * dt);
      f.mesh.scale.setScalar(Math.max(0.01, f.life / 0.38));
      if (f.life <= 0) {
        this.pivot.remove(f.mesh);
        this.flyingBolts.splice(i, 1);
      }
    }

    for (let i = this.fallingPlates.length - 1; i >= 0; i--) {
      const fp = this.fallingPlates[i];
      fp.life -= dt;
      fp.vel.y -= 15 * dt;
      fp.mesh.position.addScaledVector(fp.vel, dt);
      fp.mesh.rotation.x += fp.rotVel.x * dt;
      fp.mesh.rotation.y += fp.rotVel.y * dt;
      fp.mesh.rotation.z += fp.rotVel.z * dt;
      if (fp.life <= 0) {
        this.pivot.remove(fp.mesh);
        this.fallingPlates.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vel.y -= 8.5 * dt;
      pt.mesh.position.addScaledVector(pt.vel, dt);
      pt.mesh.scale.setScalar(Math.max(0.01, pt.life / 0.44));
      if (pt.life <= 0) {
        this.pivot.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('resize', this.onWindowResize);
    this.disposeLevelResources();
    this.envRT.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
