import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async processCoverImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    // URL pública que o Cloudinary retorna
    const publicUrl = file.path;

    // public_id do Cloudinary (ex: covers/asdf123)
    const publicId = file.filename;

    return {
      url: publicUrl,
      publicId,
    };
  }

  async processAvatar(file: Express.Multer.File, userId: number) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const publicUrl = file.path;
    const publicId = file.filename;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: publicUrl },
    });

    return {
      url: publicUrl,
      publicId,
    };
  }
}
