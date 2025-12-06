import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { Role } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePostDto, authorId: number) {
    const slug = this.generateSlug(dto.title);

    return this.prisma.post.create({
      data: {
        ...dto,
        slug,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
      },
    });
  }

  async createComment(postId: number, dto: CreateCommentDto, authorId: number) {
    // Verifica se o post existe
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        post: { connect: { id: postId } },
        author: { connect: { id: authorId } },
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  async findComments(postId: number) {
    // Verifica se o post existe
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    return this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(filters: FilterPostDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      authorId,
      published,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (published !== undefined) {
      where.published = published;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          category: true,
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    return post;
  }

  async update(id: number, dto: UpdatePostDto, userId: number, userRole: Role) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este post',
      );
    }

    const updateData: any = { ...dto };

    if (dto.title) {
      updateData.slug = this.generateSlug(dto.title);
    }

    return this.prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
      },
    });
  }

  async updateCover(
    id: number,
    coverImage: string,
    userId: number,
    userRole: Role,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este post',
      );
    }

    return this.prisma.post.update({
      where: { id },
      data: { coverImage },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
      },
    });
  }

  async remove(id: number, userId: number, userRole: Role) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este post',
      );
    }

    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deletado com sucesso' };
  }

  async removeComment(postId: number, commentId: number, userId: number, userRole: Role) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comment.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este comentário',
      );
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: 'Comentário deletado com sucesso' };
  }

  async updateComment(postId: number, commentId: number, dto: UpdateCommentDto, userId: number, userRole: Role) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comment.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este comentário',
      );
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: dto,
    });
  }

  async deleteCoverImage(postId: number, userId: number, userRole: Role) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar a capa deste post',
      );
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { coverImage: null },
    });

    return { message: 'Capa deletada com sucesso' };
  }

  async deleteAvatarImage(userId: number, userRole: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar o avatar deste usuário',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    return { message: 'Avatar deletado com sucesso' };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
