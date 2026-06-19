import {
  clampRange,
  adjustStart,
  adjustEnd,
  canDecreaseStart,
  canIncreaseStart,
  canDecreaseEnd,
  canIncreaseEnd,
} from '../src/features/study/prepRange';

describe('prepRange — verse-range picker clamping', () => {
  describe('clampRange', () => {
    it('keeps a valid range', () => {
      expect(clampRange(16, 21, 36)).toEqual({start: 16, end: 21});
    });

    it('floors start at 1', () => {
      expect(clampRange(0, 5, 36)).toEqual({start: 1, end: 5});
      expect(clampRange(-3, 5, 36)).toEqual({start: 1, end: 5});
    });

    it('caps end at maxVerse', () => {
      expect(clampRange(10, 99, 36)).toEqual({start: 10, end: 36});
    });

    it('pulls end up when start passes it', () => {
      expect(clampRange(20, 15, 36)).toEqual({start: 20, end: 20});
    });

    it('caps start at maxVerse too', () => {
      expect(clampRange(99, 99, 36)).toEqual({start: 36, end: 36});
    });

    it('leaves the upper bound open for an unknown max', () => {
      expect(clampRange(16, 21, 0)).toEqual({start: 16, end: 21});
      expect(clampRange(16, 21, NaN)).toEqual({start: 16, end: 21});
    });

    it('floors non-integers and defends against NaN', () => {
      expect(clampRange(2.7, 5.9, 36)).toEqual({start: 2, end: 5});
      expect(clampRange(NaN, NaN, 36)).toEqual({start: 1, end: 1});
    });
  });

  describe('adjustStart / adjustEnd', () => {
    const r = {start: 16, end: 21};

    it('steps the start down and up', () => {
      expect(adjustStart(r, -1, 36)).toEqual({start: 15, end: 21});
      expect(adjustStart(r, +1, 36)).toEqual({start: 17, end: 21});
    });

    it('steps the end down and up', () => {
      expect(adjustEnd(r, -1, 36)).toEqual({start: 16, end: 20});
      expect(adjustEnd(r, +1, 36)).toEqual({start: 16, end: 22});
    });

    it('start cannot cross above end without pulling it', () => {
      expect(adjustStart({start: 21, end: 21}, +1, 36)).toEqual({
        start: 22,
        end: 22,
      });
    });

    it('end cannot drop below start', () => {
      expect(adjustEnd({start: 16, end: 16}, -1, 36)).toEqual({
        start: 16,
        end: 16,
      });
    });
  });

  describe('boundary predicates', () => {
    it('canDecreaseStart only above verse 1', () => {
      expect(canDecreaseStart({start: 1, end: 5})).toBe(false);
      expect(canDecreaseStart({start: 2, end: 5})).toBe(true);
    });

    it('canIncreaseStart only below end', () => {
      expect(canIncreaseStart({start: 5, end: 5})).toBe(false);
      expect(canIncreaseStart({start: 4, end: 5})).toBe(true);
    });

    it('canDecreaseEnd only above start', () => {
      expect(canDecreaseEnd({start: 5, end: 5})).toBe(false);
      expect(canDecreaseEnd({start: 5, end: 6})).toBe(true);
    });

    it('canIncreaseEnd only below maxVerse (open when unknown)', () => {
      expect(canIncreaseEnd({start: 1, end: 36}, 36)).toBe(false);
      expect(canIncreaseEnd({start: 1, end: 35}, 36)).toBe(true);
      expect(canIncreaseEnd({start: 1, end: 99}, 0)).toBe(true);
    });
  });
});
