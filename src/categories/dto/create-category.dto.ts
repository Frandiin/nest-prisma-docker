import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Tecnologia',
    description: 'Nome da categoria',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({
    example: 'Artigos sobre tecnologia e programação',
    description: 'Descrição da categoria',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
