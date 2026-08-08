import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const USER_ROLES = ['teacher', 'student'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

/** Register only via invite token (CT-042). Email/role come from the invite. */
export class RegisterDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsString()
  @MinLength(4)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
