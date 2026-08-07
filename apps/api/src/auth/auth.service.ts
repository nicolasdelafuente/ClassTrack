import {
  ConflictException,
  Injectable,
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
 * DEMO auth for MVP (CT-038 / CT-039).
 * Passwords are compared as plain text — replace before any real deploy.
 */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthUserResponse> {
    const email = normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ese email ya está registrado');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password: dto.password,
        role: dto.role as UserRole,
        displayName: dto.displayName?.trim() || null,
      },
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
}

function normalizeEmail(email: string): string {
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
