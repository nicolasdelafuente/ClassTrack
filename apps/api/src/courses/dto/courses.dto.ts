import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
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

