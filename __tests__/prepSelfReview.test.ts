import {
  emptyPrepSelfReview,
  isPrepSelfReviewEmpty,
  setQuestionChecked,
  parsePrepSelfReviewMap,
  serializePrepSelfReviewMap,
  setMapQuestionChecked,
  PREP_SELF_REVIEW_QUESTION_IDS,
  type PrepSelfReviewMap,
} from '../src/features/study/prepSelfReview';

describe('prepSelfReview — preacher self-review checklist model', () => {
  describe('isPrepSelfReviewEmpty', () => {
    it('treats null/undefined/no-checked-ids as empty', () => {
      expect(isPrepSelfReviewEmpty(null)).toBe(true);
      expect(isPrepSelfReviewEmpty(undefined)).toBe(true);
      expect(isPrepSelfReviewEmpty(emptyPrepSelfReview())).toBe(true);
      expect(isPrepSelfReviewEmpty({checkedIds: {}, updatedAt: 1})).toBe(true);
    });

    it('is non-empty once a question is checked', () => {
      expect(
        isPrepSelfReviewEmpty({
          checkedIds: {oneMovement: true},
          updatedAt: 1,
        }),
      ).toBe(false);
    });
  });

  describe('setQuestionChecked', () => {
    it('checks a question and advances updatedAt', () => {
      const next = setQuestionChecked(
        emptyPrepSelfReview(),
        'bigIdeaOneSentence',
        true,
        42,
      );
      expect(next.checkedIds.bigIdeaOneSentence).toBe(true);
      expect(next.updatedAt).toBe(42);
    });

    it('unchecking removes the key entirely (never stores false)', () => {
      const checked = setQuestionChecked(
        emptyPrepSelfReview(),
        'rehearsedAloud',
        true,
        1,
      );
      const unchecked = setQuestionChecked(checked, 'rehearsedAloud', false, 2);
      expect(unchecked.checkedIds.rehearsedAloud).toBeUndefined();
      expect('rehearsedAloud' in unchecked.checkedIds).toBe(false);
      expect(isPrepSelfReviewEmpty(unchecked)).toBe(true);
    });

    it('does not mutate the input', () => {
      const base = emptyPrepSelfReview();
      setQuestionChecked(base, 'sectionTiming', true, 1);
      expect(base.checkedIds.sectionTiming).toBeUndefined();
    });

    it('checking multiple questions accumulates independently', () => {
      let review = emptyPrepSelfReview();
      review = setQuestionChecked(review, 'oneMovement', true, 1);
      review = setQuestionChecked(review, 'applyToSelfFirst', true, 2);
      expect(Object.keys(review.checkedIds).sort()).toEqual(
        ['applyToSelfFirst', 'oneMovement'].sort(),
      );
    });
  });

  describe('parse/serialize round-trip', () => {
    it('round-trips a populated map', () => {
      const map = setMapQuestionChecked(
        {},
        'John/3/16',
        'tensionBeforeResolution',
        true,
        7,
      );
      const round = parsePrepSelfReviewMap(serializePrepSelfReviewMap(map));
      expect(round['John/3/16'].checkedIds.tensionBeforeResolution).toBe(true);
      expect(round['John/3/16'].updatedAt).toBe(7);
    });

    it('returns an empty map for null/garbage/non-object', () => {
      expect(parsePrepSelfReviewMap(null)).toEqual({});
      expect(parsePrepSelfReviewMap('not json')).toEqual({});
      expect(parsePrepSelfReviewMap('[1,2,3]')).toEqual({});
    });

    it('drops corrupt entries but keeps good ones', () => {
      const raw = JSON.stringify({
        'John/3/16': {
          checkedIds: {oneMovement: true},
          updatedAt: 5,
        },
        'Bad/1/1': {checkedIds: 'nope', updatedAt: 'x'},
        'Empty/1/1': {checkedIds: {}, updatedAt: 1},
      });
      const map = parsePrepSelfReviewMap(raw);
      expect(map['John/3/16'].checkedIds.oneMovement).toBe(true);
      // A row with no checked ids collapses to empty → dropped.
      expect(map['Empty/1/1']).toBeUndefined();
      // A row with a non-object checkedIds becomes empty → dropped.
      expect(map['Bad/1/1']).toBeUndefined();
    });

    it('drops an unknown/unrecognized question id (future or corrupt)', () => {
      const raw = JSON.stringify({
        'John/3/16': {
          checkedIds: {
            oneMovement: true,
            somethingThisBuildDoesNotKnow: true,
          },
          updatedAt: 5,
        },
      });
      const map = parsePrepSelfReviewMap(raw);
      expect(map['John/3/16'].checkedIds.oneMovement).toBe(true);
      expect(
        (map['John/3/16'].checkedIds as Record<string, unknown>)
          .somethingThisBuildDoesNotKnow,
      ).toBeUndefined();
    });

    it('drops a checked id whose value is not literally true', () => {
      const raw = JSON.stringify({
        'John/3/16': {
          checkedIds: {oneMovement: false, rehearsedAloud: 'yes'},
          updatedAt: 5,
        },
      });
      const map = parsePrepSelfReviewMap(raw);
      expect(map['John/3/16']).toBeUndefined();
    });

    it('every real question id survives a full round trip', () => {
      let map: PrepSelfReviewMap = {};
      for (const id of PREP_SELF_REVIEW_QUESTION_IDS) {
        map = setMapQuestionChecked(map, 'Ruth/1/1', id, true, 1);
      }
      const round = parsePrepSelfReviewMap(serializePrepSelfReviewMap(map));
      for (const id of PREP_SELF_REVIEW_QUESTION_IDS) {
        expect(round['Ruth/1/1'].checkedIds[id]).toBe(true);
      }
    });
  });

  describe('setMapQuestionChecked', () => {
    it('adds a passage entry', () => {
      const map = setMapQuestionChecked(
        {},
        'John/3/16',
        'pointsTraceToText',
        true,
        1,
      );
      expect(map['John/3/16'].checkedIds.pointsTraceToText).toBe(true);
    });

    it('drops the passage entry when its last checked question is unchecked', () => {
      const filled = setMapQuestionChecked(
        {},
        'John/3/16',
        'pointsTraceToText',
        true,
        1,
      );
      const empty = setMapQuestionChecked(
        filled,
        'John/3/16',
        'pointsTraceToText',
        false,
        2,
      );
      expect(empty['John/3/16']).toBeUndefined();
    });

    it('keeps the passage entry when one of several checked questions is unchecked', () => {
      let map = setMapQuestionChecked(
        {},
        'John/3/16',
        'pointsTraceToText',
        true,
        1,
      );
      map = setMapQuestionChecked(map, 'John/3/16', 'oneMovement', true, 2);
      map = setMapQuestionChecked(
        map,
        'John/3/16',
        'pointsTraceToText',
        false,
        3,
      );
      expect(map['John/3/16'].checkedIds.pointsTraceToText).toBeUndefined();
      expect(map['John/3/16'].checkedIds.oneMovement).toBe(true);
    });

    it('does not mutate the input map', () => {
      const base = setMapQuestionChecked(
        {},
        'John/3/16',
        'pointsTraceToText',
        true,
        1,
      );
      setMapQuestionChecked(base, 'John/3/16', 'oneMovement', true, 2);
      expect(base['John/3/16'].checkedIds.oneMovement).toBeUndefined();
    });

    it('a toggle for one passage never touches another passage entry in the same map', () => {
      const map: PrepSelfReviewMap = {
        'John/3/16': {
          checkedIds: {oneMovement: true},
          updatedAt: 5,
        },
      };
      const next = setMapQuestionChecked(
        map,
        'Ruth/1/1',
        'sectionTiming',
        true,
        9,
      );
      expect(next['John/3/16']).toEqual(map['John/3/16']);
      expect(next['Ruth/1/1'].checkedIds.sectionTiming).toBe(true);
    });
  });
});
