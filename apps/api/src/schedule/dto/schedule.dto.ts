import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { ClassActivityType } from '@prisma/client'

export class CourseIdParamDto {
  @IsString()
  courseId!: string
}

export class SessionIdParamDto {
  @IsString()
  courseId!: string

  @IsString()
  sessionId!: string
}

export class ItemIdParamDto {
  @IsString()
  courseId!: string

  @IsString()
  sessionId!: string

  @IsString()
  itemId!: string
}

export class ScheduleItemInputDto {
  @IsString()
  @MinLength(1)
  title!: string

  @IsEnum(ClassActivityType)
  activityType!: ClassActivityType

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean
}

export class CreateSessionDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe ser YYYY-MM-DD',
  })
  date!: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemInputDto)
  items!: ScheduleItemInputDto[]

  /** If set, marks mandatorySource=manual */
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean
}

export class UpdateSessionDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe ser YYYY-MM-DD',
  })
  date?: string

  /** Teacher override → mandatorySource=manual */
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean

  /** Reset to derived from items */
  @IsOptional()
  @IsBoolean()
  useDerivedMandatory?: boolean
}

export class CreateItemDto {
  @IsString()
  @MinLength(1)
  title!: string

  @IsEnum(ClassActivityType)
  activityType!: ClassActivityType

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string

  @IsOptional()
  @IsEnum(ClassActivityType)
  activityType?: ClassActivityType

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}

export class ActivityTypeDefaultDto {
  @IsEnum(ClassActivityType)
  activityType!: ClassActivityType

  @IsBoolean()
  isMandatoryByDefault!: boolean

  @IsBoolean()
  allowsAttendance!: boolean
}

export class UpdatePolicyDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(40)
  maxAbsencesAllowed?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityTypeDefaultDto)
  activityTypeDefaults?: ActivityTypeDefaultDto[]
}
