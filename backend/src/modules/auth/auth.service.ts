import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { env } from '../../config/env';
import { SALT_ROUNDS } from '../../config/constants';
import { ConflictError, UnauthorizedError } from '../../shared/errors/AppError';
import { JwtPayload } from '../../shared/types/express';
import { RegisterInput, LoginInput } from './auth.schemas';

const TAG = 'AuthService';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email already in use');

    if (input.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!dept) throw new ConflictError('Department not found');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role,
        currency: input.currency,
        departmentId: input.departmentId,
      },
      select: {
        id: true, email: true, name: true, role: true, currency: true,
        departmentId: true, createdAt: true,
      },
    });

    const token = this.signToken(user);
    return { user, token };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true, email: true, name: true, role: true, currency: true,
        departmentId: true, passwordHash: true, createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    const { passwordHash: _, ...safeUser } = user;
    const token = this.signToken(safeUser);
    return { user: safeUser, token };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, currency: true,
        departmentId: true, department: { select: { id: true, name: true } }, createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedError();
    return user;
  }

  private signToken(user: { id: string; email: string; role: string; currency: string; departmentId?: string | null }): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      currency: user.currency,
      ...(user.departmentId && { departmentId: user.departmentId }),
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  }
}

export const authService = new AuthService();
