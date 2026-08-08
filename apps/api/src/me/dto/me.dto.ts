import { IsString, MinLength } from 'class-validator';

export class LeaveGroupDto {
  @IsString()
  @MinLength(5, { message: 'La justificación debe tener al menos 5 caracteres' })
  reason!: string;
}
