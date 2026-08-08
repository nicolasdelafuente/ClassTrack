-- CreateTable
CREATE TABLE "sprint_sheets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "sprint_number" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submitted_at" DATETIME,
    "approved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sprint_sheets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sprint_sheet_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sheet_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN,
    "incomplete_reason" TEXT,
    "is_extra" BOOLEAN NOT NULL DEFAULT false,
    "extra_reason" TEXT,
    "source_task_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sprint_sheet_tasks_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sprint_sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sprint_sheet_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sheet_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sprint_sheet_comments_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sprint_sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sprint_sheet_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
CREATE INDEX "sprint_sheets_group_id_idx" ON "sprint_sheets"("group_id");

-- CreateIndex
CREATE INDEX "sprint_sheets_status_idx" ON "sprint_sheets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_sheets_group_id_sprint_number_kind_key" ON "sprint_sheets"("group_id", "sprint_number", "kind");

-- CreateIndex
CREATE INDEX "sprint_sheet_tasks_sheet_id_idx" ON "sprint_sheet_tasks"("sheet_id");

-- CreateIndex
CREATE INDEX "sprint_sheet_comments_sheet_id_idx" ON "sprint_sheet_comments"("sheet_id");
