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
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const coverUrl = await this.uploadService.processCoverImage(file);
    const post = await this.postsService.updateCover(
      +id,
      coverUrl,
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
}
