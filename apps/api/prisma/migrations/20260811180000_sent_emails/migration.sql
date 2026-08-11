-- CreateTable
CREATE TABLE "sent_emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT,
    "sent_by_user_id" TEXT,
    "recipients_json" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL,
    "emailed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "redirected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sent_emails_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sent_emails_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sent_emails_course_id_created_at_idx" ON "sent_emails"("course_id", "created_at");

-- CreateIndex
CREATE INDEX "sent_emails_category_idx" ON "sent_emails"("category");

-- CreateIndex
CREATE INDEX "sent_emails_sent_by_user_id_idx" ON "sent_emails"("sent_by_user_id");
