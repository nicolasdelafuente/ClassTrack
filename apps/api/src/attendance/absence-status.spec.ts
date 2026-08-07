import { buildAbsenceStatus } from './absence-status';

describe('buildAbsenceStatus', () => {
  it('is not libre while absences stay within the allowance', () => {
    expect(buildAbsenceStatus(0, 4)).toEqual({
      absenceCount: 0,
      maxAbsencesAllowed: 4,
      isLibre: false,
    });
    expect(buildAbsenceStatus(4, 4).isLibre).toBe(false);
  });

  it('becomes libre on the absence that exceeds the allowance', () => {
    expect(buildAbsenceStatus(5, 4)).toEqual({
      absenceCount: 5,
      maxAbsencesAllowed: 4,
      isLibre: true,
    });
  });
});
