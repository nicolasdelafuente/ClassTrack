import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const SPRINT_STATUSES = ['unknown', 'ok', 'attention', 'critical'] as const;

export class UpdateSprintDto {
  @IsIn(SPRINT_STATUSES)
  status!: (typeof SPRINT_STATUSES)[number];
}

export class GithubRepoLinkDto {
  @IsUrl({ require_protocol: true })
  url!: string;

  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsString()
  @IsOptional()
  branch?: string | null;
}

export class UpdateLinksDto {
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsUrl({ require_protocol: true })
  @IsOptional()
  githubWorkspaceUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GithubRepoLinkDto)
  githubRepos?: GithubRepoLinkDto[] | null;

  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsUrl({ require_protocol: true })
  @IsOptional()
  trelloUrl?: string | null;

  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsUrl({ require_protocol: true })
  @IsOptional()
  driveUrl?: string | null;
}

/** Assign or clear group tutor (CT-044). null = sin tutor. */
export class UpdateTutorDto {
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @IsOptional()
  tutorUserId?: string | null;
}

export class GroupIdParamDto {
  @IsString()
  groupId!: string;
}

export class UpdateSprintParamsDto {
  @IsString()
  groupId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  sprintNumber!: number;
}

/** Teacher override: add a student to a group (CT-045). */
export class AddGroupMemberDto {
  @IsString()
  @MinLength(1)
  studentId!: string;
}

export class GroupMemberParamsDto {
  @IsString()
  groupId!: string;

  @IsString()
  studentId!: string;
}
