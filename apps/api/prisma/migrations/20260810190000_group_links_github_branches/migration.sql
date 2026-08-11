-- AlterTable: multi-branch support (JSON array)
ALTER TABLE "group_links" ADD COLUMN "github_branches" TEXT NOT NULL DEFAULT '[]';

UPDATE "group_links"
SET "github_branches" = '["' || REPLACE(TRIM("github_branch"), '"', '') || '"]'
WHERE "github_branch" IS NOT NULL AND TRIM("github_branch") != '';

ALTER TABLE "group_links" DROP COLUMN "github_branch";
