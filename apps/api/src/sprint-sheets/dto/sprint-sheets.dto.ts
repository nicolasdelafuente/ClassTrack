import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const TASK_CATEGORIES = [
  'backend',
  'frontend',
  'documentation',
  'testing',
  'devops',
  'design',
  'other',
] as const;

export const SHEET_STATUSES = [
  'draft',
  'in_review',
  'needs_changes',
  'approved',
] as const;

export class SheetTaskInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsIn(TASK_CATEGORIES)
  category!: (typeof TASK_CATEGORIES)[number];

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  completed?: boolean | null;

  @IsOptional()
  @IsString()
  incompleteReason?: string | null;

  @IsOptional()
  @IsBoolean()
  isExtra?: boolean;

  @IsOptional()
  @IsString()
  extraReason?: string | null;

  @IsOptional()
  @IsString()
  sourceTaskId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateSheetTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SheetTaskInputDto)
  tasks!: SheetTaskInputDto[];
}

export class RequestChangesDto {
  @IsString()
  @MinLength(5, { message: 'El comentario debe tener al menos 5 caracteres' })
  comment!: string;
}

export class SprintParamDto {
  @IsString()
  groupId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  sprintNumber!: number;
}

export class SheetIdParamDto {
  @IsString()
  sheetId!: string;
}
