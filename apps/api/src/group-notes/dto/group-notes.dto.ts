import { IsString, MaxLength, MinLength } from 'class-validator';

/** Create or update a group follow-up note (CT-049). */
export class UpsertGroupNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
