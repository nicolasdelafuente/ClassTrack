import { IsIn, IsInt, IsOptional, IsString, IsUrl, Max, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

const SPRINT_STATUSES = ['unknown', 'ok', 'attention', 'critical'] as const;

export class UpdateSprintDto {
  @IsIn(SPRINT_STATUSES)
  status!: (typeof SPRINT_STATUSES)[number];
}

export class UpdateLinksDto {
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsUrl({ require_protocol: true })
  @IsOptional()
  githubUrl?: string | null;

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
