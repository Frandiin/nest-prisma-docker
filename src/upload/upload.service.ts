import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly uploadsDir = './uploads';
  private readonly avatarsDir = `${this.uploadsDir}/avatars`;
  private readonly coversDir = `${this.uploadsDir}/covers`;

  async processAvatar(
    file: Express.Multer.File,
    userId: number,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo inválido. Use JPEG, PNG ou WebP',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo 5MB');
    }

    const filename = `avatar-${userId}-${Date.now()}.webp`;
    const filepath = `${this.avatarsDir}/${filename}`;

    await this.ensureDirectoryExists(this.avatarsDir);

    await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(filepath);

    const publicPath = `/uploads/avatars/${filename}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: publicPath },
    });

    return publicPath;
  }

  async processCoverImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo inválido. Use JPEG, PNG ou WebP',
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo 10MB');
    }

    const filename = `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const filepath = `${this.coversDir}/${filename}`;

    await this.ensureDirectoryExists(this.coversDir);

    await sharp(file.buffer)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/covers/${filename}`;
  }

  async deleteFile(filepath: string): Promise<void> {
    if (!filepath) return;
    const fullPath = `.${filepath}`;
    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}
