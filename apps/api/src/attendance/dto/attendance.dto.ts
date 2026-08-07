import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class AttendanceQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe ser YYYY-MM-DD',
  })
  date!: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

export class UpsertAttendanceDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe ser YYYY-MM-DD',
  })
  date!: string;

  @IsString()
  studentId!: string;

  @IsOptional()
  @IsBoolean()
  present?: boolean;

  @IsOptional()
  @IsBoolean()
  participated?: boolean;
}

export class CourseIdParamDto {
  @IsString()
  courseId!: string;
}
