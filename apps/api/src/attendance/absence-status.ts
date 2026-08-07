/**
 * Absence / "libre" rules for ClassTrack (CT-030).
 *
 * - Only absences on mandatory sessions that allow attendance count.
 * - An absence is an AttendanceRecord with present === false on such a date.
 * - Libre when absenceCount > maxAbsencesAllowed (e.g. 5th falta if max is 4).
 */

export type AbsenceStatus = {
  absenceCount: number;
  maxAbsencesAllowed: number;
  isLibre: boolean;
};

export function buildAbsenceStatus(
  absenceCount: number,
  maxAbsencesAllowed: number,
): AbsenceStatus {
  const safeCount = Math.max(0, absenceCount);
  const safeMax = Math.max(0, maxAbsencesAllowed);

  return {
    absenceCount: safeCount,
    maxAbsencesAllowed: safeMax,
    isLibre: safeCount > safeMax,
  };
}
