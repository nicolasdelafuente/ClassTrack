import { IsEmail, IsString, MinLength } from 'class-validator';

export class LeaveGroupDto {
  @IsString()
  @MinLength(5, { message: 'La justificación debe tener al menos 5 caracteres' })
  reason!: string;
}

/** Student self-service: contact + login email (kept in sync). */
export class UpdateMeProfileDto {
  @IsEmail({}, { message: 'Ingresá un email válido' })
  email!: string;
}
