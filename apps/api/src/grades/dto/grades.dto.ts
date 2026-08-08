import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Body to set preliminary or final mark (1–10 or A). */
export class UpsertStudentGradeDto {
  @ValidateIf((o) => !o.isAbsent && o.clear !== true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  score?: number | null;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  /** Clear mark (unset). */
  @IsOptional()
  @IsBoolean()
  clear?: boolean;

  /** Only for preliminary grades. */
  @IsOptional()
  @IsString()
  comment?: string | null;
}

export class UpdateGroupPreliminaryCommentDto {
  @IsOptional()
  @IsString()
  comment?: string | null;
}
