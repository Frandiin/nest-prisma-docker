import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  Put,
  Patch,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { cloudinaryStorage } from '../cloudinary/cloudinary.storage';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadService: UploadService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo post' })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() dto: CreatePostDto, @Request() req: any) {
    return this.postsService.create(dto, req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Adicionar comentário a um post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Adicionar comentário a um post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  createComment(
    @Param('id') postId: number, // <-- aqui estava 'postId', tem que ser 'id'
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.id; // pega do JWT
    return this.postsService.createComment(postId, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/comments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar comentários de um post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Lista de comentários' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  findComments(@Param('id') postId: string) {
    return this.postsService.findComments(+postId);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':id/cover')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload de imagem de capa para post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imagem de capa atualizada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @UseInterceptors(FileInterceptor('file', { storage: cloudinaryStorage }))
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const coverUrl = await this.uploadService.processCoverImage(file);
    const post = await this.postsService.updateCover(
      +id,
      coverUrl.url,
      req.user.id,
      req.user.role,
    );

    return {
      message: 'Imagem de capa atualizada com sucesso',
      coverImage: post.coverImage,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar posts com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de posts' })
  findAll(@Query() filters: FilterPostDto) {
    return this.postsService.findAll(filters);
  }
  @UseGuards(JwtAuthGuard)
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter post por slug' })
  @ApiParam({ name: 'slug', type: 'string', description: 'Slug do post' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter post por ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post atualizado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Request() req: any,
  ) {
    return this.postsService.update(+id, dto, req.user.id, req.user.role);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deletar post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post deletado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.postsService.remove(+id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':postId/comments/:commentId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar comentário' })
  @ApiParam({ name: 'postId', type: 'number', description: 'ID do post' })
  @ApiParam({ name: 'commentId', type: 'number', description: 'ID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário atualizado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post ou comentário não encontrado' })
  updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: any,
  ) {
    return this.postsService.updateComment(
      +postId,
      +commentId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId/comments/:commentId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deletar comentário' })
  @ApiParam({ name: 'postId', type: 'number', description: 'ID do post' })
  @ApiParam({ name: 'commentId', type: 'number', description: 'ID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário deletado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post ou comentário não encontrado' })
  removeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return this.postsService.removeComment(
      +postId,
      +commentId,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/cover')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deletar imagem de capa do post' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Imagem de capa deletada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  deleteCoverImage(@Param('id') id: string, @Request() req: any) {
    return this.postsService.deleteCoverImage(+id, req.user.id, req.user.role);
  }
}
