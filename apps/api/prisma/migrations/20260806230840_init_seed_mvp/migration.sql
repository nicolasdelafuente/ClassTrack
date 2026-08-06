-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "project_topic" TEXT,
    "teacher_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legajo" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memberships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sprint_statuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "sprint_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sprint_statuses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_links" (
    "group_id" TEXT NOT NULL PRIMARY KEY,
    "github_url" TEXT,
    "trello_url" TEXT,
    "drive_url" TEXT,
    CONSTRAINT "group_links_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "participated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "attendance_records_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_course_id_number_key" ON "groups"("course_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_group_id_student_id_key" ON "memberships"("group_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_statuses_group_id_sprint_number_key" ON "sprint_statuses"("group_id", "sprint_number");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_course_id_student_id_date_key" ON "attendance_records"("course_id", "student_id", "date");
