-- CreateTable
CREATE TABLE "group_leave_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_leave_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_leave_logs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "group_enrollment_open" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_courses" ("code", "created_at", "id", "is_current", "max_absences_allowed", "name", "updated_at") SELECT "code", "created_at", "id", "is_current", "max_absences_allowed", "name", "updated_at" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "project_topic" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "teacher_name" TEXT,
    "tutor_user_id" TEXT,
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
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'teacher',
    "display_name" TEXT,
    "student_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("created_at", "display_name", "email", "id", "password", "role", "updated_at") SELECT "created_at", "display_name", "email", "id", "password", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "group_leave_logs_group_id_idx" ON "group_leave_logs"("group_id");

-- CreateIndex
CREATE INDEX "group_leave_logs_student_id_idx" ON "group_leave_logs"("student_id");
