import {
  IsBoolean,
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
