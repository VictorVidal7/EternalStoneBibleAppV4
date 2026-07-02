/**
 * The kids scene illustration geometry — pure, deterministic, $0 (no assets).
 */
import {buildKidsScene} from '../src/features/kids/kidsSceneArt';
import {KIDS_STORIES} from '../src/features/kids/kidsStories';

const WIDTH = 320;

describe('buildKidsScene', () => {
  it('is deterministic for the same input', () => {
    const art = KIDS_STORIES[0].scenes[0].art;
    const a = buildKidsScene(art, WIDTH);
    const b = buildKidsScene(art, WIDTH);
    expect(a).toEqual(b);
  });

  it('derives a fixed-ratio height from the given width', () => {
    const art = KIDS_STORIES[0].scenes[0].art;
    const layout = buildKidsScene(art, WIDTH);
    expect(layout.width).toBe(WIDTH);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.height).toBeLessThan(WIDTH);
  });

  it('places every actor within the canvas bounds', () => {
    for (const story of KIDS_STORIES) {
      for (const scene of story.scenes) {
        const layout = buildKidsScene(scene.art, WIDTH);
        for (const actor of layout.actors) {
          expect(actor.left + actor.fontSize).toBeGreaterThanOrEqual(0);
          expect(actor.left).toBeLessThanOrEqual(layout.width);
          expect(actor.top + actor.fontSize).toBeGreaterThanOrEqual(0);
          expect(actor.top).toBeLessThanOrEqual(layout.height + actor.fontSize);
          expect(actor.fontSize).toBeGreaterThan(0);
        }
      }
    }
  });

  it('omits the ground band when ground is "none"', () => {
    const art = {...KIDS_STORIES[0].scenes[0].art, ground: 'none' as const};
    const layout = buildKidsScene(art, WIDTH);
    expect(layout.ground).toBeNull();
  });

  it('draws a ground band anchored to the bottom of the canvas otherwise', () => {
    const art = {...KIDS_STORIES[0].scenes[0].art, ground: 'grass' as const};
    const layout = buildKidsScene(art, WIDTH);
    expect(layout.ground).not.toBeNull();
    expect(layout.ground!.y + layout.ground!.height).toBeCloseTo(
      layout.height,
      5,
    );
    expect(layout.ground!.color).toMatch(/^#/);
  });

  it('builds every scene in the whole catalog without throwing', () => {
    for (const story of KIDS_STORIES) {
      for (const scene of story.scenes) {
        expect(() => buildKidsScene(scene.art, WIDTH)).not.toThrow();
      }
    }
  });

  it('produces at least one decor primitive for every decor kind used in the catalog', () => {
    const usedDecors = new Set(
      KIDS_STORIES.flatMap(s => s.scenes.flatMap(sc => sc.art.decor)),
    );
    for (const decor of usedDecors) {
      const layout = buildKidsScene(
        {
          sky: ['#000000', '#111111'],
          ground: 'none',
          decor: [decor],
          actors: [],
        },
        WIDTH,
      );
      expect(layout.decor.length).toBeGreaterThan(0);
    }
  });
});
