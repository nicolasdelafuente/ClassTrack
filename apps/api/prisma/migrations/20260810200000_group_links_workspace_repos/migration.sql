-- Workspace + list of repos with branches
ALTER TABLE "group_links" ADD COLUMN "github_workspace_url" TEXT;
ALTER TABLE "group_links" ADD COLUMN "github_repos" TEXT NOT NULL DEFAULT '[]';

-- Previous single repo URL + branches → one repo entry (workspace left empty)
UPDATE "group_links"
SET "github_repos" = json_array(
  json_object(
    'url', "github_url",
    'branches', COALESCE(json("github_branches"), json('[]'))
  )
)
WHERE "github_url" IS NOT NULL AND TRIM("github_url") != '';

ALTER TABLE "group_links" DROP COLUMN "github_url";
ALTER TABLE "group_links" DROP COLUMN "github_branches";
