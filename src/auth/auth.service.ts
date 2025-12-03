import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);

    // grava refresh token hash
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.returnSafeUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Credenciais inválidas');

    const tokens = await this.generateTokens(user.id, user.role);

    // atualiza refresh token no banco
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.returnSafeUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'Logout bem-sucedido' };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    return user;
  }

  /* ----------------------------------------
   * REFRESH TOKEN
   * -------------------------------------- */
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      return this.generateTokens(payload.sub, payload.role);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRt = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashedRt },
    });
  }

  generateTokens(userId: number, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, role },
      { expiresIn: '15m', secret: process.env.JWT_SECRET },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, role },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    return { accessToken, refreshToken };
  }

  private returnSafeUser(user: any) {
    const { password, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
