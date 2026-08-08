-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "project_topic" TEXT,
    "teacher_name" TEXT,
    "tutor_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_tutor_user_id_fkey" FOREIGN KEY ("tutor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("course_id", "created_at", "id", "name", "number", "project_topic", "teacher_name", "updated_at") SELECT "course_id", "created_at", "id", "name", "number", "project_topic", "teacher_name", "updated_at" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_tutor_user_id_idx" ON "groups"("tutor_user_id");
CREATE UNIQUE INDEX "groups_course_id_number_key" ON "groups"("course_id", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
