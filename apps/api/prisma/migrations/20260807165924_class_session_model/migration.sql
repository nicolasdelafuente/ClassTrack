-- CreateTable
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "mandatory_source" TEXT NOT NULL DEFAULT 'derived',
    "allows_attendance" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "class_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_session_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "activity_type" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "class_session_items_class_session_id_fkey" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "class_sessions_course_id_idx" ON "class_sessions"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_sessions_course_id_date_key" ON "class_sessions"("course_id", "date");

-- CreateIndex
CREATE INDEX "class_session_items_class_session_id_idx" ON "class_session_items"("class_session_id");
