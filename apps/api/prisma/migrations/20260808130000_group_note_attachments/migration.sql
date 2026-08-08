-- CreateTable
CREATE TABLE "group_note_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "note_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_note_attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "group_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_note_attachments_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "group_note_attachments_note_id_idx" ON "group_note_attachments"("note_id");
