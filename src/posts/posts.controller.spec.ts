import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UploadService } from '../upload/upload.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Role } from '@prisma/client';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: Role.CLIENT,
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    content: 'Test Content',
    slug: 'test-post',
    published: true,
    authorId: 1,
    categoryId: 1,
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
  };

  const mockPostsService = {
    create: jest.fn().mockResolvedValue(mockPost),
    findAll: jest.fn().mockResolvedValue({
      data: [mockPost],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(mockPost),
    findBySlug: jest.fn().mockResolvedValue(mockPost),
    update: jest.fn().mockResolvedValue(mockPost),
    updateCover: jest
      .fn()
      .mockResolvedValue({
        ...mockPost,
        coverImage: 'http://example.com/cover.jpg',
      }),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Post deletado com sucesso' }),
    createComment: jest.fn().mockResolvedValue(mockComment),
    findComments: jest.fn().mockResolvedValue([mockComment]),
    updateComment: jest.fn().mockResolvedValue(mockComment),
    removeComment: jest
      .fn()
      .mockResolvedValue({ message: 'Comentário deletado com sucesso' }),
    deleteCoverImage: jest
      .fn()
      .mockResolvedValue({ message: 'Capa deletada com sucesso' }),
  };

  const mockUploadService = {
    processCoverImage: jest
      .fn()
      .mockResolvedValue({ url: 'http://example.com/cover.jpg' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useValue: mockPostsService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        categoryId: 1,
      };
      const req = { user: mockUser };

      const result = await controller.create(createPostDto, req);

      expect(postsService.create).toHaveBeenCalledWith(
        createPostDto,
        mockUser.id,
      );
      expect(result).toEqual(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const filters = { page: 1, limit: 10 };

      const result = await controller.findAll(filters);

      expect(postsService.findAll).toHaveBeenCalledWith(filters);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a post by id', async () => {
      const result = await controller.findOne('1');

      expect(postsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPost);
    });
  });

  describe('findBySlug', () => {
    it('should return a post by slug', async () => {
      const result = await controller.findBySlug('test-post');

      expect(postsService.findBySlug).toHaveBeenCalledWith('test-post');
      expect(result).toEqual(mockPost);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updatePostDto: UpdatePostDto = { title: 'Updated Title' };
      const req = { user: mockUser };

      const result = await controller.update('1', updatePostDto, req);

      expect(postsService.update).toHaveBeenCalledWith(
        1,
        updatePostDto,
        mockUser.id,
        mockUser.role,
      );
      expect(result).toEqual(mockPost);
    });
  });

  describe('remove', () => {
    it('should delete a post', async () => {
      const req = { user: mockUser };

      const result = await controller.remove('1', req);

      expect(postsService.remove).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
      );
      expect(result.message).toBe('Post deletado com sucesso');
    });
  });

  describe('createComment', () => {
    it('should create a comment on a post', async () => {
      const createCommentDto: CreateCommentDto = { content: 'Test Comment' };
      const req = { user: mockUser };

      const result = await controller.createComment(1, createCommentDto, req);

      expect(postsService.createComment).toHaveBeenCalledWith(
        1,
        createCommentDto,
        mockUser.id,
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('findComments', () => {
    it('should return comments for a post', async () => {
      const result = await controller.findComments('1');

      expect(postsService.findComments).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const updateCommentDto: UpdateCommentDto = { content: 'Updated Comment' };
      const req = { user: mockUser };

      const result = await controller.updateComment(
        '1',
        '1',
        updateCommentDto,
        req,
      );

      expect(postsService.updateComment).toHaveBeenCalledWith(
        1,
        1,
        updateCommentDto,
        mockUser.id,
        mockUser.role,
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('removeComment', () => {
    it('should delete a comment', async () => {
      const req = { user: mockUser };

      const result = await controller.removeComment('1', '1', req);

      expect(postsService.removeComment).toHaveBeenCalledWith(
        1,
        1,
        mockUser.id,
        mockUser.role,
      );
      expect(result.message).toBe('Comentário deletado com sucesso');
    });
  });

  describe('deleteCoverImage', () => {
    it('should delete cover image from a post', async () => {
      const req = { user: mockUser };

      const result = await controller.deleteCoverImage('1', req);

      expect(postsService.deleteCoverImage).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
      );
      expect(result.message).toBe('Capa deletada com sucesso');
    });
  });

  describe('uploadCover', () => {
    it('should upload cover image for a post', async () => {
      const req = { user: mockUser };
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from(''),
        size: 1000,
      } as Express.Multer.File;

      const result = await controller.uploadCover('1', mockFile, req);

      expect(mockUploadService.processCoverImage).toHaveBeenCalledWith(
        mockFile,
      );
      expect(postsService.updateCover).toHaveBeenCalledWith(
        1,
        'http://example.com/cover.jpg',
        mockUser.id,
        mockUser.role,
      );
      expect(result.message).toBe('Imagem de capa atualizada com sucesso');
    });
  });
});
