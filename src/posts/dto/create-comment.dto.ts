import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Conteúdo do comentário' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
