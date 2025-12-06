import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    example: 'Como começar com NestJS',
    description: 'Título do post',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({
    example: 'Neste artigo vamos aprender os fundamentos do NestJS...',
    description: 'Conteúdo do post',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Se o post está publicado',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID da categoria',
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'https://meusite.com/imagem.jpg',
    description: 'URL da imagem de capa do post',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
