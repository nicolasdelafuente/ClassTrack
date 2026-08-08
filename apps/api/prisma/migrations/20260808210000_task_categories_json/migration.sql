-- Replace single required category with optional JSON categories array (CT-069).
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_sprint_sheet_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sheet_id" TEXT NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN,
    "incomplete_reason" TEXT,
    "is_extra" BOOLEAN NOT NULL DEFAULT false,
    "extra_reason" TEXT,
    "source_task_id" TEXT,
    "trello_links" TEXT NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sprint_sheet_tasks_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sprint_sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_sprint_sheet_tasks" (
    "id",
    "sheet_id",
    "categories",
    "title",
    "description",
    "completed",
    "incomplete_reason",
    "is_extra",
    "extra_reason",
    "source_task_id",
    "trello_links",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "sheet_id",
    CASE
        WHEN "category" IS NULL OR TRIM("category") = '' THEN '[]'
        ELSE '["' || "category" || '"]'
    END,
    "title",
    "description",
    "completed",
    "incomplete_reason",
    "is_extra",
    "extra_reason",
    "source_task_id",
    "trello_links",
    "sort_order",
    "created_at",
    "updated_at"
FROM "sprint_sheet_tasks";

DROP TABLE "sprint_sheet_tasks";
ALTER TABLE "new_sprint_sheet_tasks" RENAME TO "sprint_sheet_tasks";
CREATE INDEX "sprint_sheet_tasks_sheet_id_idx" ON "sprint_sheet_tasks"("sheet_id");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
