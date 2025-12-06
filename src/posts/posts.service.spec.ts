import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: Role.CLIENT,
    avatar: null,
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    content: 'Test Content',
    slug: 'test-post',
    published: true,
    authorId: 1,
    categoryId: 1,
    coverImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, name: 'Test User', email: 'test@test.com', avatar: null },
    category: { id: 1, name: 'Test Category' },
  };

  const mockComment = {
    id: 1,
    content: 'Test Comment',
    postId: 1,
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, name: 'Test User', email: 'test@test.com', avatar: null },
    post: { id: 1, title: 'Test Post', slug: 'test-post' },
  };

  const mockPrismaService = {
    post: {
      create: jest.fn().mockResolvedValue(mockPost),
      findMany: jest.fn().mockResolvedValue([mockPost]),
      findUnique: jest.fn().mockResolvedValue(mockPost),
      update: jest.fn().mockResolvedValue(mockPost),
      delete: jest.fn().mockResolvedValue(mockPost),
      count: jest.fn().mockResolvedValue(1),
    },
    comment: {
      create: jest.fn().mockResolvedValue(mockComment),
      findMany: jest.fn().mockResolvedValue([mockComment]),
      findUnique: jest.fn().mockResolvedValue(mockComment),
      update: jest.fn().mockResolvedValue(mockComment),
      delete: jest.fn().mockResolvedValue(mockComment),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const createPostDto = {
        title: 'Test Post',
        content: 'Test Content',
        categoryId: 1,
      };

      const result = await service.create(createPostDto, 1);

      expect(prisma.post.create).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const filters = { page: 1, limit: 10 };

      const result = await service.findAll(filters);

      expect(prisma.post.findMany).toHaveBeenCalled();
      expect(prisma.post.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter posts by search query', async () => {
      const filters = { page: 1, limit: 10, search: 'Test' };

      await service.findAll(filters);

      expect(prisma.post.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a post by id', async () => {
      const result = await service.findOne(1);

      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a post by slug', async () => {
      const result = await service.findBySlug('test-post');

      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-post' },
        }),
      );
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a post by author', async () => {
      const updatePostDto = { title: 'Updated Title' };

      const result = await service.update(1, updatePostDto, 1, Role.CLIENT);

      expect(prisma.post.update).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });

    it('should update a post by admin', async () => {
      const updatePostDto = { title: 'Updated Title' };

      const result = await service.update(1, updatePostDto, 2, Role.ADMIN);

      expect(prisma.post.update).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });

    it('should throw ForbiddenException if user is not author or admin', async () => {
      const updatePostDto = { title: 'Updated Title' };

      await expect(
        service.update(1, updatePostDto, 999, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);
      const updatePostDto = { title: 'Updated Title' };

      await expect(
        service.update(999, updatePostDto, 1, Role.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a post by author', async () => {
      const result = await service.remove(1, 1, Role.CLIENT);

      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.message).toBe('Post deletado com sucesso');
    });

    it('should delete a post by admin', async () => {
      const result = await service.remove(1, 2, Role.ADMIN);

      expect(prisma.post.delete).toHaveBeenCalled();
      expect(result.message).toBe('Post deletado com sucesso');
    });

    it('should throw ForbiddenException if not authorized', async () => {
      await expect(service.remove(1, 999, Role.CLIENT)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const createCommentDto = { content: 'Test Comment' };

      const result = await service.createComment(1, createCommentDto, 1);

      expect(prisma.comment.create).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);
      const createCommentDto = { content: 'Test Comment' };

      await expect(
        service.createComment(999, createCommentDto, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findComments', () => {
    it('should return comments for a post', async () => {
      const result = await service.findComments(1);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postId: 1 },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.findComments(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateComment', () => {
    it('should update a comment by author', async () => {
      const updateCommentDto = { content: 'Updated Comment' };

      const result = await service.updateComment(
        1,
        1,
        updateCommentDto,
        1,
        Role.CLIENT,
      );

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateCommentDto,
      });
      expect(result).toEqual(mockComment);
    });

    it('should update a comment by admin', async () => {
      const updateCommentDto = { content: 'Updated Comment' };

      const result = await service.updateComment(
        1,
        1,
        updateCommentDto,
        2,
        Role.ADMIN,
      );

      expect(prisma.comment.update).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });

    it('should throw ForbiddenException if not authorized', async () => {
      const updateCommentDto = { content: 'Updated Comment' };

      await expect(
        service.updateComment(1, 1, updateCommentDto, 999, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);
      const updateCommentDto = { content: 'Updated Comment' };

      await expect(
        service.updateComment(999, 1, updateCommentDto, 1, Role.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValueOnce(null);
      const updateCommentDto = { content: 'Updated Comment' };

      await expect(
        service.updateComment(1, 999, updateCommentDto, 1, Role.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeComment', () => {
    it('should delete a comment by author', async () => {
      const result = await service.removeComment(1, 1, 1, Role.CLIENT);

      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.message).toBe('Comentário deletado com sucesso');
    });

    it('should delete a comment by admin', async () => {
      const result = await service.removeComment(1, 1, 2, Role.ADMIN);

      expect(prisma.comment.delete).toHaveBeenCalled();
      expect(result.message).toBe('Comentário deletado com sucesso');
    });

    it('should throw ForbiddenException if not authorized', async () => {
      await expect(
        service.removeComment(1, 1, 999, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeComment(999, 1, 1, Role.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeComment(1, 999, 1, Role.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCover', () => {
    it('should update cover image', async () => {
      const result = await service.updateCover(
        1,
        'http://example.com/cover.jpg',
        1,
        Role.CLIENT,
      );

      expect(prisma.post.update).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });

    it('should throw ForbiddenException if not authorized', async () => {
      await expect(
        service.updateCover(
          1,
          'http://example.com/cover.jpg',
          999,
          Role.CLIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteCoverImage', () => {
    it('should delete cover image by author', async () => {
      const result = await service.deleteCoverImage(1, 1, Role.CLIENT);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { coverImage: null },
      });
      expect(result.message).toBe('Capa deletada com sucesso');
    });

    it('should delete cover image by admin', async () => {
      const result = await service.deleteCoverImage(1, 2, Role.ADMIN);

      expect(prisma.post.update).toHaveBeenCalled();
      expect(result.message).toBe('Capa deletada com sucesso');
    });

    it('should throw ForbiddenException if not authorized', async () => {
      await expect(
        service.deleteCoverImage(1, 999, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.deleteCoverImage(999, 1, Role.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAvatarImage', () => {
    it('should delete avatar image', async () => {
      const result = await service.deleteAvatarImage(1, Role.CLIENT);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { avatar: null },
      });
      expect(result.message).toBe('Avatar deletado com sucesso');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteAvatarImage(999, Role.CLIENT)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
