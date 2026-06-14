/**
 * Sprint 81 — timelineCard: the pure model behind the shareable
 * "recent milestones" image.
 */

import {buildTimelineCard} from '../src/features/reading-insights/timelineCard';

const m = (title: string, dateLabel = '12 jun 2026', icon = 'book') => ({
  title,
  dateLabel,
  icon,
});

describe('buildTimelineCard', () => {
  it('takes the head of the newest-first feed, capped at 4 by default', () => {
    const card = buildTimelineCard([
      m('Completaste el plan NT en 30 días'),
      m('Logro: Buscador de la verdad'),
      m('Terminaste Génesis'),
      m('Nueva racha récord: 5 días'),
      m('Tu primer favorito · Juan 3:16'),
    ]);
    expect(card.milestones).toHaveLength(4);
    expect(card.milestones[0].title).toBe('Completaste el plan NT en 30 días');
    expect(card.totalCount).toBe(5);
  });

  it('truncates long titles on a word boundary with an ellipsis', () => {
    const long =
      'Completaste el plan La Biblia entera en un año leyendo cada día sin falta';
    const card = buildTimelineCard([m(long)], {maxChars: 30});
    expect(card.milestones[0].title.length).toBeLessThanOrEqual(31);
    expect(card.milestones[0].title.endsWith('…')).toBe(true);
  });

  it('drops blank titles and counts only usable milestones', () => {
    const card = buildTimelineCard([m('   '), m('Terminaste Salmos')]);
    expect(card.milestones).toHaveLength(1);
    expect(card.totalCount).toBe(1);
  });

  it('yields an empty model for an empty feed', () => {
    const card = buildTimelineCard([]);
    expect(card.milestones).toEqual([]);
    expect(card.totalCount).toBe(0);
  });

  it('clamps malformed options to sane minimums', () => {
    const card = buildTimelineCard([m('Uno'), m('Dos')], {maxItems: 0});
    expect(card.milestones).toHaveLength(1);
  });

  it('builds a single-milestone card for the long-press share (Sprint 83)', () => {
    // The timeline screen long-press passes exactly one milestone with
    // maxItems:1 → a focused card with totalCount 1.
    const card = buildTimelineCard([m('Terminaste Génesis', '14 jun 2026')], {
      maxItems: 1,
    });
    expect(card.milestones).toHaveLength(1);
    expect(card.milestones[0].title).toBe('Terminaste Génesis');
    expect(card.milestones[0].dateLabel).toBe('14 jun 2026');
    expect(card.totalCount).toBe(1);
  });
});
