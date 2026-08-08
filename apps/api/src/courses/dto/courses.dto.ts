import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DuplicateCourseDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  /** New calendar date for the first class of the source cronograma. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'firstSessionDate debe ser YYYY-MM-DD',
  })
  firstSessionDate!: string;

  /** Mark the copy as the current course (default true). */
  @IsOptional()
  @IsBoolean()
  setAsCurrent?: boolean;

  /** Copy group shells without students/links (default true). */
  @IsOptional()
  @IsBoolean()
  copyEmptyGroups?: boolean;
}

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsIn(['teacher', 'student'])
  role!: 'teacher' | 'student';
}

export class BroadcastEmailDto {
  @IsString()
  @MinLength(1)
  subject!: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsIn(['all', 'group', 'student'])
  audience!: 'all' | 'group' | 'student';

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}

/** One batch when creating empty group shells (CT-045). */
export class GroupStructureBatchDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  count!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  capacity!: number;
}

export class CreateGroupStructureDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupStructureBatchDto)
  batches!: GroupStructureBatchDto[];
}

export class UpdateGroupEnrollmentDto {
  @IsBoolean()
  open!: boolean;
}

