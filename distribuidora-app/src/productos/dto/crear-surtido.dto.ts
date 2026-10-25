import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LineaSurtidoDto } from './linea-surtido.dto';

export class CrearSurtidoDto {
  @ApiProperty({ type: [LineaSurtidoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => LineaSurtidoDto)
  lineas!: LineaSurtidoDto[];
}
