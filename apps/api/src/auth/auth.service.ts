import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UserRoleValue } from './dto/auth.dto';

/** Public shape returned to the client (never includes password). */
export type AuthUserResponse = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRoleValue;
};

/**
 * DEMO auth for MVP (CT-038 / CT-042).
 * Passwords are compared as plain text — replace before any real deploy.
 * Registration requires a valid unused invite token.
 */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvitePreview(token: string) {
    const invite = await this.findValidInvite(token);
    return {
      email: invite.email,
      role: invite.role as UserRoleValue,
      expiresAt: invite.expiresAt.toISOString(),
      courseName: invite.course?.name ?? null,
    };
  }

  async register(dto: RegisterDto): Promise<AuthUserResponse> {
    const invite = await this.findValidInvite(dto.token);
    const email = invite.email;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ese email ya está registrado');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          password: dto.password,
          role: invite.role,
          displayName: dto.displayName?.trim() || null,
          studentId:
            invite.role === UserRole.student ? invite.studentId : null,
        },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      return created;
    });

    return toAuthUser(user);
  }

  async login(dto: LoginDto): Promise<AuthUserResponse> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same message for missing user / wrong password (MVP simplicity)
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    return toAuthUser(user);
  }

  /** Teachers available as group tutors (CT-044). */
  async listTeachers() {
    const teachers = await this.prisma.user.findMany({
      where: { role: UserRole.teacher },
      orderBy: [{ displayName: 'asc' }, { email: 'asc' }],
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });
    return teachers;
  }

  private async findValidInvite(token: string) {
    const trimmed = token?.trim();
    if (!trimmed) {
      throw new BadRequestException(
        'Falta el token de invitación. Pedile el link a tu docente.',
      );
    }

    const invite = await this.prisma.invite.findUnique({
      where: { token: trimmed },
      include: { course: { select: { name: true } } },
    });
    if (!invite) {
      throw new NotFoundException('Invitación no válida o inexistente');
    }
    if (invite.usedAt) {
      throw new BadRequestException('Esta invitación ya fue usada');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Esta invitación venció');
    }
    return invite;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthUser(user: {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
}): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
