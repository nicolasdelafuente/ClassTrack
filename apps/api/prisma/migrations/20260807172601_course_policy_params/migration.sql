-- CreateTable
CREATE TABLE "course_activity_type_defaults" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "is_mandatory_by_default" BOOLEAN NOT NULL DEFAULT true,
    "allows_attendance" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "course_activity_type_defaults_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "max_absences_allowed" INTEGER NOT NULL DEFAULT 4,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_courses" ("code", "created_at", "id", "is_current", "name", "updated_at") SELECT "code", "created_at", "id", "is_current", "name", "updated_at" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "course_activity_type_defaults_course_id_idx" ON "course_activity_type_defaults"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_activity_type_defaults_course_id_activity_type_key" ON "course_activity_type_defaults"("course_id", "activity_type");
