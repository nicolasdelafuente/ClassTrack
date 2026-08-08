-- CreateTable
CREATE TABLE "preliminary_grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" INTEGER,
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preliminary_grades_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "preliminary_grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "final_grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" INTEGER,
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "final_grades_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "final_grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "preliminary_group_comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_tutor_user_id_fkey" FOREIGN KEY ("tutor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("course_id", "created_at", "id", "name", "number", "project_topic", "teacher_name", "tutor_user_id", "updated_at") SELECT "course_id", "created_at", "id", "name", "number", "project_topic", "teacher_name", "tutor_user_id", "updated_at" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_tutor_user_id_idx" ON "groups"("tutor_user_id");
CREATE UNIQUE INDEX "groups_course_id_number_key" ON "groups"("course_id", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "preliminary_grades_course_id_idx" ON "preliminary_grades"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "preliminary_grades_course_id_student_id_key" ON "preliminary_grades"("course_id", "student_id");

-- CreateIndex
CREATE INDEX "final_grades_course_id_idx" ON "final_grades"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "final_grades_course_id_student_id_key" ON "final_grades"("course_id", "student_id");
