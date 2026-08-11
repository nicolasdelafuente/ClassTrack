-- One branch per repo: convert legacy branches[] to branch (first item).

UPDATE "group_links"
SET "github_repos" = (
  SELECT CASE
    WHEN "github_repos" IS NULL OR TRIM("github_repos") = '' THEN '[]'
    ELSE (
      SELECT COALESCE(
        json_group_array(
          json_object(
            'url', json_extract(value, '$.url'),
            'branch', COALESCE(
              NULLIF(TRIM(json_extract(value, '$.branch')), ''),
              NULLIF(TRIM(json_extract(value, '$.branches[0]')), '')
            )
          )
        ),
        '[]'
      )
      FROM json_each("group_links"."github_repos")
      WHERE json_extract(value, '$.url') IS NOT NULL
        AND TRIM(json_extract(value, '$.url')) != ''
    )
  END
);
