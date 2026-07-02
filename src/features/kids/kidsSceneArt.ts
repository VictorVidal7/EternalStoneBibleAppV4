/**
 * 🎨 kidsSceneArt — pure geometry for a kids story scene's $0 illustration.
 *
 * Turns a scene's declarative [[KidsSceneArt]] spec (sky gradient, ground
 * type, a handful of named decorations, emoji actors) into scaled SVG
 * primitives for a canvas of the given width — the same "geometry pure,
 * canvas dumb" split as [[journeyMap]]'s `buildJourneyMap`. Every decoration
 * is a deterministic function of fixed layout constants (no `Math.random`),
 * so a scene renders identically every time and unit-tests exactly.
 *
 * No binary assets: decorations are simple shapes, actors are emoji
 * rendered as RN `<Text>` by [[KidsSceneCanvas]] (not `<SvgText>` — emoji
 * glyph support inside SVG text is inconsistent across platforms).
 *
 * PURE (no React/RN/SVG import).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {
  KidsSceneArt,
  KidsSceneDecor,
  KidsSceneGround,
} from './kidsStories';

/** Canvas height as a fraction of width (a gentle 16:10-ish landscape). */
const ASPECT_RATIO = 0.625;
/** Top edge (in the 0-100 normalized grid) where the ground band begins. */
const GROUND_Y = 78;

export interface KidsSceneCircle {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
}

export interface KidsSceneLine {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface KidsSceneArc {
  kind: 'arc';
  cx: number;
  cy: number;
  r: number;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export type KidsScenePrimitive = KidsSceneCircle | KidsSceneLine | KidsSceneArc;

export interface KidsSceneActorLayout {
  emoji: string;
  left: number;
  top: number;
  fontSize: number;
}

export interface KidsSceneGroundLayout {
  y: number;
  height: number;
  color: string;
}

export interface KidsSceneLayout {
  width: number;
  height: number;
  skyGradient: readonly [string, string];
  ground: KidsSceneGroundLayout | null;
  decor: readonly KidsScenePrimitive[];
  actors: readonly KidsSceneActorLayout[];
}

const GROUND_COLOR: Record<KidsSceneGround, string | null> = {
  water: '#0EA5E9',
  sand: '#FDE68A',
  grass: '#4ADE80',
  stone: '#94A3B8',
  night: '#1E293B',
  none: null,
};

// ── Deterministic decor builders (normalized 0-100 grid, no randomness) ──

function sunDecor(): KidsScenePrimitive[] {
  return [{kind: 'circle', cx: 82, cy: 18, r: 9, color: '#FCD34D', opacity: 1}];
}

function moonDecor(): KidsScenePrimitive[] {
  return [{kind: 'circle', cx: 20, cy: 16, r: 7, color: '#E2E8F0', opacity: 1}];
}

const STAR_POSITIONS: readonly [number, number][] = [
  [10, 10],
  [25, 20],
  [45, 8],
  [60, 15],
  [78, 25],
  [90, 10],
];

function starsDecor(): KidsScenePrimitive[] {
  return STAR_POSITIONS.map(([cx, cy]) => ({
    kind: 'circle',
    cx,
    cy,
    r: 1.2,
    color: '#FFFFFF',
    opacity: 0.9,
  }));
}

const CLOUD_PUFFS: readonly [number, number, number][] = [
  [26, 19, 5],
  [32, 16, 6],
  [38, 19, 5],
  [66, 13, 4],
  [71, 10, 5],
  [76, 13, 4],
];

function cloudsDecor(): KidsScenePrimitive[] {
  return CLOUD_PUFFS.map(([cx, cy, r]) => ({
    kind: 'circle',
    cx,
    cy,
    r,
    color: '#F8FAFC',
    opacity: 0.85,
  }));
}

const RAIN_X: readonly number[] = [15, 30, 45, 60, 75, 90];

function rainDecor(): KidsScenePrimitive[] {
  return RAIN_X.map(x => ({
    kind: 'line',
    x1: x,
    y1: 35,
    x2: x - 4,
    y2: 50,
    color: '#93C5FD',
    strokeWidth: 1.5,
    opacity: 0.6,
  }));
}

function rainbowDecor(): KidsScenePrimitive[] {
  const colors = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6'];
  return colors.map((color, i) => ({
    kind: 'arc',
    cx: 50,
    cy: GROUND_Y,
    r: 34 - i * 5,
    color,
    strokeWidth: 3,
    opacity: 0.9,
  }));
}

const WAVE_ROWS: readonly [number, number][] = [
  [82, 0.5],
  [86, 0.35],
  [90, 0.25],
];

function wavesDecor(): KidsScenePrimitive[] {
  return WAVE_ROWS.map(([y, opacity]) => ({
    kind: 'line',
    x1: 8,
    y1: y,
    x2: 92,
    y2: y,
    color: '#FFFFFF',
    strokeWidth: 1.5,
    opacity,
  }));
}

const HILL_SHAPES: readonly [number, number, number][] = [
  [24, 100, 20],
  [76, 104, 24],
];

function hillsDecor(): KidsScenePrimitive[] {
  return HILL_SHAPES.map(([cx, cy, r]) => ({
    kind: 'circle',
    cx,
    cy,
    r,
    color: '#16A34A',
    opacity: 0.5,
  }));
}

const RAY_ANGLES_DEG: readonly number[] = [200, 235, 270, 305, 340];

function raysDecor(): KidsScenePrimitive[] {
  const cx = 50;
  const cy = 20;
  const inner = 6;
  const outer = 22;
  return RAY_ANGLES_DEG.map(deg => {
    const rad = (deg * Math.PI) / 180;
    return {
      kind: 'line' as const,
      x1: cx + inner * Math.cos(rad),
      y1: cy + inner * Math.sin(rad),
      x2: cx + outer * Math.cos(rad),
      y2: cy + outer * Math.sin(rad),
      color: '#FDE68A',
      strokeWidth: 2,
      opacity: 0.8,
    };
  });
}

const DECOR_BUILDERS: Record<KidsSceneDecor, () => KidsScenePrimitive[]> = {
  sun: sunDecor,
  moon: moonDecor,
  stars: starsDecor,
  clouds: cloudsDecor,
  rain: rainDecor,
  rainbow: rainbowDecor,
  waves: wavesDecor,
  hills: hillsDecor,
  rays: raysDecor,
};

/**
 * Scales a scene's declarative art spec to a canvas of the given width.
 * Pure: same input always yields the same layout.
 */
export function buildKidsScene(
  art: KidsSceneArt,
  width: number,
): KidsSceneLayout {
  const height = Math.round(width * ASPECT_RATIO);
  const scaleX = width / 100;
  const scaleY = height / 100;
  // Radii/stroke widths scale off width alone so shapes stay round.
  const scaleR = width / 100;

  const decor: KidsScenePrimitive[] = art.decor.flatMap(name =>
    DECOR_BUILDERS[name]().map(p => scalePrimitive(p, scaleX, scaleY, scaleR)),
  );

  const groundColor = GROUND_COLOR[art.ground];
  const ground: KidsSceneGroundLayout | null = groundColor
    ? {
        y: GROUND_Y * scaleY,
        height: height - GROUND_Y * scaleY,
        color: groundColor,
      }
    : null;

  const actors: KidsSceneActorLayout[] = art.actors.map(a => {
    const fontSize = (a.size / 100) * width;
    return {
      emoji: a.emoji,
      left: (a.x / 100) * width - fontSize / 2,
      top: (a.y / 100) * height - fontSize / 2,
      fontSize,
    };
  });

  return {width, height, skyGradient: art.sky, ground, decor, actors};
}

function scalePrimitive(
  p: KidsScenePrimitive,
  scaleX: number,
  scaleY: number,
  scaleR: number,
): KidsScenePrimitive {
  switch (p.kind) {
    case 'circle':
      return {...p, cx: p.cx * scaleX, cy: p.cy * scaleY, r: p.r * scaleR};
    case 'line':
      return {
        ...p,
        x1: p.x1 * scaleX,
        y1: p.y1 * scaleY,
        x2: p.x2 * scaleX,
        y2: p.y2 * scaleY,
        strokeWidth: p.strokeWidth,
      };
    case 'arc':
      return {...p, cx: p.cx * scaleX, cy: p.cy * scaleY, r: p.r * scaleR};
  }
}
